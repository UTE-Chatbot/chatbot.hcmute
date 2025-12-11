/**
 * CSV Table Types and Interfaces
 * Based on backend schemas and API responses
 */

import type { PageResponse } from "./page";
import type { QueryParams } from "@/lib/query-builder";

/**
 * Column data types
 */
export enum ColumnType {
  BIGINT = "BIGINT",
  TEXT = "TEXT",
  DECIMAL = "DECIMAL",
}

/**
 * Column schema for input (create/update)
 */
export interface CSVTableColumnInput {
  name: string;
  type: ColumnType;
  description: string;
  is_categorical: boolean;
}

/**
 * Column schema for output
 */
export interface CSVTableColumnResponse {
  name: string;
  type: ColumnType;
  description: string;
  is_categorical: boolean;
  unique_values?: string | null;
}

/**
 * CSV table creation payload
 */
export interface CSVTableCreate {
  name: string;
  url: string;
  description?: string | null;
  columns: CSVTableColumnInput[];
}

/**
 * CSV table update payload
 */
export interface CSVTableUpdate {
  name?: string;
  url?: string;
  description?: string | null;
  columns?: CSVTableColumnInput[];
}

/**
 * CSV table response from API
 */
export interface CSVTableResponse {
  id: number;
  name: string;
  url: string;
  description?: string | null;
  columns: CSVTableColumnResponse[];
  created_at: string;
  updated_at: string;
}

/**
 * CSV table list response
 */
export type CSVTableListResponse = PageResponse<CSVTableResponse>;
