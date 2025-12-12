/**
 * Query Builder Types
 * FastAPI QueryBuilder filter and query structures
 */

/**
 * Query builder filter operators
 */
export type FilterOperator =
  | "$eq"       // Equal to
  | "$ne"       // Not equal to
  | "$gt"       // Greater than
  | "$gte"      // Greater than or equal
  | "$lt"       // Less than
  | "$lte"      // Less than or equal
  | "$in"       // In array
  | "$isanyof"  // Is any of (alias for $in)
  | "$contains" // Contains substring
  | "$ncontains"// Does not contain
  | "$startswith" // Starts with
  | "$endswith"   // Ends with
  | "$isempty"    // Is null
  | "$isnotempty"; // Is not null

/**
 * Filter condition structure
 */
export interface FilterCondition {
  [operator: string]: any;
}

/**
 * Logical operators for complex filtering
 */
export interface LogicalFilter {
  $and?: FilterObject[];
  $or?: FilterObject[];
}

/**
 * Filter object structure
 */
export type FilterObject = {
  [field: string]: FilterCondition | FilterObject;
} & LogicalFilter;

/**
 * Sort direction
 */
export type SortDirection = "asc" | "desc";

/**
 * Base query parameters for QueryBuilder endpoints
 */
export interface QueryBuilderParams {
  filters?: FilterObject;
  sort?: string; // Format: "field:direction" e.g., "name:asc" or "created_at:desc"
  search?: string;
}
