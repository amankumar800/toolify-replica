/**
 * Utility functions for Free AI Tools feature
 * These are pure functions that can be used in both server and client components
 */

import type { Subcategory } from '@/lib/types/free-ai-tools';

/**
 * Generate a section ID for a subcategory
 * Used to link navigation items to their corresponding sections
 */
export function getSubcategorySectionId(subcategory: Subcategory): string {
  return `subcategory-${subcategory.id}`;
}
