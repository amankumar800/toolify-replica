/**
 * CSV Export Utility
 *
 * Provides functions for exporting admin data to CSV format.
 * Handles special characters, newlines, and proper escaping per RFC 4180.
 *
 * @module csv-export
 *
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7
 */

import type { CSVExportOptions, CSVExportResult } from '@/lib/services/admin-crud.types';

// ============================================================================
// Constants
// ============================================================================

/**
 * Default maximum number of records to export
 * Requirements: 17.4
 */
export const DEFAULT_MAX_RECORDS = 10000;

/**
 * Columns that should always be included in exports
 * Requirements: 17.2
 */
export const TIMESTAMP_COLUMNS = ['id', 'created_at', 'updated_at'] as const;

/**
 * Characters that require CSV field quoting
 */
const CSV_SPECIAL_CHARS = /[,"\n\r]/;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Escapes a value for CSV format according to RFC 4180
 *
 * Rules:
 * - Fields containing commas, double quotes, or newlines must be enclosed in double quotes
 * - Double quotes within fields must be escaped by doubling them
 *
 * Requirements: 17.7
 *
 * @param value - The value to escape
 * @returns The escaped CSV string
 */
export function escapeCSVValue(value: unknown): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return '';
  }

  // Handle Date objects
  if (value instanceof Date) {
    // Handle invalid dates
    if (isNaN(value.getTime())) {
      return '';
    }
    return value.toISOString();
  }

  // Handle arrays (e.g., tags) - join with semicolons
  if (Array.isArray(value)) {
    const joined = value.map((item) => String(item)).join('; ');
    return escapeCSVString(joined);
  }

  // Handle objects - JSON stringify
  if (typeof value === 'object') {
    const jsonStr = JSON.stringify(value);
    return escapeCSVString(jsonStr);
  }

  // Handle primitives
  return escapeCSVString(String(value));
}

/**
 * Escapes a string for CSV format
 *
 * @param str - The string to escape
 * @returns The escaped string
 */
function escapeCSVString(str: string): string {
  // If the string contains special characters, wrap in quotes and escape internal quotes
  if (CSV_SPECIAL_CHARS.test(str)) {
    // Escape double quotes by doubling them
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return str;
}

/**
 * Generates a CSV filename with the current date
 *
 * Format: {tableName}_{YYYY-MM-DD}.csv
 *
 * Requirements: 17.6
 *
 * @param tableName - The name of the table being exported
 * @returns The generated filename
 */
export function generateCSVFilename(tableName: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  return `${tableName}_${dateStr}.csv`;
}

/**
 * Formats a column header from snake_case to Title Case
 *
 * @param column - The column name in snake_case
 * @returns The formatted header
 */
export function formatColumnHeader(column: string): string {
  return column
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Gets the value from an object by key, handling nested paths
 *
 * @param obj - The object to get the value from
 * @param key - The key or path to the value
 * @returns The value at the key
 */
function getValueByKey(obj: Record<string, unknown>, key: string): unknown {
  // Handle simple keys
  if (key in obj) {
    return obj[key];
  }

  // Handle nested paths (e.g., 'tool.name')
  const parts = key.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

// ============================================================================
// Main Export Functions
// ============================================================================

/**
 * Exports data to CSV format
 *
 * Requirements: 17.2, 17.3, 17.4, 17.5, 17.6, 17.7
 *
 * @param data - The data array to export
 * @param options - Export options including table name and columns
 * @returns The CSV export result with content, filename, and metadata
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  options: CSVExportOptions
): CSVExportResult {
  const { tableName, columns, maxRecords = DEFAULT_MAX_RECORDS } = options;

  // Determine all columns to include (visible + timestamps)
  // Requirements: 17.2 - Include visible columns plus id and timestamps
  const allColumns = [...new Set([...columns, ...TIMESTAMP_COLUMNS])];

  // Filter to only include columns that exist in the data
  const availableColumns =
    data.length > 0
      ? allColumns.filter((col) => {
          // Check if any row has this column
          return data.some((row) => getValueByKey(row, col) !== undefined);
        })
      : allColumns;

  // Apply record limit
  // Requirements: 17.4 - Maximum 10,000 records
  const truncated = data.length > maxRecords;
  const limitedData = truncated ? data.slice(0, maxRecords) : data;

  // Build header row
  const headerRow = availableColumns.map(formatColumnHeader).map(escapeCSVValue).join(',');

  // Build data rows
  const dataRows = limitedData.map((row) => {
    return availableColumns
      .map((col) => {
        const value = getValueByKey(row, col);
        return escapeCSVValue(value);
      })
      .join(',');
  });

  // Combine header and data rows
  const content = [headerRow, ...dataRows].join('\n');

  // Generate filename
  // Requirements: 17.6 - Filename pattern: {table_name}_{date}.csv
  const filename = generateCSVFilename(tableName);

  return {
    filename,
    content,
    recordCount: limitedData.length,
    truncated,
  };
}

/**
 * Triggers a browser download of the CSV content
 *
 * @param result - The CSV export result to download
 */
export function downloadCSV(result: CSVExportResult): void {
  // Create a Blob with the CSV content
  const blob = new Blob([result.content], { type: 'text/csv;charset=utf-8;' });

  // Create a download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', result.filename);
  link.style.visibility = 'hidden';

  // Append to document, click, and clean up
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke the object URL to free memory
  URL.revokeObjectURL(url);
}

/**
 * Checks if the data exceeds the maximum record limit
 *
 * Requirements: 17.5 - Display warning if more than 10,000 records
 *
 * @param totalRecords - The total number of records
 * @param maxRecords - The maximum allowed records (default: 10,000)
 * @returns True if the data exceeds the limit
 */
export function exceedsRecordLimit(
  totalRecords: number,
  maxRecords: number = DEFAULT_MAX_RECORDS
): boolean {
  return totalRecords > maxRecords;
}

/**
 * Gets a warning message for truncated exports
 *
 * Requirements: 17.5
 *
 * @param totalRecords - The total number of records
 * @param maxRecords - The maximum allowed records
 * @returns The warning message
 */
export function getTruncationWarning(
  totalRecords: number,
  maxRecords: number = DEFAULT_MAX_RECORDS
): string {
  return `Export limited to ${maxRecords.toLocaleString()} records. ${(totalRecords - maxRecords).toLocaleString()} records were not included. Consider applying filters to reduce the dataset.`;
}
