"""
Advocate auto-replacement logic.
When an assigned advocate is unavailable for a hearing,
the system finds the best available replacement based on:
  - Same practice area / case category
  - Similar experience
  - Court location match
  - Availability
  - Rating
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional
from uuid import UUID
from app.models.advocate import Advocate


async def find_replacement_advocate(
    db: AsyncSession,
    original_advocate_id: Optional[UUID],
    case_category: Optional[str],
    court_location: Optional[str],
) -> Optional[Advocate]:
    query = select(Advocate).where(
        and_(
            Advocate.is_available == True,
            Advocate.is_verified == True,
        )
    )
    # Exclude original advocate
    if original_advocate_id:
        query = query.where(Advocate.id != original_advocate_id)

    result = await db.execute(query)
    candidates = result.scalars().all()

    if not candidates:
        return None

    # Score each candidate
    def score(adv: Advocate) -> float:
        s = 0.0
        # Practice area match
        if case_category and adv.practice_areas:
            if case_category.lower() in [p.lower() for p in adv.practice_areas]:
                s += 40
        # Location match
        if court_location and adv.court_location:
            if court_location.lower() in adv.court_location.lower():
                s += 30
        # Rating (0-5 scaled to 0-20)
        s += (adv.rating / 5.0) * 20
        # Experience (capped at 10)
        s += min(adv.years_of_experience, 10)
        return s

    best = max(candidates, key=score)
    return best
