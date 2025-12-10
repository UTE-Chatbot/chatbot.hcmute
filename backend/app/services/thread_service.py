import uuid
from typing import List, Optional, Tuple
from uuid import UUID
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from collections import Counter
import re

from app.models.thread import Thread
from app.models.rate_limit import RateLimit
from app.models.user import User, RoleEnum
from app.services.rag_service.component.chat_history import ChatHistory
from app.schemas.thread import ThreadCreate, ThreadResponse, ThreadMessagesResponse, MessageResponse, ThreadReportResponse
from app.core.config import settings

# Initialize chat history
_chat_history_instance = None


def _get_chat_history() -> ChatHistory:
    """Lazy load chat history instance"""
    global _chat_history_instance
    if _chat_history_instance is None:
        _chat_history_instance = ChatHistory()
    return _chat_history_instance


async def create_thread(
    db: AsyncSession,
    title: Optional[str] = None,
    client_id: Optional[str] = None,
    user_id: Optional[UUID] = None
) -> Thread:
    """Create a new thread with optional user association."""
    thread_id = uuid.uuid4()
    thread = Thread(
        thread_id=thread_id,
        title=title,
        user_id=user_id,
        client_id=client_id
    )
    
    db.add(thread)
    await db.commit()
    await db.refresh(thread)
    return thread


async def get_thread_by_id(db: AsyncSession, thread_id: UUID) -> Optional[Thread]:
    """Get thread by thread_id."""
    result = await db.execute(
        select(Thread)
        .where(Thread.thread_id == thread_id)
        .options(selectinload(Thread.user))
    )
    return result.scalar_one_or_none()


async def get_threads_by_client_id(
    db: AsyncSession,
    client_id: str,
    limit: int = 50,
    offset: int = 0
) -> List[Thread]:
    """Get all threads for a client."""
    result = await db.execute(
        select(Thread)
        .where(Thread.client_id == client_id)
        .order_by(Thread.created_at.desc())
        .limit(limit)
        .offset(offset)
        .options(selectinload(Thread.user))
    )
    return result.scalars().all()


async def delete_thread(db: AsyncSession, thread_id: UUID) -> bool:
    """Delete a thread and its chat history."""
    thread = await get_thread_by_id(db, thread_id)
    if not thread:
        return False
    
    # Delete from database
    await db.delete(thread)
    await db.commit()
    
    # Note: Chat history deletion should be handled by chat_history service
    # if LangChain has cascade delete enabled
    return True


async def check_rate_limit(
    db: AsyncSession,
    client_id: str,
    is_admin: bool = False,
    limit_per_day: Optional[int] = None
) -> Tuple[bool, int]:
    """
    Check if client has exceeded rate limit.
    Returns (allowed: bool, remaining_seconds: int)
    
    For admins: no rate limit
    For non-admins: limit_per_day questions per 24 hours
    """
    if limit_per_day is None:
        limit_per_day = settings.question_limit_per_day
    
    if is_admin:
        return True, 0
    
    now = datetime.now()
    
    result = await db.execute(
        select(RateLimit).where(
            and_(
                RateLimit.client_id == client_id,
                RateLimit.reset_at > now
            )
        )
    )
    rate_limit = result.scalar_one_or_none()
    
    if not rate_limit:
        rate_limit = RateLimit(
            client_id=client_id,
            question_count=0,
            reset_at=now + timedelta(days=1)
        )
        db.add(rate_limit)
        await db.commit()
    
    if rate_limit.question_count >= limit_per_day:
        remaining_seconds = int((rate_limit.reset_at - now).total_seconds())
        return False, remaining_seconds
    
    rate_limit.question_count += 1
    await db.commit()
    
    remaining = limit_per_day - rate_limit.question_count
    return True, remaining


async def get_thread_messages(thread_id: UUID) -> List[MessageResponse]:
    """Get all messages in a thread."""
    try:
        chat_history = _get_chat_history()
        messages = chat_history.get_messages_from_session(str(thread_id))
        message_responses = []
        
        for message in messages:
            if message.type == "human":
                role = "human"
            elif message.type == "ai":
                role = "ai"
            else:
                continue
            
            message_responses.append(MessageResponse(role=role, content=message.content))
        
        return message_responses
    except Exception as e:
        print(f"Error getting messages for thread {thread_id}: {e}")
        return []


