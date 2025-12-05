from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import FakeEmbeddings
from app.core.config import settings
from app.utils.logger import logger
from langchain_core.embeddings import Embeddings
from langchain_qdrant.sparse_embeddings import SparseEmbeddings
from functools import lru_cache
from fastembed import SparseTextEmbedding, TextEmbedding
from app.utils.text_preprocessing import process_pipeline
    
class BM25QdrantEmbeddings(SparseEmbeddings):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.model = SparseTextEmbedding(model_name="Qdrant/bm25")
    def embed_query(self, text: str) -> SparseEmbeddings:
        text = process_pipeline(text)
        return next(self.model.query_embed(text))
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        texts = [process_pipeline(text) for text in texts]
        return list(self.model.embed(texts))

@lru_cache
def get_sparse_embedding_model() -> BM25QdrantEmbeddings:
    sparse_embedding = BM25QdrantEmbeddings()
    logger.info("Using BM25QdrantEmbeddings for sparse embeddings")
    return sparse_embedding


@lru_cache
def get_dense_embedding_model() -> Embeddings:
    provider = settings.embedding_provider
    model = settings.embedding_model_name

    if provider == "OPENAI":
        api_key = settings.openai_api_key
        if not api_key:
            logger.warning("OPENAI_API_KEY is missing in settings, falling back to FakeEmbeddings")
            dense_embedding = FakeEmbeddings()
        else:
            dense_embedding = OpenAIEmbeddings(model=model, openai_api_key=api_key)
            logger.info(f"Using OpenAI embeddings with model: {model}")
    else:
        logger.info(f"Using FakeEmbeddings for provider: {provider}")
        dense_embedding = FakeEmbeddings()
    return dense_embedding
    