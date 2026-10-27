from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.user import User, UserRole
from app.models.hearing import Hearing, HearingStatus
from app.models.case import Case
from app.models.advocate import Advocate
from app.schemas.hearing import HearingCreate, HearingUpdate, HearingOut
from app.core.dependencies import get_current_user
from app.services.advocate_replacement import find_replacement_advocate
from app.services.notification_service import send_notification

router = APIRouter(prefix="/api/hearings", tags=["Hearings"])


@router.post("/", response_model=HearingOut, status_code=201)
async def schedule_hearing(
    body: HearingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Fetch the case to get advocate
    case_result = await db.execute(select(Case).where(Case.id == body.case_id))
    case = case_result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    hearing = Hearing(
        case_id=body.case_id,
        advocate_id=case.advocate_id,
        scheduled_date=body.scheduled_date,
        court_name=body.court_name,
        court_room=body.court_room,
        judge_name=body.judge_name,
        notes=body.notes,
    )
    db.add(hearing)
    await db.flush()
    await db.refresh(hearing)
    return HearingOut.model_validate(hearing)


@router.get("/case/{case_id}", response_model=List[HearingOut])
async def get_case_hearings(
    case_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Hearing).where(Hearing.case_id == case_id).order_by(Hearing.scheduled_date)
    )
    return [HearingOut.model_validate(h) for h in result.scalars().all()]


@router.get("/upcoming", response_model=List[HearingOut])
async def get_upcoming_hearings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime
    query = select(Hearing).where(
        Hearing.scheduled_date >= datetime.utcnow(),
        Hearing.status == HearingStatus.scheduled
    )

    if current_user.role == UserRole.advocate:
        adv_result = await db.execute(select(Advocate).where(Advocate.user_id == current_user.id))
        adv = adv_result.scalar_one_or_none()
        if adv:
            query = query.where(Hearing.advocate_id == adv.id)
    elif current_user.role == UserRole.citizen:
        # Get cases for this citizen
        cases_result = await db.execute(select(Case.id).where(Case.citizen_id == current_user.id))
        case_ids = [r[0] for r in cases_result.all()]
        query = query.where(Hearing.case_id.in_(case_ids))

    result = await db.execute(query.order_by(Hearing.scheduled_date))
    return [HearingOut.model_validate(h) for h in result.scalars().all()]


@router.put("/{hearing_id}", response_model=HearingOut)
async def update_hearing(
    hearing_id: UUID,
    body: HearingUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Hearing).where(Hearing.id == hearing_id))
    hearing = result.scalar_one_or_none()
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(hearing, field, value)
    await db.flush()
    await db.refresh(hearing)
    return HearingOut.model_validate(hearing)


# ── Advocate absent → trigger auto-replacement ────────────────────────────────
@router.post("/{hearing_id}/replace-advocate", response_model=HearingOut)
async def replace_advocate_for_hearing(
    hearing_id: UUID,
    reason: str = "Advocate unavailable",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Hearing).where(Hearing.id == hearing_id))
    hearing = result.scalar_one_or_none()
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")

    # Get case category for matching
    case_result = await db.execute(select(Case).where(Case.id == hearing.case_id))
    case = case_result.scalar_one_or_none()

    replacement = await find_replacement_advocate(
        db=db,
        original_advocate_id=hearing.advocate_id,
        case_category=case.category if case else None,
        court_location=hearing.court_name,
    )

    if not replacement:
        raise HTTPException(status_code=404, detail="No available replacement advocate found")

    hearing.replaced_advocate_id = hearing.advocate_id
    hearing.replacement_reason = reason
    hearing.advocate_id = replacement.id
    # Also update the case's current advocate
    if case:
        case.advocate_id = replacement.id

    await db.flush()
    await db.refresh(hearing)
    return HearingOut.model_validate(hearing)
