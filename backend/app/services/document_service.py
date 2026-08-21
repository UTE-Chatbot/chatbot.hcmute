from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from typing import Optional, List, Dict, Any
from uuid import UUID
import logging

from app.models.document import Document, DocumentStatusEnum
from app.models.document_chunk import DocumentChunk
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentChunkCreate, DocumentChunkUpdate
from app.services.rag_service.component.parser import DocumentParser
from app.db.vector_db import vector_store
from langchain_core.documents import Document as VectorDocument

from app.db.session import AsyncSessionLocal
from app.services.rag_service.component.chunker import OmniChunkMode, OmniChunker, create_chunk_document

logger = logging.getLogger(__name__)

async def get_document_by_id(
    session: AsyncSession,
    document_id: int,
    load_chunks: bool = False
) -> Optional[Document]:
    query = select(Document).where(Document.id == document_id)
    if load_chunks:
        query = query.options(selectinload(Document.chunks))
    result = await session.execute(query)
    return result.scalar_one_or_none()

async def get_chunk_by_id(
    session: AsyncSession,
    chunk_id: int,
    document_id: Optional[int] = None
) -> Optional[DocumentChunk]:
    query = select(DocumentChunk).where(DocumentChunk.id == chunk_id)
    if document_id is not None:
        query = query.where(DocumentChunk.document_id == document_id)
    result = await session.execute(query)
    return result.scalar_one_or_none()

async def create_document(
    session: AsyncSession,
    document_data: DocumentCreate,
    user_id: UUID
) -> Document:
    # Convert Pydantic model to dict for JSONB storage
    metadata_dict = document_data.document_metadata.model_dump() if document_data.document_metadata else {}
    
    document = Document(
        name=document_data.name,
        full_text=document_data.full_text,
        file_path=document_data.file_path,
        document_metadata=metadata_dict,
        user_id=user_id,
        status=DocumentStatusEnum.PENDING 
    )
    session.add(document)
    await session.commit()
    await session.refresh(document)
    return document

async def   update_document_metadata(
    session: AsyncSession,
    document_id: int,
    document_data: DocumentUpdate
) -> Optional[Document]:
    document = await get_document_by_id(session, document_id, load_chunks=True)
    if not document:
        return None

    try:
        point_ids_to_delete = [chunk.point_id for chunk in document.chunks if chunk.point_id]
        if point_ids_to_delete:
            await vector_store.adelete(ids=point_ids_to_delete)
            logger.info(f"Deleted {len(point_ids_to_delete)} vectors for document {document_id}")
    except Exception as e:
        logger.error(f"Error deleting vectors for document {document_id}: {str(e)}")
    
    await session.execute(
        delete(DocumentChunk).where(DocumentChunk.document_id == document_id)
    )
    await session.commit()
    
  
    update_data = document_data.model_dump(exclude_unset=True)
    document.status = DocumentStatusEnum.PARSING
    for field, value in update_data.items():
        if field == "status": 
            continue
        # Convert Pydantic model to dict for JSONB storage
        if field == "document_metadata" and value is not None:
            value = value if isinstance(value, dict) else value.model_dump() if hasattr(value, 'model_dump') else dict(value)
        setattr(document, field, value)

    await session.commit()
    await session.refresh(document)

    return document

async def create_document_chunk_db(
    session: AsyncSession,
    document_id: int,
    chunk_data: DocumentChunkCreate
) -> DocumentChunk:
    document = await get_document_by_id(session, document_id)
    if not document:
        return None
    
    # Get max chunk_index for this document
    result = await session.execute(
        select(DocumentChunk.chunk_index)
        .where(DocumentChunk.document_id == document_id)
        .order_by(DocumentChunk.chunk_index.desc())
        .limit(1)
    )
    max_index = result.scalar_one_or_none()
    new_index = (max_index + 1) if max_index is not None else 0
    
    # Create vector document and add to vector store
    vector_doc = create_chunk_document(
        content=chunk_data.text,
        chunk_index=new_index,
        chunk_method="manual",
        document=document
    )
    point_ids = await vector_store.aadd_documents([vector_doc])
    
    new_chunk = DocumentChunk(
        document_id=document_id,
        chunk_index=new_index,
        text=chunk_data.text,
        point_id=point_ids[0] if point_ids else None
    )
    session.add(new_chunk)
    await session.commit()
    await session.refresh(new_chunk)
    return new_chunk

