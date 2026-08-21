import uuid
import numpy as np
from typing import Optional, Dict
from dataclasses import dataclass
from langchain_core.embeddings import Embeddings


@dataclass
class CacheEntry:
    question: str
    response: str
    embedding: np.ndarray


class SemanticCache:
    """
    In-memory semantic cache for evaluation.
    Stores question→response pairs and retrieves by cosine similarity.
    Session-based: call clear() between evaluation runs.
    """

    def __init__(self, embeddings: Embeddings, threshold: float = 0.9):
        self.embeddings = embeddings
        self.threshold = threshold
        self._store: Dict[str, CacheEntry] = {}

    def clear(self):
        count = len(self._store)
        self._store.clear()
        return count

    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        dot = np.dot(vec1, vec2)
        n1 = np.linalg.norm(vec1)
        n2 = np.linalg.norm(vec2)
        if n1 == 0 or n2 == 0:
            return 0.0
        return dot / (n1 * n2)

    async def search(self, query: str) -> Optional[str]:
        if not self._store:
            return None

        query_vec = np.array(
            await self.embeddings.aembed_query(query), dtype=np.float32
        )

        best_score = -1.0
        best_response = None

        for entry in self._store.values():
            sim = self._cosine_similarity(query_vec, entry.embedding)
            if sim > best_score:
                best_score = sim
                best_response = entry.response

        if best_score >= self.threshold:
            return best_response
        return None

    async def add(self, question: str, response: str):
        vec = np.array(
            await self.embeddings.aembed_query(question), dtype=np.float32
        )
        key = str(uuid.uuid4())
        self._store[key] = CacheEntry(
            question=question, response=response, embedding=vec
        )

    @property
    def size(self) -> int:
        return len(self._store)
