from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum
from app.database import Base


class HearingStatus(str, enum.Enum):
    scheduled = "scheduled"
    completed = "completed"
    adjourned = "adjourned"
    cancelled = "cancelled"


class Hearing(Base):
    __tablename__ = "hearings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    advocate_id = Column(UUID(as_uuid=True), ForeignKey("advocates.id", ondelete="SET NULL"), nullable=True)

    # Schedule
    scheduled_date = Column(DateTime, nullable=False)
    court_name = Column(String(200), nullable=True)
    court_room = Column(String(100), nullable=True)
    judge_name = Column(String(150), nullable=True)

    # Status
    status = Column(SAEnum(HearingStatus), default=HearingStatus.scheduled)
    outcome = Column(Text, nullable=True)
    next_date = Column(DateTime, nullable=True)

    # Flags
    advocate_present = Column(Boolean, nullable=True)
    citizen_present = Column(Boolean, nullable=True)

    # Auto-replacement flag
    replaced_advocate_id = Column(UUID(as_uuid=True), ForeignKey("advocates.id", ondelete="SET NULL"), nullable=True)
    replacement_reason = Column(Text, nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    case = relationship("Case", back_populates="hearings")
    advocate = relationship("Advocate", back_populates="hearings", foreign_keys=[advocate_id])
