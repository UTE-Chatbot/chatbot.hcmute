from dataclasses import dataclass
from typing import List, Optional
import asyncio
from langchain_core.messages import HumanMessage
from langchain_qdrant import QdrantVectorStore
from langchain_openai import ChatOpenAI
from components.prompt import RAG_GENERATE_PROMPT
from components.reranks import JinaReranker
from config import settings

@dataclass
class PipelineResult:
    question: str
    context: List[str]
    doc_ids: List[str]
    answer: str
    tool_used: str = "none"

class BasicRAGPipeline:
    """
    Pipeline RAG co ban: Truy xuat -> Sinh cau tra loi
    """
    def __init__(
        self,
        vector_store: QdrantVectorStore,
        k: int = 10,
        model_name: str = "gpt-5-mini",
        temperature: float = 0.0,
        reranker: Optional[JinaReranker] = None,
        rerank_top_k: int = 5,
        seed: int = None,
    ):
        self.vector_store = vector_store
        self.k = k
        self.llm = ChatOpenAI(model=model_name, temperature=temperature, api_key=settings.api_key, seed=seed)
        self.reranker = reranker
        self.rerank_top_k = rerank_top_k

    async def _retrieve(self, question: str) -> tuple[List[str], List[str]]:
        docs = await asyncio.to_thread(
            self.vector_store.similarity_search, question, k=self.k
        )

        if self.reranker:
            contents = [doc.page_content for doc in docs]
            reranked = self.reranker.rerank(question, contents, top_k=self.rerank_top_k)
            reranked_docs = [docs[r.original_index] for r in reranked]
            context = [doc.page_content for doc in reranked_docs]
            doc_ids = [doc.metadata.get("document_id", str(i)) for i, doc in enumerate(reranked_docs)]
        else:
            context = [doc.page_content for doc in docs]
            doc_ids = [doc.metadata.get("document_id", str(i)) for i, doc in enumerate(docs)]

        return context, doc_ids

    async def _generate(self, question: str, context: List[str]) -> str:
        context_str = "\n\n".join(context)
        prompt = RAG_GENERATE_PROMPT.format(context=context_str, question=question)
        response = await self.llm.ainvoke([HumanMessage(content=prompt)])
        return response.content

    async def run(self, question: str) -> PipelineResult:
        context, doc_ids = await self._retrieve(question)
        answer = await self._generate(question, context)
        return PipelineResult(
            question=question,
            context=context,
            doc_ids=doc_ids,
            answer=answer,
            tool_used="document_search",
        )
