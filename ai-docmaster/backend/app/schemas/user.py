from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.user import UserRole


class UserOut(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    phone: Optional[str]
    role: UserRole
    profile_picture: Optional[str]
    address: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    profile_picture: Optional[str] = None
