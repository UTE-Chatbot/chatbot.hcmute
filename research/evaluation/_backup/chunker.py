import asyncio
from typing import List, Optional, Any
from langchain_text_splitters.base import TextSplitter
from langchain.chat_models import init_chat_model
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.documents import Document

from config import EXPERIMENT_MODEL
from components.prompt import LLM_CHUNK_PROMPT

CHUNK_DELIMITER = "<<<CHUNK_SEPARATOR>>>"


class LLMTextSplitter(TextSplitter):
    def __init__(
        self,
        model_name: Optional[str] = None,
        temperature: float = 0.7,
        chunk_size: int = 4000,
        chunk_overlap: int = 200,
        delimiter: str = CHUNK_DELIMITER,
        document_name: str = "Unknown Document",
        **kwargs: Any
    ):
        super().__init__(chunk_size=chunk_size, chunk_overlap=chunk_overlap, **kwargs)

        if model_name is None:
            config = EXPERIMENT_MODEL[0]
            model_name = config.get("model_name", "openai:gpt-4o-mini")
            temperature = config.get("temperature", temperature)

        self.model_name = model_name
        self.temperature = temperature
        self.delimiter = delimiter
        self.document_name = document_name

        if ":" in model_name:
            provider, model = model_name.split(":", 1)
        else:
            provider = "openai"
            model = model_name

        self.llm = init_chat_model(
            model=model,
            temperature=temperature,
            model_provider=provider,
        )

    def split_text(self, text: str, document_name: Optional[str] = None) -> List[str]:
        doc_name = document_name or self.document_name
        text = text.replace(self.delimiter, "")

        prompt = LLM_CHUNK_PROMPT.format(
            document_name=doc_name,
            delimiter=self.delimiter
        )

        system = SystemMessage(content=prompt)
        human = HumanMessage(content=text)

        response = self.llm.invoke([system, human])
        response_text = response.content if hasattr(response, "content") else str(response)

        raw_chunks = response_text.split(self.delimiter)

        chunks: List[str] = []
        for chunk in raw_chunks:
            chunk = chunk.strip()
            if chunk:
                chunks.append(chunk)

        return chunks

    async def asplit_text(self, text: str, document_name: Optional[str] = None) -> List[str]:
        doc_name = document_name or self.document_name
        text = text.replace(self.delimiter, "")

        prompt = LLM_CHUNK_PROMPT.format(
            document_name=doc_name,
            delimiter=self.delimiter
        )

        system = SystemMessage(content=prompt)
        human = HumanMessage(content=text)

        response = await self.llm.ainvoke([system, human])
        response_text = response.content if hasattr(response, "content") else str(response)

        raw_chunks = response_text.split(self.delimiter)

        chunks: List[str] = []
        for chunk in raw_chunks:
            chunk = chunk.strip()
            if chunk:
                chunks.append(chunk)

        return chunks

    def split_documents(self, documents: List[Document]) -> List[Document]:
        return asyncio.run(self.asplit_documents(documents))

    async def asplit_documents(self, documents: List[Document]) -> List[Document]:
        async def process_document(doc_idx: int, doc: Document) -> List[Document]:
            doc_name = (
                doc.metadata.get("document_name")
                or doc.metadata.get("name")
                or f"Document_{doc_idx + 1}"
            )

            chunks = await self.asplit_text(doc.page_content, document_name=doc_name)

            chunk_docs = []
            for chunk_idx, chunk_text in enumerate(chunks):
                chunk_docs.append(
                    Document(
                        page_content=chunk_text,
                        metadata={
                            **doc.metadata,
                            "chunk_index": chunk_idx,
                            "chunk_method": "llm_chunks",
                            "total_chunks": len(chunks),
                            "source_document_name": doc_name,
                        },
                    )
                )

            return chunk_docs

        tasks = [process_document(idx, doc) for idx, doc in enumerate(documents)]
        results = await asyncio.gather(*tasks)

        return [chunk for doc_chunks in results for chunk in doc_chunks]
