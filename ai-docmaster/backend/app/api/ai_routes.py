"""
AI endpoints — classification, lawyer recommendation,
legal sections, judgement search, document checklist, chat assistant.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.models.user import User
from app.models.case import Case
from app.models.chat import ChatMessage
from app.core.dependencies import get_current_user
from app.services.ai_service import (
    classify_case,
    recommend_lawyers,
    suggest_legal_sections,
    search_judgements,
    get_document_checklist,
    summarize_document_text,
    assess_risk,
)
from app.services.chat_service import chat_with_ai

router = APIRouter(prefix="/api/ai", tags=["AI"])


# ── Case Classification ───────────────────────────────────────────────────────
class ClassifyRequest(BaseModel):
    description: str


@router.post("/classify")
async def classify(body: ClassifyRequest, current_user: User = Depends(get_current_user)):
    result = await classify_case(body.description)
    return result


# ── Lawyer Recommendation ─────────────────────────────────────────────────────
class LawyerRecommendRequest(BaseModel):
    case_description: str
    location: Optional[str] = None


@router.post("/recommend-lawyers")
async def recommend_lawyers_api(
    body: LawyerRecommendRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await recommend_lawyers(body.case_description, body.location, db)
    return result


# ── Legal Section Suggestion ──────────────────────────────────────────────────
class SectionRequest(BaseModel):
    case_description: str
    category: Optional[str] = None


@router.post("/legal-sections")
async def legal_sections(body: SectionRequest, current_user: User = Depends(get_current_user)):
    result = await suggest_legal_sections(body.case_description, body.category)
    return result


# ── Previous Judgement Search (RAG) ──────────────────────────────────────────
class JudgementRequest(BaseModel):
    case_description: str
    category: Optional[str] = None
    top_k: int = 5


@router.post("/judgements")
async def judgements(body: JudgementRequest, current_user: User = Depends(get_current_user)):
    result = await search_judgements(body.case_description, body.category, body.top_k)
    return result


# ── Document Checklist ────────────────────────────────────────────────────────
class ChecklistRequest(BaseModel):
    category: str
    description: Optional[str] = None


@router.post("/document-checklist")
async def document_checklist(body: ChecklistRequest, current_user: User = Depends(get_current_user)):
    result = await get_document_checklist(body.category, body.description)
    return result


# ── PDF / Document Summary ────────────────────────────────────────────────────
class SummaryRequest(BaseModel):
    text: str     # extracted text from PDF


@router.post("/summarize")
async def summarize(body: SummaryRequest, current_user: User = Depends(get_current_user)):
    summary = await summarize_document_text(body.text)
    return {"summary": summary}


# ── Risk Assessment ───────────────────────────────────────────────────────────
class RiskRequest(BaseModel):
    case_description: str
    category: Optional[str] = None


@router.post("/risk-assessment")
async def risk_assessment(body: RiskRequest, current_user: User = Depends(get_current_user)):
    result = await assess_risk(body.case_description, body.category)
    return result


# ── AI Chat Assistant ─────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    case_id: Optional[str] = None


@router.post("/chat")
async def chat(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Persist user message
    user_msg = ChatMessage(
        user_id=current_user.id,
        case_id=body.case_id,
        role="user",
        content=body.message,
        is_ai=False,
    )
    db.add(user_msg)
    await db.flush()

    # Get AI response
    response_text = await chat_with_ai(body.message, str(current_user.id), body.case_id)

    ai_msg = ChatMessage(
        user_id=current_user.id,
        case_id=body.case_id,
        role="assistant",
        content=response_text,
        is_ai=True,
    )
    db.add(ai_msg)
    await db.flush()

    return {"response": response_text}


@router.get("/chat/history")
async def chat_history(
    case_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(ChatMessage).where(ChatMessage.user_id == current_user.id)
    if case_id:
        query = query.where(ChatMessage.case_id == case_id)
    query = query.order_by(ChatMessage.created_at).limit(100)
    result = await db.execute(query)
    msgs = result.scalars().all()
    return [{"role": m.role, "content": m.content, "created_at": m.created_at} for m in msgs]
