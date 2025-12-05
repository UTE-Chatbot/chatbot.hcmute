from pydantic import BaseModel
from langgraph.graph import MessagesState
from typing import List, Optional
from langmem.short_term import RunningSummary
from langchain.messages import AnyMessage
class MessageSchema(BaseModel):
    role: str
    content: str
    
class AgentState(MessagesState):
    question: str
    thread_id: str
    rewritten_question: Optional[str]
    summary: Optional[str]
    information: Optional[List[str]]
    response: Optional[str]
    cache_hit: Optional[bool] = None
    invocation_messages: Optional[List[MessageSchema]] = None
    context: dict[str, RunningSummary]  
    summarized_messages: list[AnyMessage]
