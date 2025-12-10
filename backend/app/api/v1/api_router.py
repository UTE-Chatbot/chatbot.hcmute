from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.document import router as document_router
from app.api.v1.minio import router as minio_router
from app.api.v1.topics import router as topics_router
from app.api.v1.csv_tables import router as csv_tables_router
from app.api.v1.thread import router as thread_router, chat_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(document_router)
api_router.include_router(minio_router)
api_router.include_router(topics_router)
api_router.include_router(csv_tables_router)
api_router.include_router(thread_router)
api_router.include_router(chat_router)