import csv
import io
from uuid import UUID
from datetime import datetime
from typing import Optional, Tuple, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, Integer
from sqlalchemy.orm import selectinload

from app.models.thread_feedback import ThreadFeedback
from app.models.thread import Thread
from app.schemas.thread_feedback import ThreadFeedbackCreate

async def submit_feedback(
    db: AsyncSession,
    thread_id: UUID,
    feedback_in: ThreadFeedbackCreate
) -> ThreadFeedback:
    query = select(ThreadFeedback).where(ThreadFeedback.thread_id == thread_id)
    result = await db.execute(query)
    feedback = result.scalar_one_or_none()
    
    if feedback:
        feedback.rating = feedback_in.rating
        feedback.is_accurate = feedback_in.is_accurate
        feedback.is_helpful = feedback_in.is_helpful
        feedback.is_understandable = feedback_in.is_understandable
        feedback.comment = feedback_in.comment
    else:
        feedback = ThreadFeedback(
            thread_id=thread_id,
            rating=feedback_in.rating,
            is_accurate=feedback_in.is_accurate,
            is_helpful=feedback_in.is_helpful,
            is_understandable=feedback_in.is_understandable,
            comment=feedback_in.comment
        )
        db.add(feedback)
        
    await db.commit()
    await db.refresh(feedback)
    return feedback

async def get_feedbacks(
    db: AsyncSession,
    page: int = 1,
    size: int = 10,
    rating: Optional[int] = None,
    search: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Tuple[List[ThreadFeedback], int]:
    query = select(ThreadFeedback).join(Thread).options(selectinload(ThreadFeedback.thread))
    
    conditions = []
    if rating is not None:
        conditions.append(ThreadFeedback.rating == rating)
        
    if search:
        search_pattern = f"%{search}%"
        conditions.append(or_(
            ThreadFeedback.comment.ilike(search_pattern),
            Thread.title.ilike(search_pattern)
        ))
        
    if start_date:
        if start_date.tzinfo:
            start_date = start_date.replace(tzinfo=None)
        conditions.append(ThreadFeedback.created_at >= start_date)
        
    if end_date:
        if end_date.tzinfo:
            end_date = end_date.replace(tzinfo=None)
        conditions.append(ThreadFeedback.created_at <= end_date)
        
    if conditions:
        query = query.where(and_(*conditions))
        
    count_query = select(func.count(ThreadFeedback.id)).join(Thread)
    if conditions:
        count_query = count_query.where(and_(*conditions))
        
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    query = query.order_by(ThreadFeedback.created_at.desc()).offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    items = result.scalars().all()
    
    return items, total

async def delete_feedback(db: AsyncSession, feedback_id: UUID) -> bool:
    query = select(ThreadFeedback).where(ThreadFeedback.id == feedback_id)
    result = await db.execute(query)
    feedback = result.scalar_one_or_none()
    if not feedback:
        return False
    await db.delete(feedback)
    await db.commit()
    return True

async def get_feedback_stats(db: AsyncSession, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> dict:
    query = select(
        func.count(ThreadFeedback.id).label("total"),
        func.avg(ThreadFeedback.rating).label("avg_rating"),
        func.sum(func.cast(ThreadFeedback.is_accurate, Integer)).label("accurate_count"),
        func.sum(func.cast(ThreadFeedback.is_helpful, Integer)).label("helpful_count"),
        func.sum(func.cast(ThreadFeedback.is_understandable, Integer)).label("understandable_count")
    )
    
    conditions = []
    if start_date:
        conditions.append(ThreadFeedback.created_at >= start_date)
    if end_date:
        conditions.append(ThreadFeedback.created_at <= end_date)
        
    if conditions:
        query = query.where(and_(*conditions))
        
    result = await db.execute(query)
    row = result.first()
    
    total = row.total if row and row.total else 0
    avg_rating = float(row.avg_rating) if row and row.avg_rating else 0.0
    
    accurate_pct = (row.accurate_count / total * 100) if total > 0 and row.accurate_count is not None else 0.0
    helpful_pct = (row.helpful_count / total * 100) if total > 0 and row.helpful_count is not None else 0.0
    understandable_pct = (row.understandable_count / total * 100) if total > 0 and row.understandable_count is not None else 0.0
    
    return {
        "total_feedbacks": total,
        "average_rating": round(avg_rating, 2),
        "accurate_percentage": round(accurate_pct, 2),
        "helpful_percentage": round(helpful_pct, 2),
        "understandable_percentage": round(understandable_pct, 2)
    }

async def generate_csv_export(db: AsyncSession, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> str:
    query = select(ThreadFeedback).join(Thread).options(selectinload(ThreadFeedback.thread))
    
    conditions = []
    if start_date:
        conditions.append(ThreadFeedback.created_at >= start_date)
    if end_date:
        conditions.append(ThreadFeedback.created_at <= end_date)
        
    if conditions:
        query = query.where(and_(*conditions))
        
    query = query.order_by(ThreadFeedback.created_at.desc())
    result = await db.execute(query)
    feedbacks = result.scalars().all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Feedback ID", "Thread ID", "Thread Title", "Rating",
        "Accurate", "Helpful", "Understandable", "Comment", "Chat History", "Retrieved Contexts", "Created At"
    ])
    
    from app.services.thread_service import get_thread_messages
    
    for f in feedbacks:
        messages = await get_thread_messages(f.thread_id)
        chat_history_str = ""
        retrieved_contexts_str = ""
        for msg in messages:
            role_label = "User" if msg.role == "human" else "Bot"
            chat_history_str += f"{role_label}: {msg.content}\n"
            if msg.role == "ai" and msg.information:
                for idx, ctx in enumerate(msg.information):
                    retrieved_contexts_str += f"[Context {idx+1}]: {ctx}\n"
                    
        writer.writerow([
            str(f.id),
            str(f.thread_id),
            f.thread.title if f.thread else "",
            f.rating,
            "Yes" if f.is_accurate else "No" if f.is_accurate is not None else "",
            "Yes" if f.is_helpful else "No" if f.is_helpful is not None else "",
            "Yes" if f.is_understandable else "No" if f.is_understandable is not None else "",
            f.comment or "",
            chat_history_str.strip(),
            retrieved_contexts_str.strip(),
            f.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ])
        
    return output.getvalue()
