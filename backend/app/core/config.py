import os
from typing import List
from dotenv import load_dotenv

env = os.getenv("ENV", "development")  

if env == "production":
    load_dotenv(".env.production", override=True)
else:
    load_dotenv(".env.development", override=True)

class Settings:
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    google_redirect_uri: str = os.getenv("GOOGLE_REDIRECT_URI", "")
    
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_access_token_expire_minutes: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 60))
    session_secret_key: str = os.getenv("SESSION_SECRET_KEY", "super-secret-session-key")
    allow_origins: List[str] = os.getenv("ALLOW_ORIGINS", "").split(",")
   
    postgres_user: str = os.getenv("POSTGRES_USER", "")
    postgres_password: str = os.getenv("POSTGRES_PASSWORD", "") 
    postgres_db: str = os.getenv("POSTGRES_DB", "")
    postgres_host: str = os.getenv("POSTGRES_HOST", "")
    postgres_port: str = os.getenv("POSTGRES_PORT", "")
    database_url: str = (
        f"postgresql+asyncpg://{postgres_user}:{postgres_password}"
        f"@{postgres_host}:{postgres_port}/{postgres_db}"
    )
    # Sync database URL for Alembic migrations
    database_url_sync: str = (
        f"postgresql+psycopg2://{postgres_user}:{postgres_password}"
        f"@{postgres_host}:{postgres_port}/{postgres_db}"
    )

    database_url_no_asyncpg: str = (
    f"postgresql://{postgres_user}:{postgres_password}"
    f"@{postgres_host}:{postgres_port}/{postgres_db}"
)

    minio_endpoint: str = os.getenv("MINIO_ENDPOINT", "minio:9000")
    minio_access_key: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    minio_secret_key: str = os.getenv("MINIO_SECRET_KEY", "minioadmin123")  

    file_bucket_name: str = os.getenv("FILE_BUCKET_NAME", "rag-files")
    chat_history_table_name: str = os.getenv("CHAT_HISTORY_TABLE_NAME", "chat_history")
    
    qdrant_host: str = os.getenv("QDRANT_HOST", "localhost")
    qdrant_port: int = int(os.getenv("QDRANT_PORT", 6333))
    qdrant_grpc_port: int = int(os.getenv("QDRANT_GRPC_PORT", 6334))
    qdrant_api_key: str = os.getenv("QDRANT_API_KEY", "")
    qdrant_collection_name: str = os.getenv("QDRANT_COLLECTION_NAME", "hcmute_chatbot")
    qdrant_url = f"{qdrant_host}:{qdrant_port}"
    
    # Redis Settings
    redis_host: str = os.getenv("REDIS_HOST", "localhost")
    redis_port: int = int(os.getenv("REDIS_PORT", 6379))
    redis_password: str = os.getenv("REDIS_PASSWORD", "")
    redis_db: int = int(os.getenv("REDIS_DB", 0))
    
    # LLM and Embedding Settings
    embedding_provider: str = os.getenv("EMBEDDING_PROVIDER", "OPENAI")
    embedding_model_name: str = os.getenv("EMBEDDING_MODEL_NAME", "text-embedding-3-small")
    
    llm_provider: str = os.getenv("LLM_PROVIDER", "OPENAI")
    llm_cost_effective_model_name: str = os.getenv("LLM_COST_EFFECTIVE_MODEL_NAME", "gpt-4.1-nano")
    llm_high_performance_model_name: str = os.getenv("LLM_HIGH_PERFORMANCE_MODEL_NAME", "gpt-4.1-mini")
    
    # API Keys
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    deepseek_api_key: str = os.getenv("DEEPSEEK_API_KEY", "")   
    
    datalab_api_key: str = os.getenv("DATALAB_API_KEY", "")

    backend_url: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Rate Limiting & Thread Settings
    question_limit_per_day: int = int(os.getenv("QUESTION_LIMIT_PER_DAY", 100))    

settings = Settings()