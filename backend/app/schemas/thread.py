from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from typing import Optional, List, Any
from pydantic import BaseModel, model_validator
class ThreadCreate(BaseModel):
    title: Optional[str] = None
    client_id: Optional[str] = None


class ThreadResponse(BaseModel):
    id: UUID
    thread_id: UUID
    title: Optional[str]
    user_id: Optional[UUID]
    client_id: Optional[str]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    role: str  # "human" or "ai"
    content: str


class ThreadMessagesResponse(BaseModel):
    thread_id: UUID
    messages: List[MessageResponse]


class ThreadReportResponse(BaseModel):
    total_threads: int
    total_messages: int
    keywords: List[str]
    topics: List[str]
    average_messages_per_thread: float


class QuestionRequest(BaseModel):
    question: str



class ClientMessage(BaseModel):
    role: str
    content: str = ""

    # Helper to clean up Vercel's potentially complex message structure
    @model_validator(mode='before')
    @classmethod
    def parse_parts_into_content(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("content") and "parts" in data:
                parts = data["parts"]
                text_content = "".join(
                    [p.get("text", "") for p in parts if p.get("type") == "text"]
                )
                data["content"] = text_content
        return data

class ChatRequest(BaseModel):
    messages: List[ClientMessage]
    threadId: Optional[str] = None # Frontend will send this
