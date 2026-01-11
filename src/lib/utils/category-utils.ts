/**
 * Category utility functions for filtering and formatting
 * Used by the category page redesign feature
 */

import type { Category } from '@/lib/types/tool';

/**
 * Validates if a category should be displayed on the category page.
 * Filters out test data, invalid categories, and categories with no tools.
 *
 * Filter criteria:
 * 1. toolCount must be > 0
 * 2. name must exist and have length >= 3
 * 3. name must not contain "test" (case-insensitive)
 * 4. name must not be purely numeric
 * 5. name must not contain timestamp patterns (10+ consecutive digits)
 *
 * @param category - The category to validate
 * @returns true if the category is valid for display, false otherwise
 *
 * Requirements: 1.1, 1.2
 */
export function isValidCategory(category: Category): boolean {
  // 1. Check toolCount > 0 (handle undefined/null)
  const toolCount = category.toolCount ?? category.count ?? 0;
  if (toolCount <= 0) return false;

  // 2. Check name exists and has minimum length
  if (!category.name || category.name.length < 3) return false;

  // 3. Check for "test" in name (case-insensitive)
  const nameLower = category.name.toLowerCase();
  if (nameLower.includes('test')) return false;

  // 4. Check for purely numeric names
  if (/^\d+$/.test(category.name)) return false;

  // 5. Check for timestamp patterns (10+ consecutive digits)
  if (/\d{10,}/.test(category.name)) return false;

  return true;
}

/**
 * Formats a tool count number with thousands separators and appropriate suffix.
 * Examples: 22751 → "22,751 tools", 1 → "1 tool", 0 → "0 tools"
 *
 * @param count - The number of tools
 * @returns Formatted string with count and "tool"/"tools" suffix
 *
 * Requirements: 2.2, 3.3
 */
export function formatToolCount(count: number): string {
  const formattedNumber = count.toLocaleString('en-US');
  const suffix = count === 1 ? 'tool' : 'tools';
  return `${formattedNumber} ${suffix}`;
}

/**
 * Generates a category page link from a slug.
 *
 * @param slug - The category slug
 * @returns The full category page path
 *
 * Requirements: 3.5
 */
export function generateCategoryLink(slug: string): string {
  return `/category/${slug}`;
}

/**
 * Filters categories by search term (case-insensitive name matching).
 * Returns all categories when search is empty.
 *
 * @param categories - Array of categories to filter
 * @param searchTerm - The search term to match against category names
 * @returns Filtered array of categories
 *
 * Requirements: 5.1, 5.2, 5.4
 */
export function filterCategoriesBySearch(
  categories: Category[],
  searchTerm: string
): Category[] {
  const trimmedSearch = searchTerm.trim();
  
  // Return all categories when search is empty
  if (!trimmedSearch) {
    return categories;
  }

  const searchLower = trimmedSearch.toLowerCase();
  return categories.filter((category) =>
    category.name?.toLowerCase().includes(searchLower) ?? false
  );
}
