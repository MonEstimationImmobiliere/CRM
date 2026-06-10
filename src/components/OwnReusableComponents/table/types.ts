import type { CSSProperties } from 'vue';

/**
 * Sort direction for table columns
 */
export type SortDirection = 'asc' | 'desc' | null;

/**
 * Column definition for the EMTable component
 */
export interface ColumnDefinition<T = Record<string, any>> {
  /** Unique key matching the data property */
  key: keyof T | string;
  /** Display label for the column header */
  label: string;
  /** Whether the column is sortable (default: true) */
  sortable?: boolean;
  /** Column width (CSS value) */
  width?: string;
  /** Minimum column width */
  minWidth?: string;
  /** Maximum column width */
  maxWidth?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Custom formatter function */
  formatter?: (value: unknown, row: T) => string;
  /** Custom sort comparator */
  sortComparator?: (a: T, b: T) => number;
  /** Whether the column has a filter menu */
  filterMenu?: boolean;
}

/**
 * Action definition for the actions column
 */
export interface TableAction<T = Record<string, any>> {
  /** Unique key for the action */
  key: string;
  /** Display label */
  label: string;
  /** Optional icon (emoji or text) */
  icon?: string;
  /** Whether the action is destructive (styled as danger) */
  danger?: boolean;
  /** Function to determine if action is disabled for a specific row */
  disabled?: (row: T) => boolean;
  /** Handler function called when action is triggered */
  handler?: (row: T, rowIndex: number) => void;
}

/**
 * Custom CSS classes for table elements
 */
export interface TableCustomClasses {
  /** Class for the table container */
  container?: string;
  /** Class for header row */
  headerRow?: string;
  /** Class for header cells */
  headerCell?: string;
  /** Class for data rows */
  row?: string;
  /** Class for data cells */
  cell?: string;
}

/**
 * Custom inline styles for table elements
 */
export interface TableCustomStyles {
  /** Styles for the table container */
  container?: CSSProperties;
  /** Styles for header row */
  headerRow?: CSSProperties;
  /** Styles for header cells */
  headerCell?: CSSProperties;
  /** Styles for data rows */
  row?: CSSProperties;
  /** Styles for data cells */
  cell?: CSSProperties;
}

/**
 * Payload emitted when an action is triggered
 */
export interface ActionPayload<T = Record<string, any>> {
  action: TableAction<T>;
  row: T;
  rowIndex: number;
}

/**
 * Payload emitted when sort changes
 */
export interface SortPayload<T = Record<string, any>> {
  key: keyof T | string;
  direction: SortDirection;
}

/**
 * Payload emitted when a row is clicked
 */
export interface RowClickPayload<T = Record<string, any>> {
  row: T;
  rowIndex: number;
}
