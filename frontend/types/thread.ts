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
  user?: {
    id: string;
    email: string;
    full_name?: string | null;
    avatar?: string | null;
  } | null;
}

export interface MaintenanceStatus {
  enabled: boolean;
}

/**
 * Message response
 */
export interface MessageResponse {
  role: "human" | "ai";
  content: string;
  information?: string[];
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
 * Thread count by date
 */
export interface ThreadCountByDate {
  date: string;
  count: number;
}

export interface KeywordStat {
  keyword: string;
  count: number;
}

/**
 * Dashboard stats response
 */
export interface DashboardStatsResponse {
  total_threads: number;
  total_csvs: number;
  total_docs: number;
  total_users: number;
  thread_counts: ThreadCountByDate[];
  popular_keywords: KeywordStat[];
  popular_topics: string[];
  total_feedbacks?: number;
  average_rating?: number;
  accurate_percentage?: number;
  helpful_percentage?: number;
  understandable_percentage?: number;
}

/**
 * Thread list response
 */
export type ThreadListResponse = PageResponse<ThreadResponse>;

export interface ThreadFeedbackCreate {
  rating: number;
  is_accurate?: boolean;
  is_helpful?: boolean;
  is_understandable?: boolean;
  comment?: string | null;
}

export interface ThreadFeedbackResponse {
  id: string;
  thread_id: string;
  rating: number;
  is_accurate?: boolean | null;
  is_helpful?: boolean | null;
  is_understandable?: boolean | null;
  comment?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  thread?: {
    thread_id: string;
    title?: string | null;
  } | null;
}

export type FeedbackListResponse = PageResponse<ThreadFeedbackResponse>;

