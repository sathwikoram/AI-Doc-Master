from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.user import User, UserRole
from app.models.appointment import Appointment, AppointmentStatus
from app.models.advocate import Advocate
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentOut
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])


@router.post("/", response_model=AppointmentOut, status_code=201)
async def book_appointment(
    body: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify advocate exists
    adv_result = await db.execute(select(Advocate).where(Advocate.id == body.advocate_id))
    if not adv_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Advocate not found")

    appt = Appointment(citizen_id=current_user.id, **body.model_dump())
    db.add(appt)
    await db.flush()
    await db.refresh(appt)
    return AppointmentOut.model_validate(appt)


@router.get("/", response_model=List[AppointmentOut])
async def list_appointments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role == UserRole.citizen:
        query = select(Appointment).where(Appointment.citizen_id == current_user.id)
    elif current_user.role == UserRole.advocate:
        adv_result = await db.execute(select(Advocate).where(Advocate.user_id == current_user.id))
        adv = adv_result.scalar_one_or_none()
        query = select(Appointment).where(Appointment.advocate_id == adv.id) if adv else select(Appointment).where(False)
    else:
        query = select(Appointment)

    result = await db.execute(query.order_by(Appointment.scheduled_at.desc()))
    return [AppointmentOut.model_validate(a) for a in result.scalars().all()]


@router.put("/{appt_id}", response_model=AppointmentOut)
async def update_appointment(
    appt_id: UUID,
    body: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Appointment).where(Appointment.id == appt_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(appt, field, value)
    await db.flush()
    await db.refresh(appt)
    return AppointmentOut.model_validate(appt)


@router.delete("/{appt_id}", status_code=204)
async def cancel_appointment(
    appt_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Appointment).where(Appointment.id == appt_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.status = AppointmentStatus.cancelled
    await db.flush()
