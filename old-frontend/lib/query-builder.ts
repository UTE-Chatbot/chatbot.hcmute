/**
 * Query Builder Utilities
 * Common utilities for building query strings from QueryBuilder parameters
 */

import type { FilterObject, QueryBuilderParams } from "@/types/query";

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  size?: number;
}

/**
 * Complete query parameters with pagination
 * Combines QueryBuilderParams with pagination for API endpoints
 */
export interface QueryParams extends QueryBuilderParams, PaginationParams {
  [key: string]: any; // Allow additional parameters
}

/**
 * Build query string from query parameters
 * @param params - Query parameters including pagination, filters, sort, and search
 * @returns URL query string
 * 
 * @example
 * // Basic pagination
 * buildQueryString({ page: 1, size: 10 })
 * // Returns: "page=1&size=10"
 * 
 * @example
 * // With filters
 * buildQueryString({ 
 *   page: 1, 
 *   size: 10,
 *   filters: { status: { $eq: "completed" } }
 * })
 * // Returns: "page=1&size=10&filters=%7B%22status%22%3A%7B%22%24eq%22%3A%22completed%22%7D%7D"
 * 
 * @example
 * // With sorting and search
 * buildQueryString({ 
 *   page: 1,
 *   sort: "created_at:desc",
 *   search: "keyword"
 * })
 * // Returns: "page=1&sort=created_at%3Adesc&search=keyword"
 */
export const buildQueryString = (params: QueryParams): string => {
  const queryParams = new URLSearchParams();

  // Add pagination parameters
  if (params.page !== undefined) {
    queryParams.append("page", params.page.toString());
  }

  if (params.size !== undefined) {
    queryParams.append("size", params.size.toString());
  }

  // Add filter parameters (JSON stringified)
  if (params.filters) {
    queryParams.append("filters", JSON.stringify(params.filters));
  }

  // Add sort parameter
  if (params.sort) {
    queryParams.append("sort", params.sort);
  }

  // Add search parameter
  if (params.search) {
    queryParams.append("search", params.search);
  }

  // Add any additional custom parameters
  Object.keys(params).forEach((key) => {
    if (!["page", "size", "filters", "sort", "search"].includes(key)) {
      const value = params[key];
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    }
  });

  return queryParams.toString();
};

/**
 * Build URL with query string
 * @param baseUrl - Base URL path
 * @param params - Query parameters
 * @returns Complete URL with query string
 * 
 * @example
 * buildUrl("/api/v1/documents", { page: 1, size: 10 })
 * // Returns: "/api/v1/documents?page=1&size=10"
 */
export const buildUrl = (baseUrl: string, params: QueryParams = {}): string => {
  const queryString = buildQueryString(params);
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};
