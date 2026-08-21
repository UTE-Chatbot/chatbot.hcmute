from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks, status, Query, Header
from fastapi.responses import StreamingResponse, JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.utils.messages import apologize
from typing import Optional, List, Any
from uuid import UUID
import uuid
import json
import asyncio
from datetime import datetime
from pydantic import BaseModel, model_validator
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy import select, text
from sqlalchemy.orm import selectinload

from app.db.session import get_db, AsyncSessionLocal
from app.services import thread_service
from app.schemas.thread import (
    ThreadCreate,
    ThreadResponse,
    ThreadMessagesResponse,
    MessageResponse,
    ThreadReportResponse,
    DashboardStatsResponse,
    QuestionRequest,
    ChatRequest,
)
from app.schemas.thread_feedback import ThreadFeedbackCreate, ThreadFeedbackResponse
from app.core.deps import require_roles, get_current_user_optional
from app.core.config import settings
from app.models.user import RoleEnum, User
from app.models.thread import Thread
from uuid import UUID
router = APIRouter(prefix="/threads", tags=["Threads"])
chat_router = APIRouter(tags=["Chat"])

class MaintenanceUpdate(BaseModel):
    enabled: bool

@router.get("/maintenance")
async def get_maintenance_mode():
    return {"enabled": settings.maintenance_mode}

@router.post("/maintenance")
async def set_maintenance_mode(
    body: MaintenanceUpdate,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    settings.maintenance_mode = body.enabled
    return {"enabled": settings.maintenance_mode}


def get_client_id(
     request: Request, current_user: Optional[User] = None,   body: Optional[ThreadCreate] = None,) -> str:
    if current_user:
        return str(current_user.id)

    visitor_id = request.headers.get("X-Visitor-ID")
    if visitor_id:
        try:
            uuid_obj = UUID(visitor_id)
            return str(uuid_obj)
        except ValueError:
            return None

    return None
    
@router.get("", response_model=Page[ThreadResponse])
async def list_threads(
    client_id: Optional[str] = Query(None, description="Filter by client_id"),
    search: Optional[str] = Query(None, description="Search by title"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    params: Params = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN)),
):
    query = select(Thread).options(selectinload(Thread.user))
    
    # table_exists_result = await db.execute(
    #     text(f"SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '{settings.chat_history_table_name}')")
    # )
    # table_exists = table_exists_result.scalar() or False
    
    # if table_exists:
    #     query = query.where(
    #         text(f"EXISTS (SELECT 1 FROM {settings.chat_history_table_name} WHERE session_id = threads.thread_id)")
    #     )

    if client_id:
        query = query.where(Thread.client_id == client_id)
        
    if search:
        query = query.where(Thread.title.ilike(f"%{search}%"))

    if start_date:
        if start_date.tzinfo:
            start_date = start_date.replace(tzinfo=None)
        query = query.where(Thread.created_at >= start_date)

    if end_date:
        if end_date.tzinfo:
            end_date = end_date.replace(tzinfo=None)
        # Adjust end_date to include the entire day if it's set to midnight
        # But for consistency with dashboard, we'll keep it simple first
        # Ideally we should add 1 day or set time to 23:59:59 if it is midnight
        query = query.where(Thread.created_at <= end_date)
    
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


