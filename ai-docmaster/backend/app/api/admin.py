from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from app.database import get_db
from app.models.user import User, UserRole
from app.models.advocate import Advocate
from app.models.case import Case, CaseStatus
from app.models.hearing import Hearing
from app.core.dependencies import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ── Dashboard stats ───────────────────────────────────────────────────────────
@router.get("/stats")
async def dashboard_stats(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    total_advocates = (await db.execute(select(func.count(Advocate.id)))).scalar()
    verified_advocates = (await db.execute(
        select(func.count(Advocate.id)).where(Advocate.is_verified == True)
    )).scalar()
    total_cases = (await db.execute(func.count(Case.id))).scalar()
    active_cases = (await db.execute(
        select(func.count(Case.id)).where(Case.status.in_([
            CaseStatus.in_progress, CaseStatus.hearing_scheduled, CaseStatus.accepted
        ]))
    )).scalar()
    closed_won = (await db.execute(
        select(func.count(Case.id)).where(Case.status == CaseStatus.closed_won)
    )).scalar()

    # Cases by category
    cat_result = await db.execute(
        select(Case.category, func.count(Case.id))
        .where(Case.category.isnot(None))
        .group_by(Case.category)
    )
    cases_by_category = [{"category": r[0], "count": r[1]} for r in cat_result.all()]

    # Monthly cases (last 6 months)
    monthly = []
    for i in range(5, -1, -1):
        start = datetime.utcnow().replace(day=1) - timedelta(days=30 * i)
        end = start + timedelta(days=31)
        count = (await db.execute(
            select(func.count(Case.id)).where(Case.created_at.between(start, end))
        )).scalar()
        monthly.append({"month": start.strftime("%b %Y"), "count": count})

    # Upcoming hearings count
    upcoming_hearings = (await db.execute(
        select(func.count(Hearing.id)).where(Hearing.scheduled_date >= datetime.utcnow())
    )).scalar()

    return {
        "total_users": total_users or 0,
        "total_advocates": total_advocates or 0,
        "verified_advocates": verified_advocates or 0,
        "total_cases": total_cases or 0,
        "active_cases": active_cases or 0,
        "closed_won": closed_won or 0,
        "cases_by_category": cases_by_category,
        "monthly_cases": monthly,
        "upcoming_hearings": upcoming_hearings or 0,
    }


# ── User management ───────────────────────────────────────────────────────────
@router.get("/users")
async def list_users(
    role: Optional[str] = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(User)
    if role:
        query = query.where(User.role == role)
    result = await db.execute(query.order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [
        {
            "id": str(u.id), "full_name": u.full_name, "email": u.email,
            "role": u.role, "is_active": u.is_active, "is_verified": u.is_verified,
            "created_at": u.created_at,
        }
        for u in users
    ]


@router.patch("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    await db.flush()
    return {"id": str(user.id), "is_active": user.is_active}


# ── Pending advocates (unverified) ────────────────────────────────────────────
@router.get("/advocates/pending")
async def pending_advocates(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Advocate).where(Advocate.is_verified == False)
    )
    advocates = result.scalars().all()
    return [{"id": str(a.id), "bar_council_number": a.bar_council_number,
             "city": a.city, "created_at": a.created_at} for a in advocates]


# ── Recent cases ──────────────────────────────────────────────────────────────
@router.get("/cases/recent")
async def recent_cases(
    limit: int = 20,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Case).order_by(Case.created_at.desc()).limit(limit)
    )
    cases = result.scalars().all()
    return [{"id": str(c.id), "title": c.title, "category": c.category,
             "status": c.status, "created_at": c.created_at} for c in cases]
