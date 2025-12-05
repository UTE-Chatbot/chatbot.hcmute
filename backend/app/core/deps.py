from fastapi import Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
import uuid

from app.db.session import get_db
from app.models.user import User, RoleEnum
from app.core.security import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_token_from_cookie(request: Request) -> str:
    """Extract JWT token from cookie"""
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return token

def get_token_from_header_or_cookie(request: Request) -> str:
    """Extract JWT token from cookie or Authorization header (fallback)"""
    # Try cookie first
    token = request.cookies.get("access_token")
    if token:
        return token
    
    # Fallback to Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ")[1]
    
    raise HTTPException(status_code=401, detail="Unauthorized")

async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)):
    """Get current user from JWT token in cookies"""
    try:
        token = get_token_from_cookie(request)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = uuid.UUID(payload.get("sub"))
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_current_user_flexible(request: Request, db: AsyncSession = Depends(get_db)):
    """Get current user from JWT token in cookies or Authorization header"""
    try:
        token = get_token_from_header_or_cookie(request)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = uuid.UUID(payload.get("sub"))
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_roles(*roles: RoleEnum):
    def wrapper(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(
                status_code=403, 
                detail=f"Access denied. Required roles: {[role.value for role in roles]}"
            )
        return user
    return wrapper

def require_role(role: RoleEnum):
    """Backward compatibility for single role requirement"""
    return require_roles(role)
