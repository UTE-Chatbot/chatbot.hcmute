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

@app.get("/sche")
async def get_graph_schema():
    from app.services import csv_tables_service
    sche = await csv_tables_service.get_all_tables_with_db_schema()
    print("Database schema:", sche)
    return JSONResponse(content=sche)

@app.get("/new")
async def create_new_thread():
    thread_id = str(uuid.uuid4())
    return JSONResponse(content={"thread_id": thread_id})
class QuestionRequest(BaseModel):
    question: str

@app.post("/ask/{thread_id}")
async def stream_response(body: QuestionRequest, request: Request, thread_id: str):
    ip = request.client.host if request.client else "unknown"
    # fingerprint = get_fingerprint(request)
    # Check if file exists
    # if not os.path.exists(LOG_FILE):
    #     with open(LOG_FILE, "w") as f:
    #         pass
    # with open("./chat_logs.csv", "a", newline="") as f:
    #     writer = csv.writer(f)
    #     writer.writerow([ip, thread_id])
    # allowed, remain = check_and_update_limit(fingerprint)
    # if not allowed:
    #     log_to_csv(ip, thread_id, body.question, "")
    #     async def limit_stream():
    #         format_time = lambda r: f"{r//3600} giờ {r%3600//60} phút {r%60} giây"
    #         yield f"Hôm nay bạn đã hỏi đạt giới hạn câu hỏi, mai mình gặp lại nhau nhé, còn lại {format_time(remain)} nữa nhé 😉"
    #     return StreamingResponse(limit_stream(), media_type="text/plain")
    question = body.question
    rag = app.state.rag
    async def stream():
        answer_parts = []
        try:
            async for chunk in rag.execute_workflow(question, thread_id):
                if await request.is_disconnected():
                    break
                answer_parts.append(chunk)
                yield chunk
            # log_to_csv(ip, thread_id, question, ''.join(answer_parts))
        except Exception as e:
            # log_to_csv(ip, thread_id, question, "")
            yield "Nắng hôm nay chói chang quá, say nắng một xíu tôi trở lại ngay nhé."
    return StreamingResponse(stream(), media_type="text/plain")

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

add_pagination(app)