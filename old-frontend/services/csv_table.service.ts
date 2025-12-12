/**
 * CSV Table Service
 * Comprehensive service layer for CSV table management with QueryBuilder support
 */

import { api } from "@/lib/api";
import { buildQueryString, type QueryParams } from "@/lib/query-builder";
import type { FilterObject } from "@/types/query";
import type {
  CSVTableCreate,
  CSVTableUpdate,
  CSVTableResponse,
  CSVTableListResponse,
} from "@/types/csv-table";

/**
 * Get paginated list of CSV tables with filtering, sorting, and searching
 * @param params - Query parameters for filtering, sorting, pagination, and search
 * @returns Promise<CSVTableListResponse>
 *
 * @example
 * // Basic pagination
 * getCSVTables({ page: 1, size: 10 })
 *
 * @example
 * // With filtering
 * getCSVTables({
 *   filters: {
 *     name: { $contains: "student" }
 *   },
 *   page: 1,
 *   size: 20
 * })
 *
 * @example
 * // With sorting
 * getCSVTables({
 *   sort: "created_at:desc",
 *   page: 1,
 *   size: 10
 * })
 *
 * @example
 * // With search
 * getCSVTables({
 *   search: "enrollment",
 *   page: 1,
 *   size: 10
 * })
 */
export const getCSVTables = async (
  params: QueryParams = {}
): Promise<CSVTableListResponse> => {
  const queryString = buildQueryString(params);
  const url = `/csv_tables${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<CSVTableListResponse>(url);
  return response.data;
};

/**
 * Get a single CSV table by ID
 * @param tableId - The table ID
 * @returns Promise<CSVTableResponse>
 *
 * @example
 * const table = await getCSVTableById(123);
 */
export const getCSVTableById = async (
  tableId: number
): Promise<CSVTableResponse> => {
  const response = await api.get<CSVTableResponse>(`/csv_tables/${tableId}`);
  return response.data;
};

/**
 * Create a new CSV table
 * @param data - CSV table creation payload
 * @returns Promise<CSVTableResponse>
 *
 * @example
 * const table = await createCSVTable({
 *   name: "student_enrollment",
 *   url: "https://example.com/data.csv",
 *   description: "Student enrollment data",
 *   columns: [
 *     {
 *       name: "student_id",
 *       type: ColumnType.BIGINT,
 *       description: "Student ID",
 *       is_categorical: false
 *     },
 *     {
 *       name: "name",
 *       type: ColumnType.TEXT,
 *       description: "Student name",
 *       is_categorical: false
 *     }
 *   ]
 * });
 */
export const createCSVTable = async (
  data: CSVTableCreate
): Promise<CSVTableResponse> => {
  const response = await api.post<CSVTableResponse>("/csv_tables", data);
  return response.data;
};

/**
 * Update an existing CSV table
 * @param tableId - The table ID
 * @param data - CSV table update payload
 * @returns Promise<CSVTableResponse>
 *
 * @example
 * const updated = await updateCSVTable(123, {
 *   name: "updated_table_name",
 *   description: "Updated description"
 * });
 */
export const updateCSVTable = async (
  tableId: number,
  data: CSVTableUpdate
): Promise<CSVTableResponse> => {
  const response = await api.put<CSVTableResponse>(
    `/csv_tables/${tableId}`,
    data
  );
  return response.data;
};

/**
 * Delete a CSV table
 * @param tableId - The table ID
 * @returns Promise<void>
 *
 * @example
 * await deleteCSVTable(123);
 */
export const deleteCSVTable = async (tableId: number): Promise<void> => {
  await api.delete(`/csv_tables/${tableId}`);
};

/**
 * Get database schema from the actual database
 * @returns Promise<CSVTableResponse[]>
 *
 * @example
 * const schema = await getDatabaseSchema();
 * schema.forEach(table => {
 *   console.log(`Table: ${table.name}`);
 *   console.log(`Columns: ${table.columns.length}`);
 * });
 */
export const getDatabaseSchema = async (): Promise<CSVTableResponse[]> => {
  const response = await api.get<CSVTableResponse[]>("/csv_tables/schema");
  return response.data;
};

/**
 * Helper function to build filter objects for CSV tables
 */
export const buildCSVTableFilter = {
  /**
   * Filter by table name
   * @example buildCSVTableFilter.byName("student_enrollment")
   */
  byName: (name: string): FilterObject => ({
    name: { $eq: name },
  }),

  /**
   * Search table names
   * @example buildCSVTableFilter.searchName("student")
   */
  searchName: (query: string): FilterObject => ({
    name: { $contains: query },
  }),

  /**
   * Filter by description
   * @example buildCSVTableFilter.byDescription("enrollment")
   */
  byDescription: (description: string): FilterObject => ({
    description: { $contains: description },
  }),
};

// Export all CSV table-related service functions
export default {
  getCSVTables,
  getCSVTableById,
  createCSVTable,
  updateCSVTable,
  deleteCSVTable,
  getDatabaseSchema,
  buildCSVTableFilter,
};
