from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id", ondelete="SET NULL"), nullable=True)

    role = Column(String(20), nullable=False)   # user | assistant
    content = Column(Text, nullable=False)
    is_ai = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_messages")
