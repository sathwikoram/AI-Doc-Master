"""
Lawyer Recommendation Service
Scores advocates based on:
  - Practice area match to case category        (40 pts)
  - Location proximity                           (25 pts)
  - Win rate                                     (15 pts)
  - Rating                                       (10 pts)
  - Years of experience                          (10 pts)
  - Availability bonus                            (5 pts)
Returns ranked list with match scores.
"""
from __future__ import annotations
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger
from app.models.advocate import Advocate
from app.services.case_classifier import classify_case


async def recommend_lawyers(
    case_description: str,
    location: Optional[str],
    db: AsyncSession,
    top_k: int = 5,
) -> Dict[str, Any]:
    # Step 1: Classify the case to know the required practice area
    classification = await classify_case(case_description)
    category = classification.get("category", "General")

    # Step 2: Fetch verified advocates
    result = await db.execute(
        select(Advocate).where(Advocate.is_verified == True)
    )
    advocates = result.scalars().all()

    if not advocates:
        return {
            "case_category": category,
            "recommendations": [],
            "message": "No verified advocates registered yet.",
        }

    # Step 3: Score
    scored: List[Dict[str, Any]] = []
    for adv in advocates:
        score_breakdown, total_score = _score_advocate(adv, category, location)
        scored.append({
            "advocate_id": str(adv.id),
            "score": round(total_score, 2),
            "score_breakdown": score_breakdown,
            "practice_areas": adv.practice_areas,
            "city": adv.city,
            "court_location": adv.court_location,
            "years_of_experience": adv.years_of_experience,
            "win_rate": adv.win_rate,
            "rating": adv.rating,
            "is_available": adv.is_available,
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    top = scored[:top_k]

    return {
        "case_category": category,
        "classification_confidence": classification.get("confidence"),
        "total_advocates_evaluated": len(advocates),
        "recommendations": top,
    }


def _score_advocate(
    adv: Advocate,
    category: str,
    location: Optional[str],
) -> tuple[Dict[str, float], float]:
    breakdown = {}

    # ── Practice area match (40 pts) ─────────────────────────────────────────
    practice_score = 0.0
    if adv.practice_areas:
        areas_lower = [p.lower() for p in adv.practice_areas]
        cat_lower = category.lower()
        if cat_lower in areas_lower:
            practice_score = 40.0
        elif any(cat_lower in area or area in cat_lower for area in areas_lower):
            practice_score = 25.0
    breakdown["practice_area"] = practice_score

    # ── Location match (25 pts) ───────────────────────────────────────────────
    location_score = 0.0
    if location and adv.city:
        if location.lower() in adv.city.lower() or adv.city.lower() in location.lower():
            location_score = 25.0
        elif adv.state and location.lower() in adv.state.lower():
            location_score = 10.0
    breakdown["location"] = location_score

    # ── Win rate (15 pts) ─────────────────────────────────────────────────────
    win_score = (adv.win_rate / 100.0) * 15.0
    breakdown["win_rate"] = round(win_score, 2)

    # ── Rating (10 pts) ───────────────────────────────────────────────────────
    rating_score = (adv.rating / 5.0) * 10.0
    breakdown["rating"] = round(rating_score, 2)

    # ── Experience (10 pts, capped at 20 years) ───────────────────────────────
    exp_score = min(adv.years_of_experience / 20.0, 1.0) * 10.0
    breakdown["experience"] = round(exp_score, 2)

    # ── Availability bonus (5 pts) ────────────────────────────────────────────
    avail_score = 5.0 if adv.is_available else 0.0
    breakdown["availability"] = avail_score

    total = sum(breakdown.values())
    return breakdown, total
