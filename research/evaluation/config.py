import os
from typing import List
from urllib.parse import quote_plus
from dotenv import load_dotenv
load_dotenv(".env", override=True)
class Settings:
    embedding_provider: str = os.getenv("EMBEDDING_PROVIDER")
    embedding_model_name: str = os.getenv("EMBEDDING_MODEL_NAME")
    api_key: str = os.getenv("OPENAI_API_KEY")
    qdrant_url: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    jina_api_key: str = os.getenv("JINA_API_KEY")
settings = Settings()


EXPERIMENT_CHUNK_METHODS = [
    {
        "method": "naive_chunks",
        "chunk_size": 512,
        "chunk_overlap": 64
    },
    {
        "method": "naive_chunks",
        "chunk_size": 1024,
        "chunk_overlap": 128
    },
    {
        "method": "sem_chunks",
        "breakpoint_threshold_amount": 70,
        "min_chunk_size": 512,
    },
    {
        "method": "llm_chunks",
        "model": "openai:gpt-5-mini"
    }, 
    {
        "method": "human_chunks", 
    }
]

EXPERIMENT_PIPELINES = [
    "rag",
    "llm_only",
    "ute_rag"
]

EXPERIMENT_EMBEDDINGS = [
    {
        "model_name": "text-embedding-3-small",
        "model_provider": "openai"
    }
]
from langchain_qdrant import RetrievalMode

EXPERIMENT_RETRIEVAL_MODE = [RetrievalMode.DENSE, RetrievalMode.HYBRID]

EXPERIMENT_MODEL = {
        "model_name": "gpt-5-mini",
        "temperature": 0.7,
    }

LLM_ONLY_PIPELINE_MODEL_NAME = "gpt-4o-mini"

EXPERIMENT_RERANKER = {
    "enabled": True,
    "model_id": "jina-reranker-v3",
    "top_k": 5
}

EXPERIMENT_K_VALUES = [5, 10, 20]

TEXT2SQL_DOC_ID = 58