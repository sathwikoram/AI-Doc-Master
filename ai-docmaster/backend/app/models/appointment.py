from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum as SAEnum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum
from app.database import Base


class AppointmentStatus(str, enum.Enum):
    requested = "requested"
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"
    no_show = "no_show"


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    citizen_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    advocate_id = Column(UUID(as_uuid=True), ForeignKey("advocates.id", ondelete="CASCADE"), nullable=False)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id", ondelete="SET NULL"), nullable=True)

    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(String(10), default="30")
    mode = Column(String(20), default="in_person")  # in_person | video | phone

    status = Column(SAEnum(AppointmentStatus), default=AppointmentStatus.requested)
    notes = Column(Text, nullable=True)
    citizen_notes = Column(Text, nullable=True)
    meet_link = Column(String(300), nullable=True)

    reminder_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    citizen = relationship("User", back_populates="appointments", foreign_keys=[citizen_id])
    advocate = relationship("Advocate", back_populates="appointments", foreign_keys=[advocate_id])
    case = relationship("Case", back_populates="appointments")
