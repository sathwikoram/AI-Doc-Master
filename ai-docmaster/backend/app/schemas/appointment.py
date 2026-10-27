from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.appointment import AppointmentStatus


class AppointmentCreate(BaseModel):
    advocate_id: UUID
    case_id: Optional[UUID] = None
    scheduled_at: datetime
    duration_minutes: str = "30"
    mode: str = "in_person"
    citizen_notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None
    meet_link: Optional[str] = None


class AppointmentOut(BaseModel):
    id: UUID
    citizen_id: UUID
    advocate_id: UUID
    case_id: Optional[UUID]
    scheduled_at: datetime
    duration_minutes: str
    mode: str
    status: AppointmentStatus
    notes: Optional[str]
    citizen_notes: Optional[str]
    meet_link: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
