import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from app.api.v1.api_router import api_router
from app.core.config import settings    
from starlette.middleware.sessions import SessionMiddleware
from fastapi_pagination import add_pagination
from contextlib import asynccontextmanager
from pydantic import BaseModel
from app.services.rag_service.core.graph import RAG


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.services.minio_service import create_bucket_once
    from app.services import csv_tables_service
    from app.db.checkpointer import get_checkpointer    
    create_bucket_once()
    await csv_tables_service.rebuild_database()
    checkpointer = await get_checkpointer()
    rag_instance = await RAG.create()
    app.state.rag = rag_instance

    png_bytes = rag_instance.graph.get_graph(xray=True).draw_mermaid_png()
    with open("graph_visualization.png", "wb") as f:
        f.write(png_bytes)
    print("Graph saved to graph_visualization.png")
    yield

app = FastAPI(lifespan=lifespan)
add_pagination(app)

app.add_middleware(
    SessionMiddleware,
    secret_key= settings.session_secret_key
)
app.include_router(api_router, prefix="/api/v1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allow_origins,
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)
