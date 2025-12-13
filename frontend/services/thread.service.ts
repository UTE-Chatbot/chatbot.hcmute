/**
 * Thread Service
 * Comprehensive service layer for thread management with pagination support
 */

import { api } from "@/lib/api";
import { buildQueryString, type QueryParams } from "@/lib/query-builder";
import type {
  ThreadCreate,
  ThreadResponse,
  ThreadListResponse,
  ThreadMessagesResponse,
  ThreadReportResponse,
  DashboardStatsResponse,
  ChatRequest,
  MaintenanceStatus,
} from "@/types/thread";

/**
 * Get dashboard stats (admin only)
 * @returns Promise<DashboardStatsResponse>
 */
export const getDashboardStats = async (
  startDate?: Date,
  endDate?: Date
): Promise<DashboardStatsResponse> => {
  const params: any = {};
  if (startDate) params.start_date = startDate.toISOString();
  if (endDate) params.end_date = endDate.toISOString();

  const queryString = new URLSearchParams(params).toString();
  const url = `/threads/admin/dashboard${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<DashboardStatsResponse>(url);
  return response.data;
};

export const exportThreadCsv = async (
  startDate?: Date,
  endDate?: Date
): Promise<void> => {
  const params: any = {};
  if (startDate) params.start_date = startDate.toISOString();
  if (endDate) params.end_date = endDate.toISOString();

  const queryString = new URLSearchParams(params).toString();
  const url = `${process.env.NEXT_PUBLIC_API_URL}/threads/admin/export-csv${
    queryString ? `?${queryString}` : ""
  }`;

  // Use simple window.open for download or fetch blob
  window.open(url, "_blank");
};

/**
 * Get paginated list of threads with filtering and sorting
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Promise<ThreadListResponse>
 *
 * @example
 * // Basic pagination
 * getThreads({ page: 1, size: 10 })
 *
 * @example
 * // Filter by client_id
 * getThreads({
 *   filters: { client_id: { $eq: "user-123" } },
 *   page: 1,
 *   size: 20
 * })
 *
 * @example
 * // Sort by created date
 * getThreads({
 *   sort: "created_at:desc",
 *   page: 1,
 *   size: 10
 * })
 */
export const getThreads = async (
  params: QueryParams = {}
): Promise<ThreadListResponse> => {
  const queryString = buildQueryString(params);
  const url = `/threads${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<ThreadListResponse>(url);
  return response.data;
};

/**
 * Create a new thread
 * @param data - Thread creation payload (optional)
 * @returns Promise<ThreadResponse>
 *
 * @example
 * // Create new thread
 * const thread = await createThread();
 *
 * @example
 * // Create with title
 * const thread = await createThread({
 *   title: "My Conversation"
 * });
 */
export const createThread = async (
  data?: ThreadCreate
): Promise<ThreadResponse> => {
  const response = await api.post<ThreadResponse>("/threads/new", data);
  return response.data;
};

/**
 * Legacy alias for createThread
 * @deprecated Use createThread instead
 */
export const createNewThread = createThread;

/**
 * Get a single thread by ID
 * @param threadId - The thread ID (UUID)
 * @returns Promise<ThreadResponse>
 *
 * @example
 * const thread = await getThreadById("550e8400-e29b-41d4-a716-446655440000");
 */
export const getThreadById = async (
  threadId: string
): Promise<ThreadResponse> => {
  const response = await api.get<ThreadResponse>(`/threads/${threadId}`);
  return response.data;
};

/**
 * Get messages for a thread
 * @param threadId - The thread ID (UUID)
 * @returns Promise<ThreadMessagesResponse>
 *
 * @example
 * const messages = await getThreadMessages("550e8400-e29b-41d4-a716-446655440000");
 * console.log(messages.messages);
 */
export const getThreadMessages = async (
  threadId: string
): Promise<ThreadMessagesResponse> => {
  const response = await api.get<ThreadMessagesResponse>(
    `/threads/${threadId}/messages`
  );
  return response.data;
};
/**
 * Delete a thread
 * @param threadId - The thread ID (UUID)
 * @returns Promise<void>
 *
 * @example
 * await deleteThread("550e8400-e29b-41d4-a716-446655440000");
 */
export const deleteThread = async (threadId: string): Promise<void> => {
  await api.delete(`/threads/${threadId}`);
};

/**
 * Get global thread report (admin only)
 * @returns Promise<ThreadReportResponse>
 *
 * @example
 * const report = await getThreadReport();
 * console.log(`Total threads: ${report.total_threads}`);
 * console.log(`Keywords: ${report.keywords.join(", ")}`);
 */
export const getThreadReport = async (): Promise<ThreadReportResponse> => {
  const response = await api.get<ThreadReportResponse>("/threads/admin/report");
  return response.data;
};

/**
 * Send a chat message and get streaming response
 * @param threadId - The thread ID (UUID)
 * @param request - Chat request with messages
 * @returns Promise<Response> - Streaming response
 *
 * @example
 * const response = await sendChatMessage("550e8400-e29b-41d4-a716-446655440000", {
 *   messages: [
 *     { role: "human", content: "What is machine learning?" }
 *   ]
 * });
 *
 * // Handle streaming response
 * const reader = response.body?.getReader();
 * const decoder = new TextDecoder();
 * while (true) {
 *   const { done, value } = await reader.read();
 *   if (done) break;
 *   const chunk = decoder.decode(value);
 *   console.log(chunk);
 * }
 */
export const sendChatMessage = async (
  threadId: string,
  request: ChatRequest
): Promise<Response> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/threads/${threadId}/ask`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
};

export const getMaintenanceStatus = async (): Promise<MaintenanceStatus> => {
  const response = await api.get<MaintenanceStatus>("/threads/maintenance");
  return response.data;
};

export const setMaintenanceStatus = async (
  enabled: boolean
): Promise<MaintenanceStatus> => {
  const response = await api.post<MaintenanceStatus>("/threads/maintenance", {
    enabled,
  });
  return response.data;
};

// Export all thread-related service functions
export default {
  getThreads,
  createThread,
  createNewThread,
  getThreadById,
  getThreadMessages,
  deleteThread,
  getThreadReport,
  sendChatMessage,
  getDashboardStats,
  exportThreadCsv,
  getMaintenanceStatus,
  setMaintenanceStatus,
};
