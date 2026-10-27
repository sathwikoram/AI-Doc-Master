from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.hearing import HearingStatus


class HearingCreate(BaseModel):
    case_id: UUID
    scheduled_date: datetime
    court_name: Optional[str] = None
    court_room: Optional[str] = None
    judge_name: Optional[str] = None
    notes: Optional[str] = None


class HearingUpdate(BaseModel):
    scheduled_date: Optional[datetime] = None
    court_name: Optional[str] = None
    court_room: Optional[str] = None
    judge_name: Optional[str] = None
    status: Optional[HearingStatus] = None
    outcome: Optional[str] = None
    next_date: Optional[datetime] = None
    advocate_present: Optional[bool] = None
    citizen_present: Optional[bool] = None
    notes: Optional[str] = None


class HearingOut(BaseModel):
    id: UUID
    case_id: UUID
    advocate_id: Optional[UUID]
    scheduled_date: datetime
    court_name: Optional[str]
    court_room: Optional[str]
    judge_name: Optional[str]
    status: HearingStatus
    outcome: Optional[str]
    next_date: Optional[datetime]
    advocate_present: Optional[bool]
    citizen_present: Optional[bool]
    replaced_advocate_id: Optional[UUID]
    replacement_reason: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
