from typing import List, Optional
from dataclasses import dataclass
import requests
from config import settings


@dataclass
class RerankedDocument:
    content: str
    score: float
    original_index: int


class JinaReranker:
    def __init__(
        self,
        model_id: str = "jina-reranker-v3",
        api_key: Optional[str] = None
    ):
        self.model_id = model_id
        self.api_key = api_key or settings.jina_api_key
        self.api_url = "https://api.jina.ai/v1/rerank"

    def rerank(
        self,
        query: str,
        documents: List[str],
        top_k: Optional[int] = None
    ) -> List[RerankedDocument]:
        if not documents:
            return []

        payload = {
            "model": self.model_id,
            "query": query,
            "documents": documents,
            "return_documents": False
        }

        if top_k is not None:
            payload["top_n"] = top_k

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        response = requests.post(self.api_url, json=payload, headers=headers)
        response.raise_for_status()

        result = response.json()
        results = []

        for item in result.get("results", []):
            idx = item["index"]
            score = item["relevance_score"]
            results.append(
                RerankedDocument(
                    content=documents[idx],
                    score=score,
                    original_index=idx
                )
            )

        return results

    def rerank_with_metadata(
        self,
        query: str,
        documents: List[dict],
        content_key: str = "content",
        top_k: Optional[int] = None
    ) -> List[tuple]:
        if not documents:
            return []

        contents = [doc.get(content_key, "") for doc in documents]
        reranked = self.rerank(query, contents, top_k)

        return [(documents[r.original_index], r.score) for r in reranked]
