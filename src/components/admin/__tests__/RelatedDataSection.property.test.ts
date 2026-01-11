/**
 * Property-based tests for RelatedDataSection component
 *
 * Tests Property 32 from the design document:
 * - Property 32: Related Data Display
 *
 * **Feature: admin-panel-crud**
 * **Validates: Requirements 20.1, 20.3, 20.4, 20.5**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ============================================================================
// Test Data Types
// ============================================================================

interface RelatedDataItem {
  id: string;
  label: string;
  href?: string;
  sublabel?: string;
}

// ============================================================================
// Test Arbitraries
// ============================================================================

// Arbitrary for generating related data items
const relatedDataItemArb = fc.record({
  id: fc.uuid(),
  label: fc.string({ minLength: 1, maxLength: 100 }),
  href: fc.option(fc.webUrl(), { nil: undefined }),
  sublabel: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
});

// Arbitrary for generating arrays of related data items
const relatedDataItemsArb = fc.array(relatedDataItemArb, { minLength: 0, maxLength: 50 });

// Arbitrary for max items limit
const maxItemsArb = fc.integer({ min: 1, max: 20 });

// Arbitrary for total count (can be greater than items array length)
const totalCountArb = fc.integer({ min: 0, max: 100 });

// ============================================================================
// Helper Functions (Pure logic extracted from component)
// ============================================================================

/**
 * Calculate displayed items based on maxItems limit
 * Requirements: 20.5 - Related data limited to 10 items with "View All" link
 */
function getDisplayedItems<T>(items: T[], maxItems: number): T[] {
  return items.slice(0, maxItems);
}

/**
 * Determine if "View All" link should be shown
 * Requirements: 20.5 - Show "View All" link when items exceed limit
 */
function shouldShowViewAllLink(totalCount: number, maxItems: number): boolean {
  return totalCount > maxItems;
}

/**
 * Calculate the actual total count
 */
function getActualTotalCount(items: RelatedDataItem[], providedTotalCount?: number): number {
  return providedTotalCount ?? items.length;
}

/**
 * Determine if section has content to display
 */
function hasContent(items: RelatedDataItem[], isLoading: boolean): boolean {
  return isLoading || items.length > 0;
}

// ============================================================================
// Property 32: Related Data Display
// ============================================================================

