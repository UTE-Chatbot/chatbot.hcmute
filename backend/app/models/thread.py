from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import TEXT
from sqlalchemy.orm import relationship
from app.db.base import Base, BaseModel
import uuid
from datetime import datetime, timezone

class Thread(Base, BaseModel):
    __tablename__ = "threads"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    client_id = Column(String, nullable=True, index=True)   
    thread_id = Column(UUID(as_uuid=True), unique=True, index=True, nullable=False)
    title = Column(TEXT, nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="threads")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)