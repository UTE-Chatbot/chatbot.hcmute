import re
import os
from typing import List

from app.services.rag_service.component.llms import get_cost_effective_chat_model
from langchain_core.prompts import PromptTemplate
from app.utils.table import process_and_replace_tables
from app.services.rag_service.component.prompt import LLM_CHUNK_PROMPT
from langchain_text_splitters import MarkdownHeaderTextSplitter
from langchain_core.documents import Document
from langchain_core.messages import SystemMessage, HumanMessage
from app.models.document import Document as DocumentModel

from enum import Enum


class OmniChunkMode(str, Enum):
    MARKDOWN_HEADING_SPLIT = "markdown_heading_split"
    LLM_CHUNK = "llm_chunk"
    DELIMITER_SPLIT = "delimiter_split"
    
CHUNK_DELIMITER = "<<<CHUNK_SEPARATOR>>>"


def create_chunk_document(
    content: str,
    chunk_index: int,
    chunk_method: str,
    document: DocumentModel,
    extra_metadata: dict = None
) -> Document:
    """
    Create a Document with consistent metadata structure.
    
    Args:
        content: The chunk text content
        chunk_index: Index of the chunk
        chunk_method: Method used for chunking (e.g., MARKDOWN_HEADING_SPLIT)
        document: The DocumentModel containing document metadata
        extra_metadata: Additional metadata to include (e.g., from markdown splitter)
    
    Returns:
        Document with unified metadata structure
    """
    metadata = {
        "chunk_index": chunk_index,
        "chunk_method": chunk_method,
        "document_name": document.name,
        "document_url": document.file_path,
        **(document.document_metadata or {}),
        **(extra_metadata or {}),
    }
    
    return Document(
        page_content=content,
        metadata=metadata
    )


class OmniChunker:
    def __init__(
        self,
        overlap,
        mode: OmniChunkMode,
        document: DocumentModel,
        is_replace_large_table: bool = True
    ):
        self.llm = get_cost_effective_chat_model()
        self.overlap = overlap
        self.mode = mode
        self.document = document
        self.is_replace_large_table = is_replace_large_table

    async def chunk_document(self) -> List[Document]:
        """Entry point for chunking."""

        content = self.document.full_text or ""

        # Optionally replace large tables
        if self.is_replace_large_table:
            content = process_and_replace_tables(
                markdown_text=content,
                document_name=self.document.name,
                document_url=self.document.file_path,
                row_threshold=50,
                context_range=200
            )

        chunks = []
        if self.mode == OmniChunkMode.MARKDOWN_HEADING_SPLIT:
            content = content.replace(CHUNK_DELIMITER, "")
            chunks, content = await self._chunk_by_markdown_heading(content)

        elif self.mode == OmniChunkMode.LLM_CHUNK:
            content = content.replace(CHUNK_DELIMITER, "")
            chunks, content = await self._chunk_by_llm(content)

        elif self.mode == OmniChunkMode.DELIMITER_SPLIT:
            chunks = await self._chunk_by_delimiter(content)

        return chunks, content

    async def _chunk_by_markdown_heading(self, text: str) -> tuple[List[Document], str]:
        """Split by # H1 headers, merge with delimiter, return chunks and modified content."""
        headers_to_split_on = [
            ("#", "h1"),
        ]

        markdown_splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=headers_to_split_on,
            strip_headers=False
        )

        md_header_splits = markdown_splitter.split_text(text)

        documents: List[Document] = []
        chunk_contents: List[str] = []

        for idx, chunk in enumerate(md_header_splits):
            chunk_text = chunk.page_content if hasattr(chunk, 'page_content') else chunk.text if hasattr(chunk, 'text') else str(chunk)
            chunk_contents.append(chunk_text)
            
            # Extract extra metadata from markdown splitter
            extra_metadata = chunk.metadata if hasattr(chunk, 'metadata') else {}
            
            documents.append(
                create_chunk_document(
                    content=chunk_text,
                    chunk_index=idx,
                    chunk_method=OmniChunkMode.MARKDOWN_HEADING_SPLIT,
                    document=self.document,
                    extra_metadata=extra_metadata
                )
            )

        # Merge chunks với delimiter để lưu vào content
        merged_content = f"\n{CHUNK_DELIMITER}\n".join(chunk_contents)

        return documents, merged_content

    async def _chunk_by_delimiter(self, text: str) -> List[Document]:
        """Split content by delimiter."""
        raw_chunks = text.split(CHUNK_DELIMITER)

        documents: List[Document] = []

        for idx, ch in enumerate(raw_chunks):
            ch = ch.strip()
            if not ch:
                continue

            documents.append(
                create_chunk_document(
                    content=ch,
                    chunk_index=idx,
                    chunk_method=OmniChunkMode.DELIMITER_SPLIT,
                    document=self.document
                )
            )

        return documents

    async def _chunk_by_llm(self, text: str) -> tuple[List[Document], str]:
        """Chunk using LLM and return consistent document structures."""
        prompt = LLM_CHUNK_PROMPT.format(
            document_name=self.document.name,
            delimiter=CHUNK_DELIMITER
        )

        system = SystemMessage(content=prompt)
        human = HumanMessage(content=text)

        ai = await self.llm.ainvoke([system, human])
        response = ai.content
        raw_chunks = response.split(CHUNK_DELIMITER)

        documents: List[Document] = []
        chunk_contents: List[str] = []

        for idx, ch in enumerate(raw_chunks):
            ch = ch.strip()
            if not ch:
                continue

            # Chunk with document name
            chunk_content = "Tên tài liệu: " + self.document.name + "\n" + ch 
            chunk_contents.append(chunk_content)
                
            documents.append(
                create_chunk_document(
                    content=chunk_content,
                    chunk_index=idx,
                    chunk_method=OmniChunkMode.LLM_CHUNK,
                    document=self.document
                )
            )

        # Merge chunks with delimiter for content
        merged_content = response
        return documents, merged_content
