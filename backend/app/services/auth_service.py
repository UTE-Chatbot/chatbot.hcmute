from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.user import User, RoleEnum
from app.core.security import hash_password, verify_password
from app.schemas.user import UserCreate, UserGoogleCreate, UpdatePassword

async def register_email(db: AsyncSession, user_data: UserCreate):
    result = await db.execute(select(User).filter(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
        role=RoleEnum.USER
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def login_email(db: AsyncSession, email: str, password: str):
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return user

async def login_google(db: AsyncSession, google_data: UserGoogleCreate):
    result = await db.execute(select(User).filter(User.google_id == google_data.google_id))
    user = result.scalar_one_or_none()
    if user:
        # Update avatar if it changed
        if google_data.avatar and user.avatar != google_data.avatar:
            user.avatar = google_data.avatar
            await db.commit()
            await db.refresh(user)
        return user

    # Check if user exists with this email
    result = await db.execute(select(User).filter(User.email == google_data.email))
    user = result.scalar_one_or_none()
    if user:
        # Update existing user with Google ID
        user.google_id = google_data.google_id
        user.full_name = google_data.full_name
        user.avatar = google_data.avatar
        await db.commit()
        await db.refresh(user)
        return user

    # Create new user
    user = User(
        email=google_data.email,
        full_name=google_data.full_name,
        avatar=google_data.avatar,
        google_id=google_data.google_id,
        role=RoleEnum.USER
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def update_user_password(db: AsyncSession, user: User, password_data: UpdatePassword):
    if not user.hashed_password:
        if password_data.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Account created via Google OAuth. Leave current password empty to set a new password."
            )
    else:
        if not password_data.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Current password is required to update password."
            )
        if not verify_password(password_data.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Current password is incorrect"
            )
    
    user.hashed_password = hash_password(password_data.new_password)
    await db.commit()
    await db.refresh(user)
    return user
