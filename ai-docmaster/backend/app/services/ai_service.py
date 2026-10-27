"""
Central AI service — orchestrates all AI/NLP features:
  1. Case Classification (NLP)
  2. Lawyer Recommendation
  3. Legal Section Suggestion (BNS/IPC/Acts)
  4. Previous Judgement Search (RAG)
  5. Document Checklist Generation
  6. Document/PDF Summarization
  7. Risk Assessment
  8. Background task: full case analysis pipeline
"""
from __future__ import annotations
import asyncio
from typing import Optional
from loguru import logger

from app.services.case_classifier import classify_case
from app.services.lawyer_recommender import recommend_lawyers
from app.services.legal_sections import suggest_legal_sections
from app.services.judgement_rag import search_judgements
from app.services.document_checklist import get_document_checklist
from app.services.summarizer import summarize_document_text
from app.services.risk_assessor import assess_risk

__all__ = [
    "classify_case",
    "recommend_lawyers",
    "suggest_legal_sections",
    "search_judgements",
    "get_document_checklist",
    "summarize_document_text",
    "assess_risk",
    "analyze_case_ai",
]


async def analyze_case_ai(case_id: str, description: str) -> None:
    """
    Full AI pipeline triggered as a background task after case submission.
    Runs classification → sections → checklist → risk in parallel,
    then persists ai_analysis JSON back to the case row.
    """
    from app.database import AsyncSessionLocal
    from app.models.case import Case, CaseStatus
    from sqlalchemy import select

    logger.info(f"[AI Pipeline] Starting analysis for case {case_id}")
    try:
        # Run classification + sections + checklist + risk concurrently
        classification, sections, risk = await asyncio.gather(
            classify_case(description),
            suggest_legal_sections(description, None),
            assess_risk(description, None),
            return_exceptions=True,
        )

        category = classification.get("category") if isinstance(classification, dict) else "General"
        checklist = await get_document_checklist(category, description)

        ai_analysis = {
            "classification": classification if isinstance(classification, dict) else {},
            "sections": sections if isinstance(sections, dict) else {},
            "document_checklist": checklist if isinstance(checklist, dict) else {},
            "risk_assessment": risk if isinstance(risk, dict) else {},
        }

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Case).where(Case.id == case_id))
            case = result.scalar_one_or_none()
            if case:
                case.ai_analysis = ai_analysis
                case.category = category
                case.status = CaseStatus.ai_analyzed
                await db.commit()
                logger.info(f"[AI Pipeline] Case {case_id} analyzed → category: {category}")
    except Exception as e:
        logger.error(f"[AI Pipeline] Error for case {case_id}: {e}")
