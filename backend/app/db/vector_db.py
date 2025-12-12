import time
from functools import lru_cache
from langchain_qdrant import QdrantVectorStore, RetrievalMode
from qdrant_client import QdrantClient, models
from langchain_core.embeddings import Embeddings
from langchain_qdrant.sparse_embeddings import SparseEmbeddings
from app.core.config import settings
from app.services.rag_service.component.embeddings import get_dense_embedding_model, get_sparse_embedding_model

def get_qdrant_store(
    mode: RetrievalMode, 
    client: QdrantClient, 
    collection_name: str, 
    dense_embedding: Embeddings = None, 
    sparse_embedding: SparseEmbeddings = None,
    max_retries: int = 10,
    retry_delay: int = 3
) -> QdrantVectorStore:
    retrieval_mode = mode
    if retrieval_mode == RetrievalMode.DENSE:
        if not dense_embedding:
            raise ValueError("Dense embedding required for DENSE mode")
    elif retrieval_mode == RetrievalMode.SPARSE:
        if not sparse_embedding:
            raise ValueError("Sparse embedding required for SPARSE mode")
    elif retrieval_mode == RetrievalMode.HYBRID:
        if not dense_embedding or not sparse_embedding:
            raise ValueError("Both embeddings required for HYBRID mode")
    else:
        raise ValueError(f"Invalid mode: {mode}. Must be RetrievalMode.DENSE, SPARSE, or HYBRID")

    # Retry logic for Qdrant connection
    for attempt in range(max_retries):
        try:
            collection_exists = client.collection_exists(collection_name)
            break
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"Qdrant connection attempt {attempt + 1}/{max_retries} failed: {e}. Retrying in {retry_delay}s...")
                time.sleep(retry_delay)
            else:
                raise RuntimeError(f"Failed to connect to Qdrant after {max_retries} attempts") from e

    if not collection_exists:
        print(f"Collection '{collection_name}' not found. Creating for {mode} mode...")
        
        vectors_config = {}
        sparse_vectors_config = {}
        
        if retrieval_mode in [RetrievalMode.DENSE, RetrievalMode.HYBRID]:
            dummy_vec = dense_embedding.embed_query("test")
            vectors_config = {
                QdrantVectorStore.VECTOR_NAME: models.VectorParams(
                    size=len(dummy_vec),
                    distance=models.Distance.COSINE
                )
            }

        if retrieval_mode in [RetrievalMode.SPARSE, RetrievalMode.HYBRID]:
            sparse_vectors_config = {
                QdrantVectorStore.SPARSE_VECTOR_NAME: models.SparseVectorParams()
            }

        client.create_collection(
            collection_name=collection_name,
            vectors_config=vectors_config if vectors_config else None,
            sparse_vectors_config=sparse_vectors_config if sparse_vectors_config else None,
        )

    store = QdrantVectorStore(
        client=client,  
        collection_name=collection_name,
        embedding=dense_embedding,
        sparse_embedding=sparse_embedding,
        retrieval_mode=retrieval_mode,
        validate_collection_config=True
    )
    
    return store

qdrant_client = QdrantClient(url=settings.qdrant_url)
dense_embedding_model = get_dense_embedding_model()
sparse_embedding_model = get_sparse_embedding_model()

vector_store = get_qdrant_store(
    mode=RetrievalMode.HYBRID,
    client=qdrant_client,
    collection_name=settings.qdrant_collection_name,
    dense_embedding=dense_embedding_model,
    sparse_embedding=sparse_embedding_model
)