async def delete_document_db(session: AsyncSession, document_id: int) -> Optional[Document]:
    document = await get_document_by_id(session, document_id, load_chunks=True)
    if not document:
        return None
    
    cleanup_data = {
        "point_ids": [c.point_id for c in document.chunks if c.point_id],
        "file_path": document.file_path
    }
    
    await session.delete(document)
    await session.commit()
    return cleanup_data

async def delete_chunk_db(session: AsyncSession, chunk_id: int, document_id: int) -> Optional[str]:
    chunk = await get_chunk_by_id(session, chunk_id, document_id)
    if not chunk:
        return None
    
    # Delete from vector store
    if chunk.point_id:
        try:
            await vector_store.adelete(ids=[chunk.point_id])
        except Exception as e:
            logger.error(f"Error deleting chunk {chunk_id} from vector store: {str(e)}")
    
    await session.delete(chunk)
    await session.commit()
    return chunk.point_id

async def update_document_chunk_db(
    session: AsyncSession,
    chunk_id: int,
    document_id: int,
    chunk_data: DocumentChunkUpdate
) -> Optional[DocumentChunk]:
    chunk = await get_chunk_by_id(session, chunk_id, document_id)
    if not chunk:
        return None
    
    document = await get_document_by_id(session, document_id)
    if not document:
        return None
    
    # Update text if provided
    if chunk_data.text is not None:
        chunk.text = chunk_data.text
        
        # Delete old vector and create new one
        if chunk.point_id:
            try:
                await vector_store.adelete(ids=[chunk.point_id])
            except Exception as e:
                logger.error(f"Error deleting old vector for chunk {chunk_id}: {str(e)}")
        
        # Create new vector document
        vector_doc = create_chunk_document(
            content=chunk_data.text,
            chunk_index=chunk.chunk_index,
            chunk_method="manual",
            document=document
        )
        point_ids = await vector_store.aadd_documents([vector_doc])
        chunk.point_id = point_ids[0] if point_ids else None
    
    await session.commit()
    await session.refresh(chunk)
    return chunk

async def chunk_document(document_id: int, chunk_mode: OmniChunkMode) -> List[VectorDocument]:
    """Chunk document and store in vector DB."""
    async with AsyncSessionLocal() as session: 
        document = await get_document_by_id(session, document_id)
        if not document:
            return  
        
        try:
            chunker = OmniChunker(
                overlap=200,
                mode=chunk_mode,
                document=document,
                is_replace_large_table=True
            )
            
            document.status = DocumentStatusEnum.INDEXING
            await session.commit()
            chunks, content = await chunker.chunk_document()
            document.full_text = content
            await session.commit()
            
            document_chunks: List[DocumentChunk] = []
            vector_chunks: List[VectorDocument] = []
            for idx, chunk_item in enumerate(chunks):
                doc_chunk = DocumentChunk(
                    document_id=document.id,
                    chunk_index=idx,
                    text=chunk_item.page_content
                )
                
                document_chunks.append(doc_chunk)
                vector_chunks.append(chunk_item)
            if vector_chunks:
                point_ids = await vector_store.aadd_documents(vector_chunks)
                for doc_chunk, pid in zip(document_chunks, point_ids):
                    doc_chunk.point_id = pid
            session.add_all(document_chunks)
            document.status = DocumentStatusEnum.INDEXED
            await session.commit()
            logger.info(f"Document {document_id} chunked successfully.")
        except Exception as e:
            logger.error(f"Error chunking document {document_id}: {str(e)}")
            await session.rollback()
            document.status = DocumentStatusEnum.CHUNKING_FAILED
            session.add(document)
            await session.commit()
                
                
async def parse_document(document_id: int) -> bool:
    """Parse document file to extract text. Returns True on success."""
    async with AsyncSessionLocal() as session:
        document = await get_document_by_id(session, document_id)
        if not document:
            return False
        
        parser = DocumentParser()
        try:
            document.status = DocumentStatusEnum.PARSING
            await session.commit()
            
            markdown = await parser.process(document.file_path)
            document.full_text = markdown
            
            document.status = DocumentStatusEnum.READY
            await session.commit()
            return True
        except Exception as e:
            logger.error(f"Error parsing document {document_id}: {str(e)}")
            await session.rollback()
            document.status = DocumentStatusEnum.PARSING_FAILED
            session.add(document)
            await session.commit()
            return False

async def bg_process_document_pipeline(document_id: int, chunk_mode: str, is_enable_parse: bool = False):
    async with AsyncSessionLocal() as session:
        document = await get_document_by_id(session, document_id)
        if not document:
            return
        
        if is_enable_parse:
            await parse_document(document_id)
            
        await chunk_document(document_id, chunk_mode)        

async def bg_cleanup_deleted_document(point_ids: List[str], file_path: Optional[str]):
    try:
        if point_ids:
            await vector_store.adelete(ids=point_ids)
        
        # if file_path:
        #     minio_delete_file(file_path)
    except Exception as e:
        logger.error(f"Error cleaning up document resources: {str(e)}")

async def bg_cleanup_deleted_chunk(point_id: str):
    try:
        if point_id:
            await vector_store.adelete(ids=[point_id])
    except Exception as e:
        logger.error(f"Error cleaning up chunk vector: {str(e)}")   


async def search_document(query: str, top_k: int = 5) :
    try:
        results = await vector_store.asimilarity_search_with_relevance_scores(query, k=top_k)
        return results
    except Exception as e:
        logger.error(f"Error searching document: {str(e)}")
        return []


async def keyword_search_chunks(
    session: AsyncSession,
    keyword: str,
    page: int = 1,
    size: int = 20
) -> Dict[str, Any]:
    """Search chunks by keyword (text contains)."""
    offset = (page - 1) * size
    
    count_query = select(DocumentChunk).where(DocumentChunk.text.ilike(f"%{keyword}%"))
    count_result = await session.execute(count_query)
    total = len(count_result.scalars().all())
    
    query = (
        select(DocumentChunk)
        .where(DocumentChunk.text.ilike(f"%{keyword}%"))
        .offset(offset)
        .limit(size)
        .order_by(DocumentChunk.document_id, DocumentChunk.chunk_index)
    )
    result = await session.execute(query)
    chunks = result.scalars().all()
    
    return {
        "items": chunks,
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size if size > 0 else 0
    }


async def bulk_replace_keyword_in_chunks(
    session: AsyncSession,
    keyword: str,
    replacement: str,
    chunk_ids: Optional[List[int]] = None
) -> Dict[str, Any]:
    """Replace keyword in chunks. If chunk_ids is None, replace in all matching chunks."""
    query = select(DocumentChunk).where(DocumentChunk.text.ilike(f"%{keyword}%"))
    if chunk_ids:
        query = query.where(DocumentChunk.id.in_(chunk_ids))
    
    result = await session.execute(query)
    chunks = result.scalars().all()
    
    updated_count = 0
    updated_chunk_ids = []
    
    for chunk in chunks:
        if keyword.lower() in chunk.text.lower():
            import re
            new_text = re.sub(re.escape(keyword), replacement, chunk.text, flags=re.IGNORECASE)
            chunk.text = new_text
            updated_chunk_ids.append(chunk.id)
            updated_count += 1
    
    await session.commit()
    
    for chunk in chunks:
        if chunk.id in updated_chunk_ids:
            document = await get_document_by_id(session, chunk.document_id)
            if document and chunk.point_id:
                try:
                    await vector_store.adelete(ids=[chunk.point_id])
                except Exception as e:
                    logger.error(f"Error deleting old vector for chunk {chunk.id}: {str(e)}")
                
                vector_doc = create_chunk_document(
                    content=chunk.text,
                    chunk_index=chunk.chunk_index,
                    chunk_method="bulk_replace",
                    document=document
                )
                point_ids = await vector_store.aadd_documents([vector_doc])
                chunk.point_id = point_ids[0] if point_ids else None
    
    await session.commit()
    
    return {
        "updated_count": updated_count,
        "updated_chunk_ids": updated_chunk_ids
    }