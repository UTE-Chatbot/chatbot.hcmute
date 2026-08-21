from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import FakeEmbeddings
from config import settings
from langchain_core.embeddings import Embeddings
from langchain_qdrant.sparse_embeddings import SparseEmbeddings
from functools import lru_cache
from fastembed import SparseTextEmbedding
from components.utils.text_preprocessing import process_pipeline
    
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
    return sparse_embedding

@lru_cache
def get_dense_embedding_model() -> Embeddings:
    provider = settings.embedding_provider
    model = settings.embedding_model_name 
    
    dense_embedding = FakeEmbeddings(size=1536)  

    if provider == "OPENAI":
        api_key = settings.api_key  
        dense_embedding = OpenAIEmbeddings(model=model, api_key=api_key)
    print(f"dense_embedding: {dense_embedding}")
    return dense_embedding
    