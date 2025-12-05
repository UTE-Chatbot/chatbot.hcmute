from sqlalchemy import Column, String, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base, BaseModel
import uuid

class Feedback(Base, BaseModel):
    __tablename__ = "feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  
    feedback = Column(JSON, nullable=False) 
    message = relationship("Message", back_populates="feedback")
    user = relationship("User", back_populates="feedback")
    
    # Unique constraint
    __table_args__ = (
        UniqueConstraint('user_id', 'message_id', name='uq_user_message_feedback'),
    )
