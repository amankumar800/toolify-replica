/**
 * Property-Based Tests for Category Page Breadcrumb Navigation
 * 
 * **Feature: free-ai-tools, Property 10: Breadcrumb Navigation Accuracy**
 * **Validates: Requirements 21.5**
 * 
 * For any category page, the breadcrumb navigation SHALL display the path
 * "Home > Free AI Tools > [Category Name]" where [Category Name] matches
 * the current category's display name.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// =============================================================================
// Breadcrumb Generation Logic (extracted for testing)
// =============================================================================

/**
 * Represents a breadcrumb item
 */
interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Generates breadcrumb items for a category page
 * This is the pure function that we test
 * 
 * @param categoryName - The display name of the category
 * @returns Array of breadcrumb items
 */
export function generateCategoryBreadcrumbs(categoryName: string): BreadcrumbItem[] {
  return [
    { label: 'Free AI Tools', href: '/free-ai-tools' },
    { label: categoryName }, // Current page - not linked
  ];
}

/**
 * Validates that breadcrumb items follow the expected structure
 * 
 * @param items - Array of breadcrumb items
 * @param expectedCategoryName - The expected category name
 * @returns true if valid, false otherwise
 */
export function validateBreadcrumbStructure(
  items: BreadcrumbItem[],
  expectedCategoryName: string
): boolean {
  // Must have exactly 2 items (Home is added by Breadcrumb component)
  if (items.length !== 2) return false;
  
  // First item must be "Free AI Tools" with correct href
  if (items[0].label !== 'Free AI Tools') return false;
  if (items[0].href !== '/free-ai-tools') return false;
  
  // Second item must be the category name without href (current page)
  if (items[1].label !== expectedCategoryName) return false;
  if (items[1].href !== undefined) return false;
  
  return true;
}

/**
 * Extracts the category name from breadcrumb items
 * 
 * @param items - Array of breadcrumb items
 * @returns The category name from the last breadcrumb item
 */
export function extractCategoryNameFromBreadcrumbs(items: BreadcrumbItem[]): string | null {
  if (items.length < 2) return null;
  return items[items.length - 1].label;
}

// =============================================================================
// Arbitraries (Generators) for Property-Based Testing
// =============================================================================

/**
 * Generates valid category names
 * Category names are non-empty strings that may contain:
 * - Letters, numbers, spaces
 * - Special characters like &, -, /
 */
const categoryNameArbitrary = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0)
  .map((s) => s.trim());

// =============================================================================
// Property-Based Tests
// =============================================================================

describe('Free AI Tools - Breadcrumb Navigation Accuracy', () => {
  /**
   * **Feature: free-ai-tools, Property 10: Breadcrumb Navigation Accuracy**
   * **Validates: Requirements 21.5**
   * 
   * For any category page, the breadcrumb navigation SHALL display the path
   * "Home > Free AI Tools > [Category Name]" where [Category Name] matches
   * the current category's display name.
   */

  it('breadcrumb items contain the exact category name', () => {
    fc.assert(
      fc.property(categoryNameArbitrary, (categoryName) => {
        // Generate breadcrumbs for the category
        const breadcrumbs = generateCategoryBreadcrumbs(categoryName);
        
        // Extract the category name from breadcrumbs
        const extractedName = extractCategoryNameFromBreadcrumbs(breadcrumbs);
        
        // The extracted name should match the input category name exactly
        expect(extractedName).toBe(categoryName);
      }),
      { numRuns: 100 }
    );
  });

  it('breadcrumb structure is valid for any category', () => {
    fc.assert(
      fc.property(categoryNameArbitrary, (categoryName) => {
        // Generate breadcrumbs for the category
        const breadcrumbs = generateCategoryBreadcrumbs(categoryName);
        
        // Validate the structure
        const isValid = validateBreadcrumbStructure(breadcrumbs, categoryName);
        
        expect(isValid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('breadcrumb has exactly 2 items (Free AI Tools + Category)', () => {
    fc.assert(
      fc.property(categoryNameArbitrary, (categoryName) => {
        const breadcrumbs = generateCategoryBreadcrumbs(categoryName);
        
        // Should have exactly 2 items
        // (Home is added by the Breadcrumb component itself)
        expect(breadcrumbs).toHaveLength(2);
      }),
      { numRuns: 100 }
    );
  });

  it('first breadcrumb item links to /free-ai-tools', () => {
    fc.assert(
      fc.property(categoryNameArbitrary, (categoryName) => {
        const breadcrumbs = generateCategoryBreadcrumbs(categoryName);
        
        // First item should be "Free AI Tools" with href
        expect(breadcrumbs[0]).toEqual({
          label: 'Free AI Tools',
          href: '/free-ai-tools',
        });
      }),
      { numRuns: 100 }
    );
  });

  it('last breadcrumb item (current page) has no href', () => {
    fc.assert(
      fc.property(categoryNameArbitrary, (categoryName) => {
        const breadcrumbs = generateCategoryBreadcrumbs(categoryName);
        
        // Last item should be the category name without href
        const lastItem = breadcrumbs[breadcrumbs.length - 1];
        expect(lastItem.label).toBe(categoryName);
        expect(lastItem.href).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('breadcrumb preserves special characters in category names', () => {
    // Test with known category names that have special characters
    const specialCategoryNames = [
      'Chatbots & Virtual Companions',
      'Office & Productivity',
      'Image Generation & Editing',
      'AI Detection & Anti-Detection',
      'Interior & Architectural Design',
    ];

    for (const categoryName of specialCategoryNames) {
      const breadcrumbs = generateCategoryBreadcrumbs(categoryName);
      const extractedName = extractCategoryNameFromBreadcrumbs(breadcrumbs);
      
      expect(extractedName).toBe(categoryName);
    }
  });
});
