from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional
from enum import Enum
from uuid import UUID
from app.models.user import RoleEnum
from app.schemas.common import GenericQueryParams

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str]

class UserGoogleCreate(BaseModel):
    email: EmailStr
    full_name: Optional[str]
    avatar: Optional[str]
    google_id: str

class UserRead(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str]
    avatar: Optional[str]
    role: RoleEnum

    class Config:
        from_attributes = True

class Login(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UpdatePassword(BaseModel):
    current_password: str
    new_password: str
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class PasswordUpdateResponse(BaseModel):
    message: str = "Password updated successfully"
    user: UserRead

class UserQueryParams(GenericQueryParams):
    pass
