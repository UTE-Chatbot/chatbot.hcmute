from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class ThreadTitleResponse(BaseModel):
    thread_id: UUID
    title: Optional[str] = None

    class Config:
        from_attributes = True

class ThreadFeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    is_accurate: Optional[bool] = None
    is_helpful: Optional[bool] = None
    is_understandable: Optional[bool] = None
    comment: Optional[str] = None

class ThreadFeedbackResponse(BaseModel):
    id: UUID
    thread_id: UUID
    rating: int
    is_accurate: Optional[bool] = None
    is_helpful: Optional[bool] = None
    is_understandable: Optional[bool] = None
    comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    thread: Optional[ThreadTitleResponse] = None

    class Config:
        from_attributes = True
