from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks, status, Query, Header
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Any
from uuid import UUID
import uuid
import json
import asyncio
from pydantic import BaseModel, model_validator
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy import select

from app.db.session import get_db
from app.services import thread_service
from app.schemas.thread import (
    ThreadCreate,
    ThreadResponse,
    ThreadMessagesResponse,
    MessageResponse,
    ThreadReportResponse,
    QuestionRequest,
    ChatRequest,
)
from app.core.deps import require_roles, get_current_user_optional
from app.core.config import settings
from app.models.user import RoleEnum, User
from app.models.thread import Thread

router = APIRouter(prefix="/threads", tags=["Threads"])
chat_router = APIRouter(tags=["Chat"])


def get_client_id(
     request: Request, current_user: Optional[User] = None,   body: Optional[ThreadCreate] = None,) -> str:
    client_id = None
    if current_user:
        client_id = str(current_user.id)    
    else: 
        client_id = "mock-client-id-001"
    # elif request.headers.get("X-Client-ID"):
    #     client_id = request.headers.get("X-Client-ID")
    return client_id
    
@router.get("", response_model=Page[ThreadResponse])
async def list_threads(
    client_id: Optional[str] = Query(None, description="Filter by client_id"),
    params: Params = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN)),
):
    query = select(Thread)
    
    if client_id:
        query = query.where(Thread.client_id == client_id)
    
    query = query.order_by(Thread.created_at.desc())
    
    return await paginate(db, query, params)


@router.post("/new", response_model=ThreadResponse)
async def create_new_thread(
    request: Request,
    body: Optional[ThreadCreate] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    client_id = get_client_id(request, current_user, body)
    title = body.title if body else None
    
    thread = await thread_service.create_thread(
        db=db,
        title=title,
        client_id=client_id,
        user_id=current_user.id if current_user else None
    )
    
    return ThreadResponse.model_validate(thread)


@router.get("/{thread_id}", response_model=ThreadResponse)
async def get_thread(
    thread_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    thread = await thread_service.get_thread_by_id(db, thread_id)
    
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )
    
    return ThreadResponse.model_validate(thread)


@router.get("/{thread_id}/messages", response_model=ThreadMessagesResponse)
async def get_thread_messages(
    thread_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    thread = await thread_service.get_thread_by_id(db, thread_id)
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )
    
    messages = await thread_service.get_thread_messages(thread_id)
    
    return ThreadMessagesResponse(
        thread_id=thread_id,
        messages=messages
    )


@router.delete("/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_thread(
    thread_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    deleted = await thread_service.delete_thread(db, thread_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )
    
    return None


@router.get("/admin/report", response_model=ThreadReportResponse)
async def get_global_thread_report(
    current_user: User = Depends(require_roles(RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    report = await thread_service.generate_thread_report(db, client_id=None)
    return report



@router.post("/{thread_id}/ask")
async def stream_response(
    thread_id: UUID,
    request: ChatRequest,
    raw_request: Request,
    background_tasks: BackgroundTasks,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
    x_client_id: Optional[str] = Header(None) 
):
    thread = await thread_service.get_thread_by_id(db, thread_id)
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )
    
    # Extract the User's message 
    last_message = request.messages[-1]
    user_question = last_message.content

    await thread_service.set_thread_title_from_first_question(db, thread_id, user_question)
    
    client_id = get_client_id(request, current_user)
    is_admin = current_user and current_user.role == RoleEnum.ADMIN
    
    allowed, remaining = await thread_service.check_rate_limit(
        db=db,
        client_id=client_id,
        is_admin=is_admin,
        limit_per_day=settings.question_limit_per_day
    )
    
    if not allowed:
        hours = remaining // 3600
        minutes = (remaining % 3600) // 60
        seconds = remaining % 60
        
        error_msg = f"Hôm nay bạn đã hỏi đạt giới hạn câu hỏi. Còn lại {hours} giờ {minutes} phút {seconds} giây nữa nhé 😉"
        
        async def limit_stream():
            yield error_msg
        
        return StreamingResponse(limit_stream(), media_type="text/plain")
    
    rag = raw_request.app.state.rag

    # async def stream():
    #     message_id = str(uuid.uuid4())
        
    #     for chunk in "This is a mock streaming response from the server.".split():
    #         yield chunk + "$$x_2 + y^2$$ " if chunk != "" else ""
    #         await asyncio.sleep(1)

    #     yield f'd:{json.dumps({"threadId": str(thread_id_val), "messageId": message_id})}\n'
    #     yield f'd:{json.dumps({"finishReason": "stop"})}\n'
    async def stream():
        answer_parts = []
        try:
            async for chunk in rag.execute_workflow(user_question, str(thread_id)):
                if await raw_request.is_disconnected():
                    break
                answer_parts.append(chunk)
                yield chunk
        except Exception as e:
            yield "Nắng hôm nay chói chang quá, say nắng một xíu tôi trở lại ngay nhé."
    
    response = StreamingResponse(stream(), media_type="text/plain")
    response.headers["x-vercel-ai-data-stream"] = "v1"
    return response




