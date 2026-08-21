/**
 * Document Service
 * Comprehensive service layer for document management with FastAPI QueryBuilder support
 */

import { api } from "@/lib/api";
import { buildQueryString, type QueryParams } from "@/lib/query-builder";
import type { FilterObject } from "@/types/query";
import type {
  DocumentResponse,
  DocumentCreate,
  DocumentUpdate,
  DocumentListResponse,
  DocumentChunkResponse,
  DocumentChunkCreate,
  DocumentChunkUpdate,
  DocumentChunkListResponse,
  DocumentSearchResult,
  ChunkSearchResult,
} from "@/types/document";

/**
 * Get paginated list of documents with filtering, sorting, and searching
 * @param params - Query parameters for filtering, sorting, pagination, and search
 * @returns Promise<DocumentListResponse>
 *
 * @example
 * // Basic pagination
 * getDocuments({ page: 1, size: 10 })
 *
 * @example
 * // With filtering
 * getDocuments({
 *   filters: {
 *     status: { $eq: "completed" },
 *     name: { $contains: "report" }
 *   },
 *   page: 1,
 *   size: 20
 * })
 *
 * @example
 * // With sorting
 * getDocuments({
 *   sort: "created_at:desc",
 *   page: 1,
 *   size: 10
 * })
 *
 * @example
 * // With search
 * getDocuments({
 *   search: "engineering",
 *   page: 1,
 *   size: 10
 * })
 *
 * @example
 * // Complex filtering with logical operators
 * getDocuments({
 *   filters: {
 *     $or: [
 *       { status: { $eq: "completed" } },
 *       { status: { $eq: "pending" } }
 *     ],
 *     created_at: { $gte: "2024-01-01" }
 *   },
 *   sort: "name:asc",
 *   page: 1,
 *   size: 25
 * })
 */
