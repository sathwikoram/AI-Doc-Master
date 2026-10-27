from sqlalchemy import (
    Column, String, Boolean, DateTime, Float, Integer,
    Text, ForeignKey, Enum as SAEnum
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum
from app.database import Base


class CaseStatus(str, enum.Enum):
    pending = "pending"            # just submitted, waiting AI analysis
    ai_analyzed = "ai_analyzed"   # AI has classified & suggested lawyer
    lawyer_assigned = "lawyer_assigned"
    accepted = "accepted"          # advocate accepted
    in_progress = "in_progress"
    hearing_scheduled = "hearing_scheduled"
    adjourned = "adjourned"
    closed_won = "closed_won"
    closed_lost = "closed_lost"
    closed_settled = "closed_settled"
    rejected = "rejected"


class CasePriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class Case(Base):
    __tablename__ = "cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    case_number = Column(String(50), unique=True, nullable=True)  # court case number

    # Parties
    citizen_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    advocate_id = Column(UUID(as_uuid=True), ForeignKey("advocates.id", ondelete="SET NULL"), nullable=True)
    original_advocate_id = Column(UUID(as_uuid=True), ForeignKey("advocates.id", ondelete="SET NULL"), nullable=True)

    # Case Info
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)        # AI predicted category
    sub_category = Column(String(100), nullable=True)
    priority = Column(SAEnum(CasePriority), default=CasePriority.medium)
    status = Column(SAEnum(CaseStatus), default=CaseStatus.pending)

    # AI Outputs (stored as JSON)
    ai_analysis = Column(JSONB, default=dict)
    # {
    #   "classification": {"category": "...", "confidence": 0.91},
    #   "sections": [...],
    #   "document_checklist": [...],
    #   "similar_judgements": [...],
    #   "risk_assessment": {...},
    #   "case_summary": "..."
    # }

    # Lawyer suggestion metadata
    suggested_advocate_ids = Column(ARRAY(String), default=list)

    # Court info
    court_name = Column(String(200), nullable=True)
    court_location = Column(String(200), nullable=True)
    filing_date = Column(DateTime, nullable=True)

    # Timeline
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    # Meta
    is_urgent = Column(Boolean, default=False)
    tags = Column(ARRAY(String), default=list)

    # Relationships
    citizen = relationship("User", back_populates="cases", foreign_keys=[citizen_id])
    advocate = relationship("Advocate", back_populates="assigned_cases", foreign_keys=[advocate_id])
    documents = relationship("CaseDocument", back_populates="case", cascade="all, delete-orphan")
    notes = relationship("CaseNote", back_populates="case", cascade="all, delete-orphan")
    hearings = relationship("Hearing", back_populates="case", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="case")

    def __repr__(self):
        return f"<Case {self.id} [{self.status}]>"


class CaseDocument(Base):
    __tablename__ = "case_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    file_name = Column(String(300), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=True)     # pdf, jpg, docx
    file_size = Column(Integer, nullable=True)         # bytes
    document_type = Column(String(100), nullable=True) # identity, property, contract...

    # AI-extracted content
    extracted_text = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)

    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="documents")


class CaseNote(Base):
    __tablename__ = "case_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    content = Column(Text, nullable=False)
    is_private = Column(Boolean, default=False)  # advocate-only notes
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="notes")
