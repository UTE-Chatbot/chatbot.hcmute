from sqlalchemy import Column, Text, Integer, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base, BaseModel
import enum

class DocumentStatusEnum(str, enum.Enum):
    PENDING = "pending"    
    PARSING = "parsing"         
    READY = "ready"   
    INDEXING = "indexing"       
    INDEXED = "indexed"          
    FAILED = "failed"    

class Document(Base, BaseModel):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    name = Column(Text, nullable=False)
    full_text = Column(Text, nullable=True)
    file_path = Column(Text, nullable=True)
    status = Column(Enum(DocumentStatusEnum), default=DocumentStatusEnum.PENDING, nullable=False)
    document_metadata = Column(JSONB, nullable=True, default=dict)

    # Relationships
    user = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