def _extract_keywords_from_text(text: str, top_k: int = 10) -> List[str]:
    """
    Extract keywords from text using NLP techniques.
    
    Strategies:
    1. Remove stopwords and short words
    2. Extract noun phrases and important terms
    3. Use TF-IDF-like frequency analysis
    """
    # Vietnamese and English stopwords
    stopwords = {
        'là', 'cái', 'của', 'và', 'với', 'cho', 'từ', 'tại', 'có', 'khi',
        'được', 'để', 'vào', 'các', 'một', 'cũng', 'về', 'như', 'thì', 'sau',
        'trước', 'nếu', 'những', 'hay', 'trong', 'ngoài', 'hoặc', 'mà', 'sẽ',
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'by', 'to',
        'for', 'of', 'with', 'is', 'are', 'be', 'been', 'being', 'have', 'has',
        'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might'
    }
    
    # Use underthesea for word segmentation
    # This handles Vietnamese compound words better than simple regex
    try:
        from underthesea import word_tokenize
        words = word_tokenize(text.lower())
    except ImportError:
        # Fallback to simple regex if underthesea is not installed
        print("Warning: underthesea not found, falling back to regex")
        sentences = re.split(r'[.!?。！？]', text.lower())
        words = []
        for sentence in sentences:
            words.extend(re.findall(r'\b[\w\u0100-\uFFFF]+\b', sentence))

    # Filter words
    cleaned_words = []
    for word in words:
        # Normalize word: replace underscores with spaces for display if needed, 
        # but usually we want to keep them as single tokens or handle them.
        # underthesea returns "học_phí", we might want "học phí" or keep it as is.
        # Let's keep it as is for keyword matching, or replace _ with space.
        
        # Check if it's a valid word (has letters/numbers)
        if not any(c.isalnum() for c in word):
            continue
            
        # Filter: not in stopwords, length > 2 (ignoring underscores for length check?)
        # "an" is 2 chars. "học" is 3.
        if word not in stopwords and len(word) > 2:
            cleaned_words.append(word)
    
    # Count word frequencies
    word_freq = Counter(cleaned_words)
    
    # Get top keywords and normalize (replace underscores with spaces)
    top_keywords = [word.replace('_', ' ') for word, _ in word_freq.most_common(top_k)]
    
    return top_keywords


def _extract_topics_from_keywords(keywords: List[str]) -> List[str]:
    """
    Group keywords into potential topics.
    
    Uses semantic grouping for related terms.
    """
    topic_groups = {
        'admission': ['admission', 'tuition', 'enrollment', 'register', 'đăng ký', 'nhập học', 'học phí'],
        'academic': ['course', 'class', 'subject', 'grade', 'assignment', 'exam', 'khóa học', 'môn học', 'điểm'],
        'schedule': ['schedule', 'timetable', 'time', 'date', 'when', 'lịch', 'thời gian', 'ngày'],
        'facility': ['library', 'lab', 'campus', 'facility', 'building', 'room', 'phòng', 'tòa nhà'],
        'support': ['help', 'support', 'question', 'problem', 'issue', 'help', 'hỗ trợ', 'vấn đề'],
        'career': ['career', 'job', 'employment', 'internship', 'company', 'work', 'việc làm', 'công việc'],
    }
    
    detected_topics = set()
    
    for keyword in keywords:
        for topic, related_terms in topic_groups.items():
            if keyword in related_terms:
                detected_topics.add(topic)
    
    return sorted(list(detected_topics))


async def generate_thread_report(
    db: AsyncSession,
    client_id: Optional[str] = None
) -> ThreadReportResponse:
    """
    Generate an advanced report of thread activity.
    
    If client_id is provided, generates report for that specific client.
    If client_id is None, generates report for ALL threads in the system (admin use).
    
    Uses NLP to extract meaningful keywords and topics.
    """
    # Get threads - either for specific client or all threads
    if client_id:
        result = await db.execute(
            select(Thread).where(Thread.client_id == client_id)
        )
    else:
        result = await db.execute(select(Thread))
    
    threads = result.scalars().all()
    
    total_threads = len(threads)
    total_messages = 0
    all_user_text = []  # Collect all user questions
    
    # Collect messages from all threads
    for thread in threads:
        messages = await get_thread_messages(thread.thread_id)
        total_messages += len(messages)
        
        # Collect human messages for analysis
        for msg in messages:
            if msg.role == "human":
                all_user_text.append(msg.content)
    
    # Combine all user text and extract keywords
    combined_text = " ".join(all_user_text)
    keywords = _extract_keywords_from_text(combined_text, top_k=15)
    topics = _extract_topics_from_keywords(keywords)
    
    average_messages = total_messages / total_threads if total_threads > 0 else 0
    
    return ThreadReportResponse(
        total_threads=total_threads,
        total_messages=total_messages,
        keywords=keywords,
        topics=topics,
        average_messages_per_thread=round(average_messages, 2)
    )


async def update_thread_title(
    db: AsyncSession,
    thread_id: UUID,
    title: str
) -> Optional[Thread]:
    """Update thread title."""
    thread = await get_thread_by_id(db, thread_id)
    if not thread:
        return None
    
    thread.title = title
    await db.commit()
    await db.refresh(thread)
    return thread


async def set_thread_title_from_first_question(
    db: AsyncSession,
    thread_id: UUID,
    question: str
) -> Optional[Thread]:
    """
    Set thread title from first question if title is empty.
    Truncates to 100 characters.
    """
    thread = await get_thread_by_id(db, thread_id)
    if not thread:
        return None
    
    # Only set if title is empty or None
    if not thread.title or thread.title.strip() == "":
        # Use first 100 chars of question as title
        title = question[:100]
        thread.title = title
        await db.commit()
        await db.refresh(thread)
    
    return thread