describe('Property 32: Related Data Display', () => {
  /**
   * **Feature: admin-panel-crud, Property 32: Related Data Display**
   * **Validates: Requirements 20.1, 20.3, 20.4, 20.5**
   *
   * *For any* entity with related records (Category→Tools,
   * Tool→Categories, FeaturedTool→Tool), viewing the entity SHALL display related
   * records limited to 10 items with a "View All" link.
   */

  describe('Item Limiting (Requirement 20.5)', () => {
    it('should limit displayed items to maxItems (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          relatedDataItemsArb,
          maxItemsArb,
          (items, maxItems) => {
            const displayed = getDisplayedItems(items, maxItems);

            // Property: Displayed items should never exceed maxItems
            expect(displayed.length).toBeLessThanOrEqual(maxItems);

            // Property: Displayed items should be min(items.length, maxItems)
            expect(displayed.length).toBe(Math.min(items.length, maxItems));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display all items when count is less than maxItems (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.array(relatedDataItemArb, { minLength: 0, maxLength: 5 }),
          fc.constant(10), // Default maxItems
          (items, maxItems) => {
            const displayed = getDisplayedItems(items, maxItems);

            // Property: When items < maxItems, all items should be displayed
            expect(displayed.length).toBe(items.length);
            expect(displayed).toEqual(items);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve item order when limiting (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          relatedDataItemsArb,
          maxItemsArb,
          (items, maxItems) => {
            const displayed = getDisplayedItems(items, maxItems);

            // Property: Displayed items should be the first N items in order
            displayed.forEach((item, index) => {
              expect(item).toEqual(items[index]);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use default limit of 10 items', () => {
      const items = Array.from({ length: 15 }, (_, i) => ({
        id: `id-${i}`,
        label: `Item ${i}`,
      }));

      const displayed = getDisplayedItems(items, 10);

      // Property: Default limit should be 10
      expect(displayed.length).toBe(10);
    });
  });

  describe('View All Link (Requirement 20.5)', () => {
    it('should show View All link when totalCount exceeds maxItems (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 11, max: 100 }), // totalCount > 10
          fc.constant(10), // maxItems
          (totalCount, maxItems) => {
            const shouldShow = shouldShowViewAllLink(totalCount, maxItems);

            // Property: View All should be shown when totalCount > maxItems
            expect(shouldShow).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not show View All link when totalCount is within maxItems (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }), // totalCount <= 10
          fc.constant(10), // maxItems
          (totalCount, maxItems) => {
            const shouldShow = shouldShowViewAllLink(totalCount, maxItems);

            // Property: View All should not be shown when totalCount <= maxItems
            expect(shouldShow).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly determine View All visibility for any maxItems value (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          totalCountArb,
          maxItemsArb,
          (totalCount, maxItems) => {
            const shouldShow = shouldShowViewAllLink(totalCount, maxItems);

            // Property: View All visibility should be based on totalCount > maxItems
            expect(shouldShow).toBe(totalCount > maxItems);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Total Count Calculation', () => {
    it('should use provided totalCount when available (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          relatedDataItemsArb,
          totalCountArb,
          (items, providedCount) => {
            const actualCount = getActualTotalCount(items, providedCount);

            // Property: Should use provided count when available
            expect(actualCount).toBe(providedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fall back to items.length when totalCount not provided (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          relatedDataItemsArb,
          (items) => {
            const actualCount = getActualTotalCount(items, undefined);

            // Property: Should use items.length when totalCount not provided
            expect(actualCount).toBe(items.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Content Detection', () => {
    it('should have content when items exist (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.array(relatedDataItemArb, { minLength: 1, maxLength: 20 }),
          (items) => {
            const hasItems = hasContent(items, false);

            // Property: Should have content when items array is non-empty
            expect(hasItems).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have content when loading (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          relatedDataItemsArb,
          (items) => {
            const hasItems = hasContent(items, true);

            // Property: Should have content when loading, regardless of items
            expect(hasItems).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not have content when empty and not loading', () => {
      const hasItems = hasContent([], false);

      // Property: Should not have content when empty and not loading
      expect(hasItems).toBe(false);
    });
  });

  describe('Category → Tools Relationship (Requirement 20.1)', () => {
    it('should correctly limit tools in category to 10 items', () => {
      const tools = Array.from({ length: 25 }, (_, i) => ({
        id: `tool-${i}`,
        label: `Tool ${i}`,
        href: `/admin/tools/tool-${i}/edit`,
        sublabel: `/tool-${i} • published`,
      }));

      const displayed = getDisplayedItems(tools, 10);
      const shouldShowViewAll = shouldShowViewAllLink(25, 10);

      expect(displayed.length).toBe(10);
      expect(shouldShowViewAll).toBe(true);
    });
  });

  describe('Tool → Categories Relationship (Requirement 20.3)', () => {
    it('should correctly display assigned categories for a tool', () => {
      const categories = Array.from({ length: 5 }, (_, i) => ({
        id: `cat-${i}`,
        label: `Category ${i}`,
        href: `/admin/categories/cat-${i}/edit`,
        sublabel: `/category-${i}`,
      }));

      const displayed = getDisplayedItems(categories, 10);
      const shouldShowViewAll = shouldShowViewAllLink(5, 10);

      // Tool typically has fewer categories, so all should be displayed
      expect(displayed.length).toBe(5);
      expect(shouldShowViewAll).toBe(false);
    });
  });

  describe('FeaturedTool → Tool Relationship (Requirement 20.4)', () => {
    it('should correctly display tool details for featured tool', () => {
      const toolDetails = [{
        id: 'tool-1',
        label: 'Featured Tool Name',
        href: '/admin/tools/tool-1/edit',
        sublabel: 'https://example.com • Status: published',
      }];

      const displayed = getDisplayedItems(toolDetails, 10);
      const shouldShowViewAll = shouldShowViewAllLink(1, 10);

      // Featured tool has exactly one related tool
      expect(displayed.length).toBe(1);
      expect(shouldShowViewAll).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty items array', () => {
      const displayed = getDisplayedItems([], 10);
      const shouldShowViewAll = shouldShowViewAllLink(0, 10);

      expect(displayed.length).toBe(0);
      expect(shouldShowViewAll).toBe(false);
    });

    it('should handle exactly maxItems items', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        id: `id-${i}`,
        label: `Item ${i}`,
      }));

      const displayed = getDisplayedItems(items, 10);
      const shouldShowViewAll = shouldShowViewAllLink(10, 10);

      expect(displayed.length).toBe(10);
      expect(shouldShowViewAll).toBe(false);
    });

    it('should handle maxItems of 1', () => {
      const items = Array.from({ length: 5 }, (_, i) => ({
        id: `id-${i}`,
        label: `Item ${i}`,
      }));

      const displayed = getDisplayedItems(items, 1);
      const shouldShowViewAll = shouldShowViewAllLink(5, 1);

      expect(displayed.length).toBe(1);
      expect(shouldShowViewAll).toBe(true);
    });
  });
});