export const getDocuments = async (
  params: QueryParams = {}
): Promise<DocumentListResponse> => {
  const queryString = buildQueryString(params);
  const url = `/documents${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<DocumentListResponse>(url);
  return response.data;
};

/**
 * Get a single document by ID
 * @param documentId - The document ID
 * @returns Promise<DocumentResponse>
 *
 * @example
 * const document = await getDocumentById(123);
 */
export const getDocumentById = async (
  documentId: number
): Promise<DocumentResponse> => {
  const response = await api.get<DocumentResponse>(`/documents/${documentId}`);
  return response.data;
};

/**
 * Create a new document
 * @param data - Document creation payload
 * @returns Promise<DocumentResponse>
 *
 * @example
 * // Create with full text
 * const document = await createDocument({
 *   name: "My Document",
 *   full_text: "This is the content...",
 *   document_metadata: {
 *     topic: "Engineering",
 *     subtopic: "Software Development"
 *   },
 *   chunk_mode: ChunkMode.LLM_CHUNK
 * });
 *
 * @example
 * // Create with file path
 * const document = await createDocument({
 *   name: "Uploaded PDF",
 *   file_path: "documents/report.pdf",
 *   document_metadata: {
 *     topic: "Reports",
 *     subtopic: "Annual"
 *   },
 *   chunk_mode: ChunkMode.DELIMITER_SPLIT
 * });
 */
export const createDocument = async (
  data: DocumentCreate
): Promise<DocumentResponse> => {
  const response = await api.post<DocumentResponse>("/documents", data);
  return response.data;
};

/**
 * Update an existing document
 * @param documentId - The document ID
 * @param data - Document update payload
 * @returns Promise<DocumentResponse>
 *
 * @example
 * const updated = await updateDocument(123, {
 *   name: "Updated Document Name",
 *   document_metadata: {
 *     topic: "Updated Topic",
 *     subtopic: "Updated Subtopic"
 *   }
 * });
 */
export const updateDocument = async (
  documentId: number,
  data: DocumentUpdate
): Promise<DocumentResponse> => {
  const response = await api.put<DocumentResponse>(
    `/documents/${documentId}`,
    data
  );
  return response.data;
};

/**
 * Delete a document
 * @param documentId - The document ID
 * @returns Promise<void>
 *
 * @example
 * await deleteDocument(123);
 */
export const deleteDocument = async (documentId: number): Promise<void> => {
  await api.delete(`/documents/${documentId}`);
};

/**
 * Get paginated list of document chunks
 * @param documentId - The document ID
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Promise<DocumentChunkListResponse>
 *
 * @example
 * // Basic pagination
 * const chunks = await getDocumentChunks(123, { page: 1, size: 10 });
 *
 * @example
 * // With filtering
 * const chunks = await getDocumentChunks(123, {
 *   filters: { chunk_index: { $gte: 5 } },
 *   page: 1,
 *   size: 20
 * });
 *
 * @example
 * // With sorting
 * const chunks = await getDocumentChunks(123, {
 *   sort: "chunk_index:asc",
 *   page: 1,
 *   size: 50
 * });
 *
 * @example
 * // With search
 * const chunks = await getDocumentChunks(123, {
 *   search: "keyword",
 *   page: 1,
 *   size: 10
 * });
 */
export const getDocumentChunks = async (
  documentId: number,
  params: QueryParams = {}
): Promise<DocumentChunkListResponse> => {
  const queryString = buildQueryString(params);
  const url = `/documents/${documentId}/chunks${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await api.get<DocumentChunkListResponse>(url);
  return response.data;
};

/**
 * Create a new document chunk
 * @param documentId - The document ID
 * @param data - Chunk creation payload
 * @returns Promise<DocumentChunkResponse>
 *
 * @example
 * const chunk = await createDocumentChunk(123, {
 *   text: "This is a new chunk of text..."
 * });
 */
export const createDocumentChunk = async (
  documentId: number,
  data: DocumentChunkCreate
): Promise<DocumentChunkResponse> => {
  const response = await api.post<DocumentChunkResponse>(
    `/documents/${documentId}/chunks`,
    data
  );
  return response.data;
};

/**
 * Update a document chunk
 * @param documentId - The document ID
 * @param chunkId - The chunk ID
 * @param data - Chunk update payload
 * @returns Promise<DocumentChunkResponse>
 *
 * @example
 * const updated = await updateDocumentChunk(123, 456, {
 *   text: "Updated chunk text..."
 * });
 */
export const updateDocumentChunk = async (
  documentId: number,
  chunkId: number,
  data: DocumentChunkUpdate
): Promise<DocumentChunkResponse> => {
  const response = await api.put<DocumentChunkResponse>(
    `/documents/${documentId}/chunks/${chunkId}`,
    data
  );
  return response.data;
};

/**
 * Delete a document chunk
 * @param documentId - The document ID
 * @param chunkId - The chunk ID
 * @returns Promise<void>
 *
 * @example
 * await deleteDocumentChunk(123, 456);
 */
export const deleteDocumentChunk = async (
  documentId: number,
  chunkId: number
): Promise<void> => {
  await api.delete(`/documents/${documentId}/chunks/${chunkId}`);
};

/**
 * Search documents using vector similarity
 * @param query - Search query string
 * @returns Promise<DocumentSearchResult[]>
 *
 * @example
 * const results = await searchDocuments("machine learning algorithms");
 * results.forEach(result => {
 *   console.log(`Score: ${result.score}`);
 *   console.log(`Content: ${result.document.page_content}`);
 *   console.log(`Metadata:`, result.document.metadata);
 * });
 */
export const searchDocuments = async (
  query: string
): Promise<DocumentSearchResult[]> => {
  const response = await api.post<DocumentSearchResult[]>(
    "/documents/search",
    null,
    {
      params: { query },
    }
  );
  return response.data;
};

/**
 * Search chunks across multiple documents using hybrid search (text + embedding)
 * @param query - Search query string
 * @returns Promise<ChunkSearchResult[]>
 *
 * @example
 * const results = await searchChunks("machine learning");
 * results.forEach(result => {
 *   console.log(`Score: ${result.score}`);
 *   console.log(`Content: ${result.document.page_content}`);
 *   console.log(`Metadata:`, result.document.metadata);
 * });
 */
export const searchChunks = async (
  query: string
): Promise<ChunkSearchResult[]> => {
  const response = await api.post<ChunkSearchResult[]>(
    "/documents/search",
    null,
    {
      params: { query },
    }
  );
  return response.data;
};

export interface KeywordSearchResult {
  id: number;
  document_id: number;
  document_name: string;
  chunk_index: number;
  text: string;
  topic: string | null;
  subtopic: string | null;
}

export interface KeywordSearchResponse {
  items: KeywordSearchResult[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const keywordSearchChunks = async (
  keyword: string,
  page: number = 1,
  size: number = 20
): Promise<KeywordSearchResponse> => {
  const response = await api.get<KeywordSearchResponse>(
    "/documents/chunks/keyword-search",
    {
      params: { keyword, page, size },
    }
  );
  return response.data;
};

export interface BulkReplaceRequest {
  keyword: string;
  replacement: string;
  chunk_ids?: number[];
}

export interface BulkReplaceResponse {
  updated_count: number;
  updated_chunk_ids: number[];
}

export const bulkReplaceKeyword = async (
  request: BulkReplaceRequest
): Promise<BulkReplaceResponse> => {
  const response = await api.post<BulkReplaceResponse>(
    "/documents/chunks/bulk-replace",
    request
  );
  return response.data;
};

/**
 * Helper function to build filter objects
 */
export const buildFilter = {
  /**
   * Equal to
   * @example buildFilter.eq("status", "completed")
   */
  eq: (field: string, value: any): FilterObject => ({
    [field]: { $eq: value },
  }),

  /**
   * Not equal to
   * @example buildFilter.ne("status", "failed")
   */
  ne: (field: string, value: any): FilterObject => ({
    [field]: { $ne: value },
  }),

  /**
   * Greater than
   * @example buildFilter.gt("chunk_index", 10)
   */
  gt: (field: string, value: any): FilterObject => ({
    [field]: { $gt: value },
  }),

  /**
   * Greater than or equal
   * @example buildFilter.gte("created_at", "2024-01-01")
   */
  gte: (field: string, value: any): FilterObject => ({
    [field]: { $gte: value },
  }),

  /**
   * Less than
   * @example buildFilter.lt("chunk_index", 50)
   */
  lt: (field: string, value: any): FilterObject => ({
    [field]: { $lt: value },
  }),

  /**
   * Less than or equal
   * @example buildFilter.lte("created_at", "2024-12-31")
   */
  lte: (field: string, value: any): FilterObject => ({
    [field]: { $lte: value },
  }),

  /**
   * In array
   * @example buildFilter.in("status", ["completed", "pending"])
   */
  in: (field: string, values: any[]): FilterObject => ({
    [field]: { $in: values },
  }),

  /**
   * Contains substring
   * @example buildFilter.contains("name", "report")
   */
  contains: (field: string, value: string): FilterObject => ({
    [field]: { $contains: value },
  }),

  /**
   * Does not contain
   * @example buildFilter.ncontains("name", "draft")
   */
  ncontains: (field: string, value: string): FilterObject => ({
    [field]: { $ncontains: value },
  }),

  /**
   * Starts with
   * @example buildFilter.startswith("name", "Annual")
   */
  startswith: (field: string, value: string): FilterObject => ({
    [field]: { $startswith: value },
  }),

  /**
   * Ends with
   * @example buildFilter.endswith("file_path", ".pdf")
   */
  endswith: (field: string, value: string): FilterObject => ({
    [field]: { $endswith: value },
  }),

  /**
   * Is empty (null)
   * @example buildFilter.isempty("full_text")
   */
  isempty: (field: string): FilterObject => ({
    [field]: { $isempty: true },
  }),

  /**
   * Is not empty (not null)
   * @example buildFilter.isnotempty("full_text")
   */
  isnotempty: (field: string): FilterObject => ({
    [field]: { $isnotempty: true },
  }),

  /**
   * AND logical operator
   * @example buildFilter.and([
   *   buildFilter.eq("status", "completed"),
   *   buildFilter.gte("created_at", "2024-01-01")
   * ])
   */
  and: (filters: FilterObject[]): FilterObject => ({
    $and: filters,
  }),

  /**
   * OR logical operator
   * @example buildFilter.or([
   *   buildFilter.eq("status", "completed"),
   *   buildFilter.eq("status", "pending")
   * ])
   */
  or: (filters: FilterObject[]): FilterObject => ({
    $or: filters,
  }),
};

/**
 * Helper function to build sort strings
 */
export const buildSort = {
  /**
   * Ascending sort
   * @example buildSort.asc("name") // "name:asc"
   */
  asc: (field: string): string => `${field}:asc`,

  /**
   * Descending sort
   * @example buildSort.desc("created_at") // "created_at:desc"
   */
  desc: (field: string): string => `${field}:desc`,
};

// Export all document-related service functions
export default {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentChunks,
  createDocumentChunk,
  updateDocumentChunk,
  deleteDocumentChunk,
  searchDocuments,
  buildFilter,
  buildSort,
};
