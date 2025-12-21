import uuid
import json
import numpy as np
from typing import Optional
import redis.asyncio as redis
from app.core.config import settings
import inspect
import traceback

class SemanticCache:
    def __init__(self, embeddings, embeddings_size, threshold=None):
        self.embeddings = embeddings
        self.embeddings_size = embeddings_size
        self.threshold = threshold if threshold is not None else settings.cache_threshold
        self.ttl = settings.cache_ttl
        self.prefix = settings.cache_prefix
        self._redis_client: Optional[redis.Redis] = None

    async def _get_redis_client(self) -> redis.Redis:
        if self._redis_client is None:
            self._redis_client = await redis.Redis(
                host=settings.redis_host,
                port=settings.redis_port,
                password=settings.redis_password if settings.redis_password else None,
                db=settings.redis_db,
                decode_responses=False
            )
        return self._redis_client

    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        dot_product = np.dot(vec1, vec2)
        norm_vec1 = np.linalg.norm(vec1)
        norm_vec2 = np.linalg.norm(vec2)
        if norm_vec1 == 0 or norm_vec2 == 0:
            return 0.0
        return dot_product / (norm_vec1 * norm_vec2)

    async def search_cache_async(self, query: str, query_embedding=None) -> Optional[str]:
        try:
            client = await self._get_redis_client()
            
            if query_embedding is None:
                if hasattr(self.embeddings, 'aembed_query') and inspect.iscoroutinefunction(self.embeddings.aembed_query):
                    embedding = await self.embeddings.aembed_query(query)
                else:
                    embedding = self.embeddings.embed_query(query)
            else:
                embedding = query_embedding

            query_vec = np.array(embedding, dtype=np.float32)
            
            pattern = f"{self.prefix}:*"
            best_score = -1
            best_response = None
            
            cursor = 0
            while True:
                cursor, keys = await client.scan(cursor, match=pattern, count=100)
                
                for key in keys:
                    try:
                        cache_data = await client.hgetall(key)
                        if not cache_data or b'embedding' not in cache_data:
                            continue
                        
                        cached_embedding = np.frombuffer(cache_data[b'embedding'], dtype=np.float32)
                        similarity = self._cosine_similarity(query_vec, cached_embedding)
                        
                        if similarity > best_score:
                            best_score = similarity
                            if b'response' in cache_data:
                                best_response = cache_data[b'response'].decode('utf-8')
                    except Exception as key_error:
                        print(f"[WARN] Error processing cache key {key}: {key_error}")
                        continue
                
                if cursor == 0:
                    break
            
            if best_score > self.threshold:
                print(f"Cache hit with score: {best_score:.4f}")
                return best_response
            else:
                print(f"Cache miss with best score: {best_score:.4f}")
                return None
                
        except Exception as e:
            print(f"[ERROR] Cache search failed: {e}")
            traceback.print_exc()
            return None

    async def add_to_cache_async(self, question: str, response_text: str, question_embedding=None):
        try:
            client = await self._get_redis_client()
            
            if question_embedding is None:
                if hasattr(self.embeddings, 'aembed_query') and inspect.iscoroutinefunction(self.embeddings.aembed_query):
                    vector = await self.embeddings.aembed_query(question)
                else:
                    vector = self.embeddings.embed_query(question)
            else:
                vector = question_embedding

            vec_array = np.array(vector, dtype=np.float32)
            
            cache_id = str(uuid.uuid4())
            key = f"{self.prefix}:{cache_id}"
            
            cache_data = {
                'embedding': vec_array.tobytes(),
                'response': response_text,
                'question': question
            }
            
            await client.hset(key, mapping=cache_data)
            await client.expire(key, self.ttl)
            
            print(f"Added to cache successfully: {question[:50]}... (TTL: {self.ttl}s)")
            
        except Exception as e:
            print(f"[ERROR] Failed to add to cache: {e}")
            traceback.print_exc()

    def set_threshold(self, threshold: float):
        self.threshold = threshold

    async def clear_cache(self):
        try:
            client = await self._get_redis_client()
            pattern = f"{self.prefix}:*"
            cursor = 0
            keys_to_delete = []
            
            while True:
                cursor, keys = await client.scan(cursor, match=pattern, count=100)
                keys_to_delete.extend(keys)
                if cursor == 0:
                    break
            
            if keys_to_delete:
                await client.delete(*keys_to_delete)
                print(f"Cleared {len(keys_to_delete)} cache entries.")
            else:
                print("No cache entries to clear.")
                
            return len(keys_to_delete)
            
        except Exception as e:
            print(f"[ERROR] Failed to clear cache: {e}")
            traceback.print_exc()
            return 0

    async def close(self):
        if self._redis_client is not None:
            await self._redis_client.close()