@router.get("/admin/dashboard", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    stats = await thread_service.get_dashboard_stats(db, start_date, end_date)
    return stats


@router.get("/admin/export-csv")
async def export_thread_csv(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    csv_content = await thread_service.generate_csv_export(db, start_date, end_date)
    
    filename = f"thread_report_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv"
    
    # Add BOM for Excel to recognize UTF-8
    content_with_bom = "\ufeff" + csv_content

    return Response(
        content=content_with_bom,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )



@router.post("/{thread_id}/ask")
async def stream_response(
    thread_id: UUID,
    chat_request: ChatRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
    x_client_id: Optional[str] = Header(None) 
):


    maintainance_msg = f"Hiện tại mình đang nâng cấp, bạn trở lại sau nha. "
    
    async def maintainance_stream():
        yield maintainance_msg
    
    if settings.maintenance_mode:
        return StreamingResponse(
            maintainance_stream(),
            media_type="text/plain"
        )

    thread = await thread_service.get_thread_by_id(db, thread_id)
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )
    
    # Extract the User's message 
    last_message = chat_request.messages[-1]
    user_question = last_message.content

    async def background_set_title(tid, q):
        async with AsyncSessionLocal() as session:
            await thread_service.set_thread_title_from_first_question(session, tid, q)

    background_tasks.add_task(background_set_title, thread_id, user_question)
    
    client_id = get_client_id(request, current_user)
    is_admin = current_user and current_user.role == RoleEnum.ADMIN
    print(f"User is admin: {is_admin}")
    
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
        
        error_msg = f"Ôi, mình đang nghỉ xíu để nạp năng lượng ⚡. Đợi mình sau {hours} giờ {minutes} phút {seconds} giây nha 💖"
        
        async def limit_stream():
            yield error_msg
        
        return StreamingResponse(limit_stream(), media_type="text/plain")
    
    rag = request.app.state.rag
    async def stream():
        answer_parts = []
        cache_hit = False
        try:
            async for chunk_data in rag.execute_workflow(user_question, str(thread_id)):
                if await request.is_disconnected():
                    break
                
                if isinstance(chunk_data, dict):
                    content = chunk_data.get("content", "")
                    cache_hit = chunk_data.get("cache_hit", False)
                else:
                    content = chunk_data
                
                answer_parts.append(content)
                yield content
            
            if not cache_hit:
                async def background_increment(cid, admin):
                    async with AsyncSessionLocal() as session:
                        await thread_service.increment_rate_limit(session, cid, admin)

                background_tasks.add_task(
                    background_increment,
                    client_id,
                    is_admin
                )
        except Exception as e:
            print(f"[ERROR] Stream error: {e}")
            import traceback
            traceback.print_exc()
            yield apologize()
    
    response = StreamingResponse(stream(), media_type="text/plain")
    response.headers["x-vercel-ai-data-stream"] = "v1"
    return response

@router.post("/{thread_id}/feedback", response_model=ThreadFeedbackResponse)
async def submit_thread_feedback(
    thread_id: UUID,
    body: ThreadFeedbackCreate,
    db: AsyncSession = Depends(get_db)
):
    from app.services import feedback_service
    feedback = await feedback_service.submit_feedback(db, thread_id, body)
    return feedback

@router.get("/feedback/admin/list", response_model=Page[ThreadFeedbackResponse])
async def list_feedbacks(
    rating: Optional[int] = Query(None, description="Filter by rating"),
    search: Optional[str] = Query(None, description="Search in comment or thread title"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    params: Params = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    from app.models.thread_feedback import ThreadFeedback
    from app.models.thread import Thread
    from sqlalchemy.orm import joinedload
    from sqlalchemy import or_

    query = select(ThreadFeedback).join(Thread).options(joinedload(ThreadFeedback.thread))

    if rating is not None:
        query = query.where(ThreadFeedback.rating == rating)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(or_(
            ThreadFeedback.comment.ilike(search_pattern),
            Thread.title.ilike(search_pattern)
        ))
    if start_date:
        if start_date.tzinfo:
            start_date = start_date.replace(tzinfo=None)
        query = query.where(ThreadFeedback.created_at >= start_date)
    if end_date:
        if end_date.tzinfo:
            end_date = end_date.replace(tzinfo=None)
        query = query.where(ThreadFeedback.created_at <= end_date)

    query = query.order_by(ThreadFeedback.created_at.desc())
    return await paginate(db, query, params)

@router.delete("/feedback/admin/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_feedback(
    feedback_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    from app.services import feedback_service
    deleted = await feedback_service.delete_feedback(db, feedback_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    return None

@router.get("/feedback/admin/export-csv")
async def export_feedback_csv(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    from app.services import feedback_service
    csv_content = await feedback_service.generate_csv_export(db, start_date, end_date)
    filename = f"feedback_report_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv"
    content_with_bom = "\ufeff" + csv_content

    return Response(
        content=content_with_bom,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )





