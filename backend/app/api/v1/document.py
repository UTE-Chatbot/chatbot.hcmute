from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi_querybuilder import QueryBuilder
from fastapi_pagination import Page, Params
from typing import List
from fastapi.responses import JSONResponse, Response

from app.db.session import get_db
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.user import User, RoleEnum
from app.schemas.document import (
    DocumentResponse,
    DocumentCreate,
    DocumentUpdate,
    DocumentChunkResponse,
    DocumentChunkUpdate,
    DocumentChunkCreate
)
from app.services import document_service, minio_service
from app.core.deps import require_roles
from fastapi_pagination.ext.sqlalchemy import paginate
from app.services.rag_service.component.chunker import OmniChunkMode

router = APIRouter(prefix="/documents", tags=["Documents"])

def serialize_document(document: Document, request: Request = None) -> dict:
    doc_dict = DocumentResponse.model_validate(document).model_dump(mode="json")
    if request and document.file_path:
        base_url = str(request.base_url).rstrip('/')
        doc_dict["public_url"] = f"{base_url}/api/v1/files/{document.file_path}"
    else:
        doc_dict["public_url"] = None
    return doc_dict

def serialize_chunk(chunk: DocumentChunk) -> dict:
    return DocumentChunkResponse.model_validate(chunk).model_dump(mode="json")


@router.get("", response_model=Page[DocumentResponse])
async def get_documents_paginated(
    query=QueryBuilder(Document),
    params: Params = Depends(),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    result = await paginate(session, query, params)
    return result
@router.post("")
async def create_document(
    document_data: DocumentCreate,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    document = await document_service.create_document(session, document_data, current_user.id)
    is_enable_parse = (document_data.file_path is not None and document_data.file_path != "")
    background_tasks.add_task(
        document_service.bg_process_document_pipeline,
        document.id,
        document_data.chunk_mode,
        is_enable_parse=is_enable_parse,
    )
    
    return JSONResponse(content=serialize_document(document), status_code=status.HTTP_201_CREATED)
    
    
@router.get("/{document_id}")
async def get_document(
    document_id: int,
    request: Request,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    document = await document_service.get_document_by_id(session, document_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài liệu")
    return JSONResponse(content=serialize_document(document, request), status_code=status.HTTP_200_OK)
from app.models.document import DocumentStatusEnum
@router.put("/{document_id}")
async def update_document(
    document_id: int,
    document_data: DocumentUpdate,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    doc = await document_service.get_document_by_id(session, document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài liệu")
    updated_doc = await document_service.update_document_metadata(session, document_id, document_data)
    if not updated_doc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Cập nhật tài liệu thất bại")
    if (document_data.file_path is not None and document_data.file_path != doc.file_path) or (doc.status == DocumentStatusEnum.PARSING_FAILED) or (doc.full_text is None or doc.full_text == "" and doc.file_path is not None and doc.file_path != ""):
        is_enable_parse = True
    else:
        is_enable_parse = False
        
    background_tasks.add_task(
        document_service.bg_process_document_pipeline,
        document_id,
        document_data.chunk_mode or OmniChunkMode.DELIMITER_SPLIT,
        is_enable_parse = is_enable_parse,
    )
    return JSONResponse(content=serialize_document(updated_doc), status_code=status.HTTP_200_OK)

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    cleanup_data = await document_service.delete_document_db(session, document_id)
    
    if not cleanup_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài liệu")
    
    if cleanup_data.get("file_path"):
        background_tasks.add_task(
            minio_service.delete_file, 
            cleanup_data["file_path"]
        )
    
    background_tasks.add_task(
        document_service.bg_cleanup_deleted_document,
        cleanup_data.get("point_ids", []),
        cleanup_data.get("file_path")
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/{document_id}/chunks", response_model=Page[DocumentChunkResponse])
async def get_document_chunks(
    document_id: int,
    query=QueryBuilder(DocumentChunk),
    params: Params = Depends(),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    if not await document_service.get_document_by_id(session, document_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài liệu")

    query = query.filter(DocumentChunk.document_id == document_id)
    result = await paginate(session, query, params)
    return result

@router.post("/{document_id}/chunks")
async def create_document_chunk(
    document_id: int,
    chunk_data: DocumentChunkCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    if not await document_service.get_document_by_id(session, document_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài liệu")

    new_chunk = await document_service.create_document_chunk_db(session, document_id, chunk_data)
    
    return JSONResponse(content=serialize_chunk(new_chunk), status_code=status.HTTP_201_CREATED)

@router.put("/{document_id}/chunks/{chunk_id}")
async def update_document_chunk(
    document_id: int,
    chunk_id: int,
    chunk_data: DocumentChunkUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    chunk = await document_service.get_chunk_by_id(session, chunk_id, document_id)
    if not chunk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy đoạn văn bản")

    updated_chunk = await document_service.update_document_chunk_db(session, chunk_id, document_id, chunk_data)
    
    if not updated_chunk:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Cập nhật đoạn văn bản thất bại")
    
    return JSONResponse(content=serialize_chunk(updated_chunk), status_code=status.HTTP_200_OK)

@router.delete("/{document_id}/chunks/{chunk_id}")
async def delete_document_chunk(
    document_id: int,
    chunk_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    deleted_chunk = await document_service.delete_chunk_db(session, chunk_id, document_id)
    
    if not deleted_chunk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy đoạn văn bản")

    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/search")
async def search_document(
    query: str,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    results = await document_service.search_document(query)
    
    # Collect point IDs from results
    point_ids = set()
    for doc, _ in results:
        # Prioritize _id from metadata as it represents the point_id
        if doc.metadata and doc.metadata.get("_id"):
            point_ids.add(str(doc.metadata["_id"]))
        elif hasattr(doc, "id") and doc.id:
            point_ids.add(str(doc.id))
            
    # Lookup chunks in database using UUIDs
    chunk_map = {}
    if point_ids:
        from uuid import UUID
        search_ids = []
        for pid in point_ids:
            try:
                search_ids.append(UUID(pid))
            except ValueError:
                continue
                
        if search_ids:
            stmt = select(DocumentChunk).where(DocumentChunk.point_id.in_(search_ids))
            db_results = await session.execute(stmt)
            chunks = db_results.scalars().all()
            chunk_map = {str(chunk.point_id): chunk for chunk in chunks}
    
    formatted_results = []
    for document, score in results:
        # Determine point_id for this document
        point_id = None
        if document.metadata and document.metadata.get("_id"):
            point_id = str(document.metadata["_id"])
        elif hasattr(document, "id") and document.id:
            point_id = str(document.id)
            
        # Enrich metadata
        if point_id and point_id in chunk_map:
            chunk = chunk_map[point_id]
            document.metadata["chunk_id"] = chunk.id
            document.metadata["document_id"] = chunk.document_id
            
        formatted_results.append({
            "document": {
                "page_content": document.page_content,
                "metadata": document.metadata
            },
            "score": score
        })
        
    return JSONResponse(content=formatted_results, status_code=status.HTTP_200_OK)