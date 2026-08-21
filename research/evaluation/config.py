import os
from dotenv import load_dotenv
load_dotenv(".env", override=True)


class Settings:
    embedding_provider: str = os.getenv("EMBEDDING_PROVIDER")
    embedding_model_name: str = os.getenv("EMBEDDING_MODEL_NAME")
    api_key: str = os.getenv("OPENAI_API_KEY")
    qdrant_url: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    jina_api_key: str = os.getenv("JINA_API_KEY")


settings = Settings()

# Reproducibility seed (used where possible)
SEED = 42

# Semantic cache threshold (cosine similarity)
CACHE_THRESHOLD = 0.9

GENERATION_MODEL = {
    "model_name": "gpt-5-mini",
    "temperature": 0.0,
    "seed": SEED,
}

LLM_ONLY_MODEL = {
    "model_name": "gpt-5-mini",
    "temperature": 0.0,
    "seed": SEED,
}

RAG_COLLECTION = "method_naive_chunks_chunk_size_1024_chunk_overlap_128_hybrid"

# Retrieval settings
RETRIEVAL_K = 10       
RERANKER_TOP_K = 5     

RERANKER_MODEL = "jina-reranker-v3"

TEXT2SQL_DOC_ID = 58

DIEMCHUAN_DATASET_PATH = "dataset/evaluation_diemchuan.csv"
TUYENSINH_DATASET_PATH = "dataset/evaluation_tuyensinh"
FULL_DATASET_PATH_TUYENSINH = "dataset/evaluation_tuyensinh.csv"
FULL_DATASET_PATH_DIEMCHUAN = "dataset/evaluation_diemchuan.csv"

CORPUS_PATH = "dataset/corpus.csv"
OUTPUT_PATH_TUYENSINH = "output/evaluation_results_tuyensinh.csv"
OUTPUT_PATH_DIEMCHUAN = "output/evaluation_results_diemchuan.csv"

OUTPUT_PATH_TUYENSINH_ABLATION = "output/ablation_query_expansion_tuyensinh.csv"
OUTPUT_PATH_DIEMCHUAN_ABLATION = "output/ablation_query_expansion_diemchuan.csv"



JUDGE_MODEL = {
    "model_name": "gpt-5-mini",
    "temperature": 0.0,
    "seed": SEED,
}

PIPELINE_LABELS = {
    "llm_only":             "LLM Only",
    "basic_rag":            "Basic RAG",
    "our_rag":              "Our RAG",
    "ablation_no_rerank":   "− Reranker",
    "ablation_no_qe":       "− Query Expansion",
    "ablation_no_text2sql": "− Text2SQL",
    "ablation_no_routing":  "− Tool Routing",
}