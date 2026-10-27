from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserRole


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    role: UserRole = UserRole.citizen


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    full_name: str


class RefreshRequest(BaseModel):
    refresh_token: str


class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
