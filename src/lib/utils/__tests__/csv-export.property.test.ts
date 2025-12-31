/**
 * Property-based tests for CSV export utility
 *
 * Tests Property 27 from the design document:
 * - Property 27: CSV Export
 *
 * **Feature: admin-panel-crud**
 * **Validates: Requirements 17.2, 17.3, 17.4, 17.6, 17.7**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  escapeCSVValue,
  generateCSVFilename,
  formatColumnHeader,
  exportToCSV,
  exceedsRecordLimit,
  getTruncationWarning,
  DEFAULT_MAX_RECORDS,
  TIMESTAMP_COLUMNS,
} from '../csv-export';

// ============================================================================
// Test Arbitraries
// ============================================================================

// Valid table name arbitrary
const tableNameArb = fc.stringMatching(/^[a-z_]{3,20}$/);

// Simple string value arbitrary
const simpleStringArb = fc.string({ minLength: 0, maxLength: 100 });

// String with special CSV characters
const specialCharStringArb = fc.oneof(
  fc.constant('hello, world'),
  fc.constant('line1\nline2'),
  fc.constant('quote "test" here'),
  fc.constant('mixed, "quotes"\nand newlines'),
  fc.stringMatching(/^[a-z]+,[a-z]+$/),
  fc.stringMatching(/^[a-z]+\n[a-z]+$/),
  fc.stringMatching(/^[a-z]+"[a-z]+"[a-z]+$/)
);

// Column name arbitrary (snake_case)
const columnNameArb = fc
  .tuple(
    fc.stringMatching(/^[a-z]{2,10}$/),
    fc.array(fc.stringMatching(/^[a-z]{2,10}$/), { minLength: 0, maxLength: 2 })
  )
  .map(([first, rest]) => [first, ...rest].join('_'));

// Record arbitrary for testing
const recordArb = fc.record({
  id: fc.uuid(),
  name: simpleStringArb,
  description: simpleStringArb,
  status: fc.constantFrom('draft', 'published', 'archived'),
  is_featured: fc.boolean(),
  tags: fc.array(fc.stringMatching(/^[a-z]{3,10}$/), { minLength: 0, maxLength: 5 }),
  created_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
});

// Record with special characters
const recordWithSpecialCharsArb = fc.record({
  id: fc.uuid(),
  name: specialCharStringArb,
  description: specialCharStringArb,
  created_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
});

// ============================================================================
// Property 27: CSV Export
// ============================================================================

describe('Property 27: CSV Export', () => {
  /**
   * **Feature: admin-panel-crud, Property 27: CSV Export**
   * **Validates: Requirements 17.2, 17.3, 17.4, 17.6, 17.7**
   *
   * *For any* CSV export, the file SHALL include all visible columns plus id
   * and timestamps, respect current filters, include maximum 10,000 records,
   * follow the filename pattern `{table_name}_{date}.csv`, and properly escape
   * special characters and newlines.
   */

  describe('escapeCSVValue - Requirements 17.7', () => {
    it('should handle null and undefined values (property test with 100 runs)', () => {
      fc.assert(
        fc.property(fc.constantFrom(null, undefined), (value) => {
          const result = escapeCSVValue(value);
          // Property: null/undefined should become empty string
          expect(result).toBe('');
        }),
        { numRuns: 100 }
      );
    });

    it('should handle simple strings without special characters (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z0-9 ]{0,50}$/),
          (value) => {
            const result = escapeCSVValue(value);
            // Property: Simple strings should not be quoted
            expect(result).toBe(value);
            expect(result).not.toContain('"');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should quote strings containing commas (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.stringMatching(/^[a-z]{1,10}$/),
            fc.stringMatching(/^[a-z]{1,10}$/)
          ),
          ([part1, part2]) => {
            const value = `${part1},${part2}`;
            const result = escapeCSVValue(value);
            // Property: Strings with commas should be quoted
            expect(result).toBe(`"${value}"`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should quote strings containing newlines (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.stringMatching(/^[a-z]{1,10}$/),
            fc.stringMatching(/^[a-z]{1,10}$/)
          ),
          ([part1, part2]) => {
            const value = `${part1}\n${part2}`;
            const result = escapeCSVValue(value);
            // Property: Strings with newlines should be quoted
            expect(result).toBe(`"${value}"`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should escape double quotes by doubling them (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.stringMatching(/^[a-z]{1,10}$/),
            fc.stringMatching(/^[a-z]{1,10}$/)
          ),
          ([part1, part2]) => {
            const value = `${part1}"${part2}`;
            const result = escapeCSVValue(value);
            // Property: Double quotes should be escaped by doubling
            expect(result).toBe(`"${part1}""${part2}"`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle Date objects (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          (date) => {
            const result = escapeCSVValue(date);
            // Property: Valid dates should be converted to ISO string
            // Invalid dates (NaN) should return empty string
            if (isNaN(date.getTime())) {
              expect(result).toBe('');
            } else {
              expect(result).toBe(date.toISOString());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle invalid Date objects (NaN dates)', () => {
      const invalidDate = new Date(NaN);
      const result = escapeCSVValue(invalidDate);
      // Property: Invalid dates should return empty string
      expect(result).toBe('');
    });

    it('should handle arrays by joining with semicolons (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.array(fc.stringMatching(/^[a-z]{3,10}$/), { minLength: 1, maxLength: 5 }),
          (arr) => {
            const result = escapeCSVValue(arr);
            // Property: Arrays should be joined with semicolons
            const expected = arr.join('; ');
            // Result may be quoted if it contains special chars
            expect(result === expected || result === `"${expected}"`).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle objects by JSON stringifying (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.record({
            key1: fc.stringMatching(/^[a-z]{3,10}$/),
            key2: fc.integer({ min: 0, max: 100 }),
          }),
          (obj) => {
            const result = escapeCSVValue(obj);
            const jsonStr = JSON.stringify(obj);
            // Property: Objects should be JSON stringified (and quoted due to special chars)
            expect(result).toContain(obj.key1);
            expect(result).toContain(String(obj.key2));
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('generateCSVFilename - Requirements 17.6', () => {
    it('should generate filename with correct pattern (property test with 100 runs)', () => {
      fc.assert(
        fc.property(tableNameArb, (tableName) => {
          const result = generateCSVFilename(tableName);

          // Property: Filename should match pattern {table_name}_{YYYY-MM-DD}.csv
          const pattern = new RegExp(`^${tableName}_\\d{4}-\\d{2}-\\d{2}\\.csv$`);
          expect(result).toMatch(pattern);
        }),
        { numRuns: 100 }
      );
    });

    it('should use current date in filename', () => {
      const tableName = 'tools';
      const result = generateCSVFilename(tableName);

      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const expectedDate = `${year}-${month}-${day}`;

      // Property: Filename should contain today's date
      expect(result).toBe(`${tableName}_${expectedDate}.csv`);
    });
  });

  describe('formatColumnHeader', () => {
    it('should convert snake_case to Title Case (property test with 100 runs)', () => {
      fc.assert(
        fc.property(columnNameArb, (column) => {
          const result = formatColumnHeader(column);

          // Property: Each word should start with uppercase
          const words = result.split(' ');
          words.forEach((word) => {
            if (word.length > 0) {
              expect(word[0]).toBe(word[0].toUpperCase());
            }
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should handle common column names correctly', () => {
      expect(formatColumnHeader('created_at')).toBe('Created At');
      expect(formatColumnHeader('updated_at')).toBe('Updated At');
      expect(formatColumnHeader('is_featured')).toBe('Is Featured');
      expect(formatColumnHeader('website_url')).toBe('Website Url');
    });
  });

  describe('exportToCSV - Requirements 17.2, 17.4', () => {
    it('should include id and timestamp columns (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.array(recordArb, { minLength: 1, maxLength: 10 }),
          tableNameArb,
          (data, tableName) => {
            const result = exportToCSV(data, {
              tableName,
              columns: ['name', 'status'],
            });

            // Property: Export should include id and timestamps (Requirements 17.2)
            const headerLine = result.content.split('\n')[0];
            expect(headerLine).toContain('Id');
            expect(headerLine).toContain('Created At');
            expect(headerLine).toContain('Updated At');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include visible columns in export (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.array(recordArb, { minLength: 1, maxLength: 10 }),
          tableNameArb,
          (data, tableName) => {
            const visibleColumns = ['name', 'status', 'is_featured'];
            const result = exportToCSV(data, {
              tableName,
              columns: visibleColumns,
            });

            // Property: Export should include all visible columns
            const headerLine = result.content.split('\n')[0];
            expect(headerLine).toContain('Name');
            expect(headerLine).toContain('Status');
            expect(headerLine).toContain('Is Featured');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should limit records to maxRecords (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 20 }),
          fc.integer({ min: 1, max: 4 }),
          tableNameArb,
          (dataSize, maxRecords, tableName) => {
            // Generate data larger than maxRecords
            const data = Array.from({ length: dataSize }, (_, i) => ({
              id: `id-${i}`,
              name: `name-${i}`,
              created_at: new Date(),
              updated_at: new Date(),
            }));

            const result = exportToCSV(data, {
              tableName,
              columns: ['name'],
              maxRecords,
            });

            // Property: Record count should not exceed maxRecords (Requirements 17.4)
            expect(result.recordCount).toBeLessThanOrEqual(maxRecords);

            // Property: truncated flag should be true when data exceeds limit
            if (dataSize > maxRecords) {
              expect(result.truncated).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use default max records of 10000', () => {
      const data = Array.from({ length: 5 }, (_, i) => ({
        id: `id-${i}`,
        name: `name-${i}`,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      const result = exportToCSV(data, {
        tableName: 'test',
        columns: ['name'],
      });

      // Property: Default max should be 10000, so 5 records should not be truncated
      expect(result.truncated).toBe(false);
      expect(result.recordCount).toBe(5);
    });

    it('should generate correct filename pattern (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.array(recordArb, { minLength: 1, maxLength: 5 }),
          tableNameArb,
          (data, tableName) => {
            const result = exportToCSV(data, {
              tableName,
              columns: ['name'],
            });

            // Property: Filename should match pattern (Requirements 17.6)
            const pattern = new RegExp(`^${tableName}_\\d{4}-\\d{2}-\\d{2}\\.csv$`);
            expect(result.filename).toMatch(pattern);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle special characters in data (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.array(recordWithSpecialCharsArb, { minLength: 1, maxLength: 5 }),
          tableNameArb,
          (data, tableName) => {
            const result = exportToCSV(data, {
              tableName,
              columns: ['name', 'description'],
            });

            // Property: Export should complete without errors (Requirements 17.7)
            expect(result.content).toBeDefined();
            expect(result.content.length).toBeGreaterThan(0);

            // Property: Record count should match input data length
            expect(result.recordCount).toBe(data.length);

            // Property: CSV should be parseable - count actual CSV rows
            const csvRows = parseCSVRows(result.content);
            // Should have header row + data rows
            expect(csvRows.length).toBe(data.length + 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty data array', () => {
      const result = exportToCSV([], {
        tableName: 'empty_table',
        columns: ['name', 'status'],
      });

      // Property: Empty data should produce header-only CSV
      expect(result.recordCount).toBe(0);
      expect(result.truncated).toBe(false);
      const lines = result.content.split('\n');
      expect(lines.length).toBe(1); // Just header
    });
  });

  describe('exceedsRecordLimit - Requirements 17.5', () => {
    it('should return true when records exceed limit (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          fc.integer({ min: 1, max: 50000 }),
          (total, limit) => {
            const result = exceedsRecordLimit(total, limit);

            // Property: Should return true only when total > limit
            expect(result).toBe(total > limit);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use default limit of 10000', () => {
      expect(exceedsRecordLimit(10001)).toBe(true);
      expect(exceedsRecordLimit(10000)).toBe(false);
      expect(exceedsRecordLimit(9999)).toBe(false);
    });
  });

  describe('getTruncationWarning - Requirements 17.5', () => {
    it('should include record counts in warning message (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10001, max: 100000 }),
          fc.integer({ min: 1000, max: 10000 }),
          (total, limit) => {
            const warning = getTruncationWarning(total, limit);

            // Property: Warning should mention the limit
            expect(warning).toContain(limit.toLocaleString());

            // Property: Warning should mention excluded records
            const excluded = total - limit;
            expect(warning).toContain(excluded.toLocaleString());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('CSV format correctness', () => {
    it('should produce parseable CSV (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.array(recordArb, { minLength: 1, maxLength: 10 }),
          tableNameArb,
          (data, tableName) => {
            const result = exportToCSV(data, {
              tableName,
              columns: ['name', 'status', 'is_featured'],
            });

            // Property: Each line should have the same number of columns
            const lines = result.content.split('\n');
            const headerColumnCount = countCSVColumns(lines[0]);

            lines.slice(1).forEach((line) => {
              if (line.trim()) {
                const columnCount = countCSVColumns(line);
                expect(columnCount).toBe(headerColumnCount);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============================================================================
// Helper Functions for Tests
// ============================================================================

/**
 * Counts the number of columns in a CSV line, handling quoted fields
 */
function countCSVColumns(line: string): number {
  let count = 1;
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Check for escaped quote
      if (inQuotes && line[i + 1] === '"') {
        i++; // Skip the escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      count++;
    }
  }

  return count;
}

/**
 * Parses CSV content into rows, handling quoted fields with newlines
 */
function parseCSVRows(content: string): string[] {
  const rows: string[] = [];
  let currentRow = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '"') {
      // Check for escaped quote
      if (inQuotes && content[i + 1] === '"') {
        currentRow += '""';
        i++; // Skip the escaped quote
      } else {
        inQuotes = !inQuotes;
        currentRow += char;
      }
    } else if (char === '\n' && !inQuotes) {
      // End of row (not inside quotes)
      if (currentRow.trim()) {
        rows.push(currentRow);
      }
      currentRow = '';
    } else {
      currentRow += char;
    }
  }

  // Don't forget the last row
  if (currentRow.trim()) {
    rows.push(currentRow);
  }

  return rows;
}
