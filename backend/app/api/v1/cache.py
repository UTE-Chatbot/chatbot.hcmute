from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from typing import Optional

from app.core.config import settings
from app.core.deps import require_roles
from app.models.user import RoleEnum, User

router = APIRouter(prefix="/cache", tags=["Cache"])

class CacheConfigUpdate(BaseModel):
    threshold: float

@router.post("/flush", status_code=status.HTTP_200_OK)
async def flush_cache(
    request: Request,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    """
    Clear all entries in the semantic cache.
    """
    rag = getattr(request.app.state, "rag", None)
    if not rag or not rag.semantic_cache:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail="RAG service or cache not initialized"
        )
    
    count = await rag.semantic_cache.clear_cache()
    return {"message": "Cache cleared successfully", "deleted_count": count}

@router.get("/config")
async def get_cache_config(
    request: Request,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    """
    Get current cache configuration.
    """
    rag = getattr(request.app.state, "rag", None)
    current_threshold = settings.cache_threshold
    
    if rag and rag.semantic_cache:
        current_threshold = rag.semantic_cache.threshold
        
    return {
        "cache_threshold": current_threshold,
        "cache_ttl": settings.cache_ttl
    }

@router.post("/config")
async def update_cache_config(
    body: CacheConfigUpdate,
    request: Request,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    """
    Update cache configuration (Threshold).
    """
    if not 0.0 <= body.threshold <= 1.0:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Threshold must be between 0.0 and 1.0"
        )
        
    rag = getattr(request.app.state, "rag", None)
    
    # Update global settings (in-memory)
    settings.cache_threshold = body.threshold
    
    # Update live instance
    if rag and rag.semantic_cache:
        rag.semantic_cache.set_threshold(body.threshold)
        
    return {
        "message": "Cache configuration updated",
        "cache_threshold": settings.cache_threshold
    }
