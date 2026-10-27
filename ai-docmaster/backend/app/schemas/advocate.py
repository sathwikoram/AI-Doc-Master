from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class AdvocateCreate(BaseModel):
    bar_council_number: str
    license_number: Optional[str] = None
    qualification: Optional[str] = None
    years_of_experience: int = 0
    practice_areas: List[str] = []
    court_location: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    profile_bio: Optional[str] = None
    languages: List[str] = ["English"]


class AdvocateUpdate(BaseModel):
    qualification: Optional[str] = None
    years_of_experience: Optional[int] = None
    practice_areas: Optional[List[str]] = None
    court_location: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    profile_bio: Optional[str] = None
    languages: Optional[List[str]] = None
    is_available: Optional[bool] = None
    availability_note: Optional[str] = None


class AdvocateOut(BaseModel):
    id: UUID
    user_id: UUID
    bar_council_number: str
    qualification: Optional[str]
    years_of_experience: int
    practice_areas: List[str]
    court_location: Optional[str]
    city: Optional[str]
    state: Optional[str]
    total_cases: int
    won_cases: int
    rating: float
    win_rate: float
    is_verified: bool
    is_available: bool
    profile_bio: Optional[str]
    languages: List[str]
    created_at: datetime
    # Nested user info
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_phone: Optional[str] = None
    user_picture: Optional[str] = None

    class Config:
        from_attributes = True
