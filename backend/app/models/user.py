import alembic_postgresql_enum
from sqlalchemy import Column, String, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, BaseModel
import enum
import uuid

class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"
    
class User(Base, BaseModel):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)       
    avatar = Column(String, nullable=True)    
    hashed_password = Column(String, nullable=True)
    google_id = Column(String, unique=True, nullable=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.USER)
    
    # Relationships
    threads = relationship("Thread", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
