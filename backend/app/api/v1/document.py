from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_querybuilder import QueryBuilder
from fastapi_pagination import Page
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
from app.services import document_service
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


@router.get("")
async def get_documents_paginated(
    query=QueryBuilder(Document),
    session: AsyncSession = Depends(get_db)
):
    result = await paginate(session, query)
    return JSONResponse(content=result.__dict__, status_code=status.HTTP_200_OK)

@router.post("")
async def create_document(
    document_data: DocumentCreate,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    document = await document_service.create_document(session, document_data, current_user.id)
    is_enable_parse = (document_data.full_text is None or document_data.full_text == "") and (document_data.file_path is not None and document_data.file_path != "")
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
    session: AsyncSession = Depends(get_db)
):
    document = await document_service.get_document_by_id(session, document_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài liệu")
    return JSONResponse(content=serialize_document(document, request), status_code=status.HTTP_200_OK)

@router.put("/{document_id}")
async def update_document(
    document_id: int,
    document_data: DocumentUpdate,
    background_tasks: BackgroundTasks,
    chunk_mode: str = OmniChunkMode.LLM_CHUNK,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    doc = await document_service.get_document_by_id(session, document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài liệu")
    

    updated_doc = await document_service.update_document_metadata(session, document_id, document_data)
    if not updated_doc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Cập nhật tài liệu thất bại")
    
    is_full_text_changed = document_data.full_text is not None and len(document_data.full_text) > 0 and document_data.full_text != doc.full_text
    is_file_path_changed = document_data.file_path is not None and len(document_data.file_path) > 0 and document_data.file_path != doc.file_path
    is_failed = doc.status == "FAILED"
    is_metadata_only_change = not is_full_text_changed and not is_file_path_changed
    is_enable_parse = is_file_path_changed or is_failed
    
    if is_metadata_only_change:
        chunk_mode = OmniChunkMode.DELIMITER_SPLIT
        is_enable_parse = False
        
    background_tasks.add_task(
        document_service.bg_update_document_pipeline,
        document_id,
        chunk_mode,
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
            document_service.minio_delete_file, 
            cleanup_data["file_path"]
        )
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/{document_id}/chunks")
async def get_document_chunks(
    document_id: int,
    query=QueryBuilder(DocumentChunk),
    session: AsyncSession = Depends(get_db)
):
    if not await document_service.get_document_by_id(session, document_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài liệu")

    query = query.filter(DocumentChunk.document_id == document_id)
    result = await paginate(session, query)
    return JSONResponse(content=result.__dict__, status_code=status.HTTP_200_OK)

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
    return JSONResponse(content={"results": results}, status_code=status.HTTP_200_OK)

    