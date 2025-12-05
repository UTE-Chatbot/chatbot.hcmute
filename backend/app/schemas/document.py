from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


    
class DocumentMetadata(BaseModel):
    topic: str
    subtopic: str

    class Config:
        extra = "allow"  



class DocumentBase(BaseModel):
    name: str = Field(..., description="Name of the document")
    full_text: Optional[str] = Field(None, description="Full text content of the document")
    file_path: Optional[str] = Field(None, description="Path to the document file")
    document_metadata: Optional[DocumentMetadata] = Field(None, description="Additional metadata for the document")

from app.services.rag_service.component.chunker import OmniChunkMode

class DocumentCreate(BaseModel):
    name: str = Field(..., description="Name of the document")
    full_text: Optional[str] = Field(None, description="Full text content of the document")
    file_path: Optional[str] = Field(None, description="Path to the document file")
    document_metadata: Optional[DocumentMetadata] = Field(None, description="Additional metadata for the document")
    chunk_mode: OmniChunkMode = Field(OmniChunkMode.LLM_CHUNK, description="Chunking mode to use for the document")
    
    @model_validator(mode='after')
    def validate_text_or_file_path(self):
        if not self.full_text and not self.file_path:
            raise ValueError('Either full_text or file_path must be provided')
        if self.full_text and self.file_path:
            raise ValueError('Only one of full_text or file_path should be provided')
        return self

class DocumentUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Name of the document")
    full_text: Optional[str] = Field(None, description="Full text content of the document")
    file_path: Optional[str] = Field(None, description="Path to the document file")
    document_metadata: Optional[DocumentMetadata] = Field(None, description="Additional metadata for the document")
    chunk_mode: OmniChunkMode = Field(OmniChunkMode.DELIMITER_SPLIT, description="Chunking mode to use for the document")
    
class DocumentResponse(DocumentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: Optional[UUID]
    status: str
    document_metadata: Optional[DocumentMetadata]
    created_at: datetime
    updated_at: datetime

class DocumentChunkBase(BaseModel):
    chunk_index: int = Field(..., description="Index of the chunk")
    text: str = Field(..., description="Text content of the chunk")

class DocumentChunkCreate(BaseModel):
    text: str = Field(..., description="Text content of the chunk")

class DocumentChunkUpdate(BaseModel):
    text: Optional[str] = Field(None, description="Text content of the chunk")

class DocumentChunkResponse(DocumentChunkBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    document_id: int
    point_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

