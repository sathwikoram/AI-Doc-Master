from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    citizen = "citizen"
    advocate = "advocate"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.citizen, nullable=False)
    profile_picture = Column(String(500), nullable=True)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    cases = relationship("Case", back_populates="citizen", foreign_keys="Case.citizen_id")
    appointments = relationship("Appointment", back_populates="citizen", foreign_keys="Appointment.citizen_id")
    notifications = relationship("Notification", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="user")

    def __repr__(self):
        return f"<User {self.email} [{self.role}]>"
