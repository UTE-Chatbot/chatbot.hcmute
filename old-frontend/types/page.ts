/**
 * Pagination Types
 * Common pagination response structures
 */

/**
 * Pagination response structure matching FastAPI pagination
 */
export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/**
 * Pagination parameters
 */
export interface PageParams {
  page?: number;
  size?: number;
}
