from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class MessageFeedbackCreate(BaseModel):
    message_index: int
    feedback_type: str  # "thumbs_up", "thumbs_down", "useful", "not_useful"
    comment: Optional[str] = None
    metadata: Optional[dict] = None


class MessageFeedbackResponse(BaseModel):
    id: UUID
    thread_id: UUID
    message_index: int
    message_role: str
    message_content: str
    feedback_type: str
    user_id: Optional[UUID] = None
    comment: Optional[str] = None
    metadata: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageWithFeedback(BaseModel):
    role: str  # "human" or "ai"
    content: str
    feedback: Optional[MessageFeedbackResponse] = None


class ThreadMessagesWithFeedbackResponse(BaseModel):
    thread_id: UUID
    messages: List[MessageWithFeedback]
