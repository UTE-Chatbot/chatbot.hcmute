/**
 * Topic Service
 * Service layer for topic management
 */

import { api } from "@/lib/api";
import type { TopicsResponse, TopicData } from "@/types/topic";

/**
 * Get all topics
 * @returns Promise<TopicsResponse>
 *
 * @example
 * const topics = await getTopics();
 * console.log(topics);
 */
export const getTopics = async (): Promise<TopicsResponse> => {
  const response = await api.get<TopicsResponse>("/topics/topics");
  return response.data;
};

/**
 * Update topics (admin only)
 * @param topics - Topics data to update
 * @returns Promise<TopicsResponse>
 *
 * @example
 * const updated = await updateTopics({
 *   "Engineering": {
 *     "Software Development": ["Frontend", "Backend", "DevOps"],
 *     "Hardware": ["Electronics", "Circuits"]
 *   }
 * });
 */
export const updateTopics = async (
  topics: TopicData
): Promise<TopicsResponse> => {
  const response = await api.put<TopicsResponse>("/topics/topics", topics);
  return response.data;
};

// Export all topic-related service functions
export default {
  getTopics,
  updateTopics,
};
