/**
 * Topic Types and Interfaces
 * Based on backend API responses
 */

/**
 * Topic structure
 * Flexible structure to accommodate various topic formats
 */
export type TopicData = Record<string, any>;

/**
 * Topics response from API
 */
export interface TopicsResponse {
  [key: string]: any;
}
