from sqlalchemy import Column, Integer, DateTime, UniqueConstraint, String
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base, BaseModel
import uuid
from datetime import datetime, timedelta, timezone

class RateLimit(Base, BaseModel):
    __tablename__ = "rate_limits"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    client_id = Column(String, nullable=False, index=True)
    question_count = Column(Integer, default=0)
    reset_at = Column(DateTime, default=lambda: datetime.now() + timedelta(days=1))
    created_at = Column(DateTime, default=datetime.now)

    __table_args__ = (UniqueConstraint('client_id', 'reset_at', name='uq_client_reset'),)
