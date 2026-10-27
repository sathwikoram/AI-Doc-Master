from sqlalchemy import (
    Column, String, Boolean, DateTime, Float, Integer,
    Text, ForeignKey, ARRAY
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base


class Advocate(Base):
    __tablename__ = "advocates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Professional Info
    bar_council_number = Column(String(100), unique=True, nullable=False)
    license_number = Column(String(100), nullable=True)
    qualification = Column(String(200), nullable=True)
    years_of_experience = Column(Integer, default=0)

    # Practice Areas (e.g. ["property", "criminal", "family"])
    practice_areas = Column(ARRAY(String), default=list)

    # Location
    court_location = Column(String(200), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)

    # Stats
    total_cases = Column(Integer, default=0)
    won_cases = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)

    # Status
    is_verified = Column(Boolean, default=False)
    is_available = Column(Boolean, default=True)
    availability_note = Column(Text, nullable=True)

    # Documents
    profile_bio = Column(Text, nullable=True)
    languages = Column(ARRAY(String), default=list)
    documents = Column(JSONB, default=dict)   # {license_doc, degree_doc, ...}

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    assigned_cases = relationship("Case", back_populates="advocate", foreign_keys="Case.advocate_id")
    appointments = relationship("Appointment", back_populates="advocate", foreign_keys="Appointment.advocate_id")
    hearings = relationship("Hearing", back_populates="advocate", foreign_keys="Hearing.advocate_id")

    @property
    def win_rate(self) -> float:
        if self.total_cases == 0:
            return 0.0
        return round((self.won_cases / self.total_cases) * 100, 2)

    def __repr__(self):
        return f"<Advocate {self.bar_council_number}>"
