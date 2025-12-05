from sqlalchemy import Column, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base, BaseModel

class DocumentChunk(Base, BaseModel):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    point_id = Column(UUID(as_uuid=True), nullable=True)
    chunk_index = Column(Integer, nullable=True, autoincrement=True)
    text = Column(Text, nullable=False)
    
    # Relationships
    document = relationship("Document", back_populates="chunks")
    
