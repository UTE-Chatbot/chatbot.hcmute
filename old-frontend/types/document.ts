/**
 * Document Types and Interfaces
 * Based on backend schemas and API responses
 */

import type { PageResponse } from "./page";
import type { QueryParams } from "@/lib/query-builder";

/**
 * Document chunk modes matching backend OmniChunkMode enum
 */
export enum ChunkMode {
  MARKDOWN_HEADING_SPLIT = "markdown_heading_split",
  LLM_CHUNK = "llm_chunk",
  DELIMITER_SPLIT = "delimiter_split",
}

/**
 * Document status enum matching backend DocumentStatusEnum
 */
export enum DocumentStatus {
  PENDING = "pending",
  PARSING = "parsing",
  READY = "ready",
  INDEXING = "indexing",
  INDEXED = "indexed",
  PARSING_FAILED = "parsing_failed",
  CHUNKING_FAILED = "chunking_failed",
}

/**
 * Document metadata structure
 */
export interface DocumentMetadata {
  topic: string;
  subtopic: string;
  [key: string]: any; // Allow additional metadata fields
}

/**
 * Base document interface
 */
export interface DocumentBase {
  name: string;
  full_text?: string | null;
  file_path?: string | null;
  document_metadata?: DocumentMetadata | null;
}

/**
 * Document creation payload
 */
export interface DocumentCreate extends DocumentBase {
  chunk_mode?: ChunkMode;
}

/**
 * Document update payload
 */
export interface DocumentUpdate {
  name?: string;
  full_text?: string | null;
  file_path?: string | null;
  document_metadata?: DocumentMetadata | null;
  chunk_mode?: ChunkMode;
}

/**
 * Document response from API
 */
export interface DocumentResponse extends DocumentBase {
  id: number;
  user_id?: string | null;
  status: DocumentStatus;
  document_metadata?: DocumentMetadata | null;
  created_at: string;
  updated_at: string;
  public_url?: string | null;
}

/**
 * Document chunk base interface
 */
export interface DocumentChunkBase {
  chunk_index: number;
  text: string;
}

/**
 * Document chunk creation payload
 */
export interface DocumentChunkCreate {
  text: string;
}

/**
 * Document chunk update payload
 */
export interface DocumentChunkUpdate {
  text?: string;
}

/**
 * Document chunk response from API
 */
export interface DocumentChunkResponse extends DocumentChunkBase {
  id: number;
  document_id: number;
  point_id?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Document search result
 */
export interface DocumentSearchResult {
  document: {
    page_content: string;
    metadata: Record<string, any>;
  };
  score: number;
}

/**
 * Chunk search result (for searching chunks across documents)
 */
export interface ChunkSearchResult {
  document: {
    page_content: string;
    metadata: {
      chunk_id?: number;
      chunk_index?: number;
      document_id?: number;
      document_name?: string;
      topic?: string;
      subtopic?: string;
      [key: string]: any;
    };
  };
  score: number;
}

/**
 * Document list response
 */
export type DocumentListResponse = PageResponse<DocumentResponse>;

/**
 * Document chunk list response
 */
export type DocumentChunkListResponse = PageResponse<DocumentChunkResponse>;

export const DocumentStatusColors: Record<DocumentStatus, string> = {
  [DocumentStatus.PENDING]: "bg-gray-500",
  [DocumentStatus.PARSING]: "bg-blue-500",
  [DocumentStatus.PARSING_FAILED]: "bg-red-500",
  [DocumentStatus.READY]: "bg-blue-500",
  [DocumentStatus.INDEXING]: "bg-blue-500",
  [DocumentStatus.INDEXED]: "bg-green-500",
  [DocumentStatus.CHUNKING_FAILED]: "bg-red-500",
};

export const DocumentStatusLabels: Record<DocumentStatus, string> = {
  [DocumentStatus.PENDING]: "Đang chờ",
  [DocumentStatus.PARSING]: "Đang tách văn bản",
  [DocumentStatus.PARSING_FAILED]: "Tách văn bản thất bại",
  [DocumentStatus.READY]: "Đang chunk",
  [DocumentStatus.CHUNKING_FAILED]: "Chunk thất bại",
  [DocumentStatus.INDEXING]: "Đang indexing",
  [DocumentStatus.INDEXED]: "Train thành công",
};

export const isProcessingStatus = (status: DocumentStatus) => {
  return [
    DocumentStatus.PENDING,
    DocumentStatus.PARSING,
    DocumentStatus.READY,
    DocumentStatus.INDEXING,
  ].includes(status);
};
