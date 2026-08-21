from sqlalchemy import Column, String, Text, ForeignKey, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, BaseModel
import uuid

class ThreadFeedback(Base, BaseModel):
    __tablename__ = "thread_feedbacks"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    thread_id = Column(UUID(as_uuid=True), ForeignKey("threads.thread_id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    is_accurate = Column(Boolean, nullable=True)
    is_helpful = Column(Boolean, nullable=True)
    is_understandable = Column(Boolean, nullable=True)
    comment = Column(Text, nullable=True)

    thread = relationship("Thread", backref="feedback")
