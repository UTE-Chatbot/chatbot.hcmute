from dataclasses import dataclass
from typing import List, Optional
import asyncio
import json
from langchain_core.messages import HumanMessage
from langchain_qdrant import QdrantVectorStore
from langchain_openai import ChatOpenAI
from components.prompt import RAG_GENERATE_PROMPT, SELF_RAG_CRITIQUE_PROMPT, SELF_RAG_REGENERATE_PROMPT
from components.reranks import JinaReranker
from config import settings

@dataclass
class PipelineResult:
    question: str
    context: List[str]
    doc_ids: List[str]
    answer: str

class SelfRAGPipeline:
    """
    Pipeline Self-RAG: Tu danh gia va tai tao cau tra loi neu khong chinh xac
    """
    def __init__(
        self,
        vector_store: QdrantVectorStore,
        k: int = 10,
        model_name: str = "gpt-5-mini",
        temperature: float = 0.0,
        max_retries: int = 2,
        reranker: Optional[JinaReranker] = None,
        rerank_top_k: int = 5
    ):
        self.vector_store = vector_store
        self.k = k
        self.llm = ChatOpenAI(model=model_name, temperature=temperature, api_key=settings.api_key)
        self.max_retries = max_retries
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

    async def _critique(self, question: str, context: List[str], answer: str) -> bool:
        context_str = "\n\n".join(context)
        prompt = SELF_RAG_CRITIQUE_PROMPT.format(
            context=context_str, question=question, answer=answer
        )
        response = await self.llm.ainvoke([HumanMessage(content=prompt)])
        try:
            content = response.content
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            result = json.loads(content.strip())
            return result.get("is_grounded", True)
        except:
            return True

    async def _regenerate(self, question: str, context: List[str]) -> str:
        context_str = "\n\n".join(context)
        prompt = SELF_RAG_REGENERATE_PROMPT.format(context=context_str, question=question)
        response = await self.llm.ainvoke([HumanMessage(content=prompt)])
        return response.content

    async def run(self, question: str) -> PipelineResult:
        context, doc_ids = await self._retrieve(question)
        answer = await self._generate(question, context)

        for _ in range(self.max_retries):
            is_grounded = await self._critique(question, context, answer)
            if is_grounded:
                break
            answer = await self._regenerate(question, context)

        return PipelineResult(
            question=question,
            context=context,
            doc_ids=doc_ids,
            answer=answer
        )
