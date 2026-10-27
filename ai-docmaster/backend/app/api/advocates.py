from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.models.user import User, UserRole
from app.models.advocate import Advocate
from app.schemas.advocate import AdvocateCreate, AdvocateUpdate, AdvocateOut
from app.core.dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/api/advocates", tags=["Advocates"])

# Always eager-load .user to avoid MissingGreenlet in async context
_LOAD = selectinload(Advocate.user)


def _build_out(adv: Advocate) -> AdvocateOut:
    out = AdvocateOut.model_validate(adv)
    if adv.user:
        out.user_name    = adv.user.full_name
        out.user_email   = adv.user.email
        out.user_phone   = adv.user.phone
        out.user_picture = adv.user.profile_picture
    return out


@router.post("/register", response_model=AdvocateOut, status_code=201)
async def register_advocate(
    body: AdvocateCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.advocate:
        raise HTTPException(status_code=403, detail="Only advocate-role users can register as advocates")
    existing = await db.execute(select(Advocate).where(Advocate.user_id == current_user.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already registered as advocate")
    adv = Advocate(user_id=current_user.id, **body.model_dump())
    db.add(adv)
    await db.flush()
    # Reload with user eager-loaded
    result = await db.execute(select(Advocate).options(_LOAD).where(Advocate.id == adv.id))
    adv = result.scalar_one()
    return _build_out(adv)


@router.get("/me", response_model=AdvocateOut)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Advocate).options(_LOAD).where(Advocate.user_id == current_user.id)
    )
    adv = result.scalar_one_or_none()
    if not adv:
        raise HTTPException(status_code=404, detail="Advocate profile not found")
    return _build_out(adv)


@router.put("/me", response_model=AdvocateOut)
async def update_my_profile(
    body: AdvocateUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Advocate).options(_LOAD).where(Advocate.user_id == current_user.id)
    )
    adv = result.scalar_one_or_none()
    if not adv:
        raise HTTPException(status_code=404, detail="Advocate profile not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(adv, field, value)
    await db.flush()
    await db.refresh(adv)
    # Re-fetch with user
    result2 = await db.execute(select(Advocate).options(_LOAD).where(Advocate.id == adv.id))
    return _build_out(result2.scalar_one())


@router.get("/", response_model=List[AdvocateOut])
async def list_advocates(
    practice_area: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    available_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Advocate).options(_LOAD).where(Advocate.is_verified == True)
    if available_only:
        query = query.where(Advocate.is_available == True)
    if city:
        query = query.where(Advocate.city.ilike(f"%{city}%"))
    result = await db.execute(query)
    advocates = result.scalars().all()
    if practice_area:
        advocates = [
            a for a in advocates
            if practice_area.lower() in [p.lower() for p in (a.practice_areas or [])]
        ]
    return [_build_out(a) for a in advocates]


@router.get("/{advocate_id}", response_model=AdvocateOut)
async def get_advocate(
    advocate_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Advocate).options(_LOAD).where(Advocate.id == advocate_id)
    )
    adv = result.scalar_one_or_none()
    if not adv:
        raise HTTPException(status_code=404, detail="Advocate not found")
    return _build_out(adv)


@router.patch("/{advocate_id}/verify", response_model=AdvocateOut)
async def verify_advocate(
    advocate_id: UUID,
    verified: bool = True,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Advocate).options(_LOAD).where(Advocate.id == advocate_id)
    )
    adv = result.scalar_one_or_none()
    if not adv:
        raise HTTPException(status_code=404, detail="Advocate not found")
    adv.is_verified = verified
    await db.flush()
    result2 = await db.execute(select(Advocate).options(_LOAD).where(Advocate.id == adv.id))
    return _build_out(result2.scalar_one())
