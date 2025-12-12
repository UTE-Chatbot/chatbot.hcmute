from fastapi import APIRouter, UploadFile, HTTPException, Depends, status
from fastapi.responses import JSONResponse, Response

from app.services.minio_service import (
    upload_file,
    download_file,
    delete_file
)
from app.models.user import User, RoleEnum
from app.core.deps import require_roles

router = APIRouter(prefix="/files", tags=["Files"])

RAW_PREFIX = "raw"


@router.post("/upload", status_code=status.HTTP_201_CREATED, response_class=JSONResponse)
async def upload_file_to_minio(
    file: UploadFile,
    # current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    try:
        result = upload_file(RAW_PREFIX, file=file)
        
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "file_path": result["file_path"],
                "public_url": result["public_url"],
                "filename": result["filename"],
                "bucket": result["bucket"]
            }
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{file_url:path}")
async def get_file(file_url: str):
    file_stream = download_file(file_url)
    
    if file_stream is None:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": "Không tìm thấy tệp"}
        )
        
    return file_stream


@router.delete("/{file_url:path}", response_class=JSONResponse)
async def delete_file_only(
    file_url: str,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN))
):
    
    try:
        result = delete_file(file_url)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                **result,
                "message": "Đã xóa tệp khỏi bộ nhớ."
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": str(e)}
        )