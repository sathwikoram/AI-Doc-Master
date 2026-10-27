from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum
from app.database import Base


class NotificationType(str, enum.Enum):
    case_update = "case_update"
    hearing_reminder = "hearing_reminder"
    appointment = "appointment"
    advocate_assigned = "advocate_assigned"
    document_request = "document_request"
    ai_suggestion = "ai_suggestion"
    system = "system"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(SAEnum(NotificationType), default=NotificationType.system)
    meta = Column(JSONB, default=dict)   # {case_id, hearing_id, ...}

    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
