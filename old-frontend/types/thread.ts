/**
 * Thread Types and Interfaces
 * Based on backend schemas and API responses
 */

import type { PageResponse } from "./page";
import type { QueryParams } from "@/lib/query-builder";

/**
 * Thread creation payload
 */
export interface ThreadCreate {
  title?: string | null;
  client_id?: string | null;
}

/**
 * Thread response from API
 */
export interface ThreadResponse {
  id: string;
  thread_id: string;
  title?: string | null;
  user_id?: string | null;
  client_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Message response
 */
export interface MessageResponse {
  role: "human" | "ai";
  content: string;
}

/**
 * Thread messages response
 */
export interface ThreadMessagesResponse {
  thread_id: string;
  messages: MessageResponse[];
}

/**
 * Thread report response
 */
export interface ThreadReportResponse {
  total_threads: number;
  total_messages: number;
  keywords: string[];
  topics: string[];
  average_messages_per_thread: number;
}

/**
 * Client message for chat requests
 */
export interface ClientMessage {
  role: string;
  content: string;
}

/**
 * Chat request payload
 */
export interface ChatRequest {
  messages: ClientMessage[];
  threadId?: string | null;
}

/**
 * Question request payload
 */
export interface QuestionRequest {
  question: string;
}

/**
 * Thread list response
 */
export type ThreadListResponse = PageResponse<ThreadResponse>;
