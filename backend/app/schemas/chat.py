from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the message sender (user/assistant)")
    content: str = Field(..., description="Content of the message")
    timestamp: Optional[datetime] = Field(default=None, description="Timestamp of the message")


class ChatRequest(BaseModel):
    message: str = Field(..., description="User's message", min_length=1, max_length=5000)
    thread_id: Optional[str] = Field(default=None, description="Thread ID for conversation context")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Điểm chuẩn ngành CNTT năm 2024 là bao nhiêu?",
                "thread_id": "user_123"
            }
        }


class ChatResponse(BaseModel):
    response: str = Field(..., description="Assistant's response")
    thread_id: str = Field(..., description="Thread ID used for this conversation")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "response": "Điểm chuẩn ngành CNTT năm 2024 là 25.5 điểm...",
                "thread_id": "user_123",
                "timestamp": "2025-11-30T12:00:00Z"
            }
        }


class ConversationHistoryResponse(BaseModel):
    thread_id: str = Field(..., description="Thread ID")
    messages: List[Dict[str, Any]] = Field(..., description="List of messages in the conversation")
    message_count: int = Field(..., description="Total number of messages")
    
    class Config:
        json_schema_extra = {
            "example": {
                "thread_id": "user_123",
                "messages": [
                    {"role": "user", "content": "Hello"},
                    {"role": "assistant", "content": "Hi! How can I help?"}
                ],
                "message_count": 2
            }
        }


class SupervisorTestRequest(BaseModel):
    message: str = Field(..., description="Test message")
    thread_id: str = Field(default="test_thread", description="Test thread ID")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Điểm chuẩn CNTT 2024?",
                "thread_id": "test_session_001"
            }
        }


class SupervisorTestResponse(BaseModel):
    status: str = Field(..., description="Test status")
    response: str = Field(..., description="Agent response")
    thread_id: str = Field(..., description="Thread ID used")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "response": "Điểm chuẩn ngành CNTT năm 2024...",
                "thread_id": "test_session_001",
                "metadata": {
                    "processing_time_ms": 1234,
                    "tools_used": ["search_documents_tool"],
                    "summarization_triggered": False
                }
            }
        }
