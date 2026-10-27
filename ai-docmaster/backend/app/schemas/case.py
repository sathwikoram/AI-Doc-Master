from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from app.models.case import CaseStatus, CasePriority


class CaseCreate(BaseModel):
    title: str
    description: str
    priority: CasePriority = CasePriority.medium
    court_location: Optional[str] = None
    tags: List[str] = []


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CaseStatus] = None
    priority: Optional[CasePriority] = None
    case_number: Optional[str] = None
    court_name: Optional[str] = None
    court_location: Optional[str] = None
    tags: Optional[List[str]] = None


class CaseOut(BaseModel):
    id: UUID
    case_number: Optional[str]
    title: str
    description: str
    category: Optional[str]
    sub_category: Optional[str]
    priority: CasePriority
    status: CaseStatus
    ai_analysis: Optional[Dict[str, Any]]
    court_name: Optional[str]
    court_location: Optional[str]
    filing_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime]
    is_urgent: bool
    tags: List[str]
    citizen_id: UUID
    advocate_id: Optional[UUID]

    class Config:
        from_attributes = True


class CaseNoteCreate(BaseModel):
    content: str
    is_private: bool = False


class CaseNoteOut(BaseModel):
    id: UUID
    case_id: UUID
    author_id: UUID
    content: str
    is_private: bool
    created_at: datetime

    class Config:
        from_attributes = True
