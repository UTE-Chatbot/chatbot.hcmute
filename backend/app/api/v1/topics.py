from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from typing import Dict, Any

from app.services.topic_service import read_topics, write_topics
from app.core.deps import require_role
from app.models.user import RoleEnum

router = APIRouter(prefix="/topics", tags=["Topics"])


@router.get("/topics", response_class=JSONResponse)
def get_topics():
    try:
        data = read_topics()
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=data
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"Đọc chủ đề thất bại: {str(e)}"}
        )


@router.put("/topics", response_class=JSONResponse)
def update_topics(
    topics: Dict[str, Any],
    user=Depends(require_role(RoleEnum.ADMIN))
):
    try:
        write_topics(topics)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=topics
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"Cập nhật chủ đề thất bại: {str(e)}"}
        )