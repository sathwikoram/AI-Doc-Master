from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.models.user import User, UserRole
from app.models.case import Case, CaseDocument, CaseNote, CaseStatus
from app.models.advocate import Advocate
from app.schemas.case import CaseCreate, CaseUpdate, CaseOut, CaseNoteCreate, CaseNoteOut
from app.core.dependencies import get_current_user
from app.services.storage import save_file
from app.services.ai_service import analyze_case_ai

router = APIRouter(prefix="/api/cases", tags=["Cases"])


async def _enrich_case(case: Case) -> CaseOut:
    return CaseOut.model_validate(case)


# ── Citizen: submit a new case ─────────────────────────────────────────────────
@router.post("/", response_model=CaseOut, status_code=201)
async def create_case(
    body: CaseCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    case = Case(
        title=body.title,
        description=body.description,
        priority=body.priority,
        court_location=body.court_location,
        tags=body.tags,
        citizen_id=current_user.id,
    )
    db.add(case)
    await db.flush()
    await db.refresh(case)

    # Trigger AI analysis in background
    background_tasks.add_task(analyze_case_ai, str(case.id), body.description)
    return CaseOut.model_validate(case)


# ── List cases (role-aware) ────────────────────────────────────────────────────
@router.get("/", response_model=List[CaseOut])
async def list_cases(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Case)

    if current_user.role == UserRole.citizen:
        query = query.where(Case.citizen_id == current_user.id)
    elif current_user.role == UserRole.advocate:
        # find advocate record
        adv_result = await db.execute(select(Advocate).where(Advocate.user_id == current_user.id))
        adv = adv_result.scalar_one_or_none()
        if not adv:
            return []
        query = query.where(Case.advocate_id == adv.id)
    # admin sees all

    if status:
        query = query.where(Case.status == status)

    query = query.order_by(Case.created_at.desc())
    result = await db.execute(query)
    cases = result.scalars().all()
    return [CaseOut.model_validate(c) for c in cases]


# ── Get single case ────────────────────────────────────────────────────────────
@router.get("/{case_id}", response_model=CaseOut)
async def get_case(
    case_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return CaseOut.model_validate(case)


# ── Update case ────────────────────────────────────────────────────────────────
@router.put("/{case_id}", response_model=CaseOut)
async def update_case(
    case_id: UUID,
    body: CaseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(case, field, value)
    await db.flush()
    await db.refresh(case)
    return CaseOut.model_validate(case)


# ── Assign advocate to case ────────────────────────────────────────────────────
@router.post("/{case_id}/assign/{advocate_id}", response_model=CaseOut)
async def assign_advocate(
    case_id: UUID,
    advocate_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    adv_result = await db.execute(select(Advocate).where(Advocate.id == advocate_id))
    adv = adv_result.scalar_one_or_none()
    if not adv:
        raise HTTPException(status_code=404, detail="Advocate not found")

    case.advocate_id = advocate_id
    case.status = CaseStatus.lawyer_assigned
    await db.flush()
    await db.refresh(case)
    return CaseOut.model_validate(case)


# ── Document upload for a case ────────────────────────────────────────────────
@router.post("/{case_id}/documents")
async def upload_case_document(
    case_id: UUID,
    file: UploadFile = File(...),
    document_type: str = "general",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    file_url = await save_file(file, folder=f"cases/{case_id}")
    doc = CaseDocument(
        case_id=case_id,
        uploaded_by=current_user.id,
        file_name=file.filename,
        file_url=file_url,
        file_type=file.content_type,
        document_type=document_type,
    )
    db.add(doc)
    await db.flush()
    await db.refresh(doc)
    return {"id": str(doc.id), "file_url": doc.file_url, "file_name": doc.file_name}


@router.get("/{case_id}/documents")
async def get_case_documents(
    case_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CaseDocument).where(CaseDocument.case_id == case_id)
    )
    docs = result.scalars().all()
    return [{"id": str(d.id), "file_name": d.file_name, "file_url": d.file_url,
             "document_type": d.document_type, "created_at": d.created_at} for d in docs]


# ── Case notes ────────────────────────────────────────────────────────────────
@router.post("/{case_id}/notes", response_model=CaseNoteOut, status_code=201)
async def add_note(
    case_id: UUID,
    body: CaseNoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    note = CaseNote(
        case_id=case_id,
        author_id=current_user.id,
        content=body.content,
        is_private=body.is_private,
    )
    db.add(note)
    await db.flush()
    await db.refresh(note)
    return CaseNoteOut.model_validate(note)


@router.get("/{case_id}/notes", response_model=List[CaseNoteOut])
async def get_notes(
    case_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CaseNote).where(CaseNote.case_id == case_id).order_by(CaseNote.created_at)
    )
    notes = result.scalars().all()
    # Filter private notes for non-advocates
    if current_user.role == UserRole.citizen:
        notes = [n for n in notes if not n.is_private]
    return [CaseNoteOut.model_validate(n) for n in notes]
