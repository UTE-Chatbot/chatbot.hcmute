import uuid
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import PointStruct
from app.core.config import settings
import inspect

class SemanticCache:
    def __init__(self, embeddings, embeddings_size, threshold=0.9):
        self.embeddings = embeddings
        self.cache_client = AsyncQdrantClient(settings.QDRANT_HOST)
        self.embeddings_size = embeddings_size
        self.cache_collection_name = settings.CACHE_INDEX_NAME
        self.threshold = threshold
        self._collection_initialized = False

    async def _init_collection_async(self) -> bool:
        if self._collection_initialized:
            return True
        try:
            try:
                await self.cache_client.get_collection(collection_name=self.cache_collection_name)
            except Exception:
                await self.cache_client.create_collection(
                    collection_name=self.cache_collection_name,
                    vectors_config=models.VectorParams(
                        size=self.embeddings_size,
                        distance=models.Distance.COSINE,
                    )
                )
            self._collection_initialized = True
            return True
        except Exception as e:
            print(f"Error during cache collection initialization: {e}")
            return False

    async def search_cache_async(self, query, query_embedding=None):
        if not await self._init_collection_async():
            print("Cache collection not initialized. Skipping cache search.")
            return None
        if query_embedding is None:
            try:
                # Check if the embeddings support async embed and is coroutine
                if hasattr(self.embeddings, 'aembed_query') and inspect.iscoroutinefunction(self.embeddings.aembed_query):
                    embedding = await self.embeddings.aembed_query(query)
                else:
                    # Fallback to synchronous embedding
                    embedding = self.embeddings.embed_query(query)
            except Exception as e:
                print(f"Error generating embedding for cache search: {e}")
                return None
        else:
            embedding = query_embedding
        try:
            search_result = await self.cache_client.search(
                collection_name=self.cache_collection_name,
                query_vector=embedding,
                limit=1
            )
        except Exception as e:
            print(f"Error during cache search: {e}")
            return None
        if len(search_result) > 0:
            score = search_result[0].score
            if score > self.threshold:
                print(f"Cache hit with score: {score}")
                response_text = search_result[0].payload.get("response_text")
                return response_text
        print(f"Cache miss with score: {score if len(search_result) > 0 else 'N/A'}")
        return None

    async def add_to_cache_async(self, question, response_text, question_embedding=None):
        if not await self._init_collection_async():
            print("Cache collection not initialized. Skipping add to cache.")
            return
        point_id = str(uuid.uuid4())
        if question_embedding is None:
            try:
                # Check if the embeddings support async embed and is coroutine
                if hasattr(self.embeddings, 'aembed_query') and inspect.iscoroutinefunction(self.embeddings.aembed_query):
                    vector = await self.embeddings.aembed_query(question)
                else:
                    # Fallback to synchronous embedding
                    vector = self.embeddings.embed_query(question)
            except Exception as e:
                print(f"Error generating embedding: {e}")
                return
        else:
            vector = question_embedding
        
        point = PointStruct(id=point_id, vector=vector, payload={"response_text": response_text, "question": question, "timestamp": pd.Timestamp.now().timestamp()})
        try:
            self.cache_client.upload_points(
                collection_name=self.cache_collection_name,
                points=[point],
                wait=True   
            )
            print(f"Added to cache successfully: {question[:30]}...")
        except Exception as e:
            print(f"Error adding to cache: {e}")