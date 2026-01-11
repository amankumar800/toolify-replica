/**
 * Property-based tests for category utility functions
 *
 * Tests Properties 1, 2, and 3 from the design document:
 * - Property 1: Category Filtering Preserves Valid Categories
 * - Property 2: Tool Count Formatting
 * - Property 3: Category Link Generation
 *
 * **Feature: category-page-redesign**
 * **Validates: Requirements 1.1, 1.2, 2.2, 3.3, 3.5**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  isValidCategory,
  formatToolCount,
  generateCategoryLink,
  filterCategoriesBySearch,
} from '../category-utils';
import type { Category } from '@/lib/types/tool';

describe('Category Utils Property Tests', () => {
  /**
   * **Feature: category-page-redesign, Property 1: Category Filtering Preserves Valid Categories**
   * **Validates: Requirements 1.1, 1.2**
   *
   * *For any* set of categories, the filtering function SHALL return only categories where:
   * - `toolCount` is greater than 0
   * - Name does not contain "Test" (case-insensitive)
   * - Name does not match timestamp patterns (sequences of 10+ digits)
   * - Name is not a random character string (length >= 3)
   */
  describe('Property 1: Category Filtering Preserves Valid Categories', () => {
    // Arbitrary for generating valid category names (no "test", no timestamps, length >= 3)
    const validCategoryNameArb = fc
      .stringMatching(/^[A-Za-z][A-Za-z &-]{2,30}$/)
      .filter((name) => {
        const lower = name.toLowerCase();
        return !lower.includes('test') && !/\d{10,}/.test(name) && !/^\d+$/.test(name);
      });

    // Arbitrary for generating invalid category names containing "test"
    const testNameArb = fc
      .tuple(
        fc.stringMatching(/^[A-Za-z]{0,5}$/),
        fc.constantFrom('test', 'Test', 'TEST', 'testing', 'Testing'),
        fc.stringMatching(/^[A-Za-z]{0,5}$/)
      )
      .map(([prefix, test, suffix]) => `${prefix}${test}${suffix}`);

    // Arbitrary for generating timestamp-like names
    const timestampNameArb = fc
      .tuple(
        fc.stringMatching(/^[A-Za-z]{0,5}$/),
        fc.stringMatching(/^\d{10,15}$/),
        fc.stringMatching(/^[A-Za-z]{0,5}$/)
      )
      .map(([prefix, timestamp, suffix]) => `${prefix}${timestamp}${suffix}`);

    // Arbitrary for generating short names (length < 3)
    const shortNameArb = fc.stringMatching(/^[A-Za-z]{1,2}$/);

    // Arbitrary for generating purely numeric names
    const numericNameArb = fc.stringMatching(/^\d{1,10}$/);

    // Arbitrary for generating positive tool counts
    const positiveToolCountArb = fc.integer({ min: 1, max: 100000 });

    // Arbitrary for generating zero or negative tool counts
    const zeroOrNegativeToolCountArb = fc.integer({ min: -100, max: 0 });

    // Helper to create a category object
    const createCategory = (name: string, toolCount: number): Category => ({
      id: fc.sample(fc.uuid(), 1)[0],
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      count: toolCount,
      toolCount,
    });

    it('should accept categories with valid names and positive tool counts (property test with 100 runs)', () => {
      fc.assert(
        fc.property(validCategoryNameArb, positiveToolCountArb, (name, toolCount) => {
          const category = createCategory(name, toolCount);
          const result = isValidCategory(category);
          expect(result).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject categories with zero or negative tool counts (property test with 100 runs)', () => {
      fc.assert(
        fc.property(validCategoryNameArb, zeroOrNegativeToolCountArb, (name, toolCount) => {
          const category = createCategory(name, toolCount);
          const result = isValidCategory(category);
          expect(result).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject categories with "test" in name (property test with 100 runs)', () => {
      fc.assert(
        fc.property(testNameArb, positiveToolCountArb, (name, toolCount) => {
          const category = createCategory(name, toolCount);
          const result = isValidCategory(category);
          expect(result).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject categories with timestamp patterns in name (property test with 100 runs)', () => {
      fc.assert(
        fc.property(timestampNameArb, positiveToolCountArb, (name, toolCount) => {
          const category = createCategory(name, toolCount);
          const result = isValidCategory(category);
          expect(result).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject categories with short names (length < 3) (property test with 100 runs)', () => {
      fc.assert(
        fc.property(shortNameArb, positiveToolCountArb, (name, toolCount) => {
          const category = createCategory(name, toolCount);
          const result = isValidCategory(category);
          expect(result).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject categories with purely numeric names (property test with 100 runs)', () => {
      fc.assert(
        fc.property(numericNameArb, positiveToolCountArb, (name, toolCount) => {
          const category = createCategory(name, toolCount);
          const result = isValidCategory(category);
          expect(result).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: category-page-redesign, Property 2: Tool Count Formatting**
   * **Validates: Requirements 2.2, 3.3**
   *
   * *For any* positive integer representing a tool count, the formatting function SHALL produce a string with:
   * - Thousands separators (commas)
   * - The word "tools" appended (or "tool" for count of 1)
   */
  describe('Property 2: Tool Count Formatting', () => {
    // Arbitrary for generating positive integers
    const positiveIntArb = fc.integer({ min: 0, max: 10000000 });

    it('should format numbers with thousands separators and correct suffix (property test with 100 runs)', () => {
      fc.assert(
        fc.property(positiveIntArb, (count) => {
          const result = formatToolCount(count);

          // Check that the result contains the formatted number
          const expectedNumber = count.toLocaleString('en-US');
          expect(result).toContain(expectedNumber);

          // Check correct suffix
          if (count === 1) {
            expect(result).toMatch(/\btool$/);
            expect(result).not.toMatch(/\btools$/);
          } else {
            expect(result).toMatch(/\btools$/);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should always produce a string with number followed by space and suffix (property test with 100 runs)', () => {
      fc.assert(
        fc.property(positiveIntArb, (count) => {
          const result = formatToolCount(count);

          // Result should match pattern: "number tool(s)"
          expect(result).toMatch(/^[\d,]+ tools?$/);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: category-page-redesign, Property 3: Category Link Generation**
   * **Validates: Requirements 3.5**
   *
   * *For any* category with a valid slug, the generated navigation link SHALL be exactly
   * `/category/{slug}` where `{slug}` is the category's slug property.
   */
  describe('Property 3: Category Link Generation', () => {
    // Arbitrary for generating valid slugs (lowercase, alphanumeric with hyphens)
    const validSlugArb = fc.stringMatching(/^[a-z][a-z0-9-]{2,30}$/);

    it('should generate links in format /category/{slug} (property test with 100 runs)', () => {
      fc.assert(
        fc.property(validSlugArb, (slug) => {
          const result = generateCategoryLink(slug);

          // Check exact format
          expect(result).toBe(`/category/${slug}`);
        }),
        { numRuns: 100 }
      );
    });

    it('should always start with /category/ prefix (property test with 100 runs)', () => {
      fc.assert(
        fc.property(validSlugArb, (slug) => {
          const result = generateCategoryLink(slug);

          expect(result).toMatch(/^\/category\//);
          expect(result.endsWith(slug)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: category-page-redesign, Property 4: Search Filter Case-Insensitivity**
   * **Validates: Requirements 5.1, 5.2**
   *
   * *For any* search term and set of categories, the filter function SHALL return all and only
   * categories whose names contain the search term, regardless of case.
   */
  describe('Property 4: Search Filter Case-Insensitivity', () => {
    // Arbitrary for generating category names
    const categoryNameArb = fc.stringMatching(/^[A-Za-z][A-Za-z &-]{2,20}$/);

    // Helper to create a category
    const createCategory = (name: string): Category => ({
      id: fc.sample(fc.uuid(), 1)[0],
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      count: 10,
      toolCount: 10,
    });

    it('should match regardless of case in search term (property test with 100 runs)', () => {
      fc.assert(
        fc.property(categoryNameArb, (name) => {
          const category = createCategory(name);
          const categories = [category];

          // Search with lowercase
          const lowerResult = filterCategoriesBySearch(categories, name.toLowerCase());
          // Search with uppercase
          const upperResult = filterCategoriesBySearch(categories, name.toUpperCase());
          // Search with original case
          const originalResult = filterCategoriesBySearch(categories, name);

          // All should return the same category
          expect(lowerResult).toHaveLength(1);
          expect(upperResult).toHaveLength(1);
          expect(originalResult).toHaveLength(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should return only categories containing the search term (property test with 100 runs)', () => {
      // Generate search terms that are purely alphabetic (no spaces/special chars)
      const searchTermArb = fc.stringMatching(/^[A-Za-z]{1,5}$/);

      fc.assert(
        fc.property(
          fc.array(categoryNameArb, { minLength: 1, maxLength: 10 }),
          searchTermArb,
          (names, searchTerm) => {
            const categories = names.map(createCategory);

            const result = filterCategoriesBySearch(categories, searchTerm);

            // All results should contain the search term (case-insensitive)
            result.forEach((cat) => {
              expect(cat.name.toLowerCase()).toContain(searchTerm.toLowerCase());
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: category-page-redesign, Property 5: Search Clear Round-Trip**
   * **Validates: Requirements 5.4**
   *
   * *For any* initial set of filtered categories, applying a search filter and then clearing
   * the search (empty string) SHALL restore the exact original set of categories.
   */
  describe('Property 5: Search Clear Round-Trip', () => {
    // Arbitrary for generating category names
    const categoryNameArb = fc.stringMatching(/^[A-Za-z][A-Za-z &-]{2,20}$/);

    // Helper to create a category
    const createCategory = (name: string, index: number): Category => ({
      id: `cat-${index}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      count: 10,
      toolCount: 10,
    });

    it('should restore original categories when search is cleared (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.array(categoryNameArb, { minLength: 1, maxLength: 10 }),
          fc.stringMatching(/^[A-Za-z]{1,5}$/),
          (names, searchTerm) => {
            const categories = names.map((name, i) => createCategory(name, i));

            // Apply search filter
            const filtered = filterCategoriesBySearch(categories, searchTerm);

            // Clear search (empty string)
            const restored = filterCategoriesBySearch(categories, '');

            // Restored should equal original
            expect(restored).toHaveLength(categories.length);
            expect(restored.map((c) => c.id)).toEqual(categories.map((c) => c.id));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all categories when search is whitespace only (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.array(categoryNameArb, { minLength: 1, maxLength: 10 }),
          fc.constantFrom('', ' ', '  ', '\t', '\n'),
          (names, emptySearch) => {
            const categories = names.map((name, i) => createCategory(name, i));

            const result = filterCategoriesBySearch(categories, emptySearch);

            // Should return all categories
            expect(result).toHaveLength(categories.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
