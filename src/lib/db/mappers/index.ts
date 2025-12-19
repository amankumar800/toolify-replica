/**
 * Mappers barrel export
 *
 * This module re-exports all mapper functions for transforming between
 * database rows (snake_case) and application types (camelCase).
 *
 * @module mappers
 *
 * @example
 * ```ts
 * import {
 *   mapToolRowToTool,
 *   mapToolWithCategories,
 *   mapToolToInsert,
 *   mapCategoryRowToCategory,
 *   mapSubcategoryRowToSubcategory,
 * } from '@/lib/db/mappers';
 * ```
 */

// Tool mappers
export {
  mapToolRowToTool,
  mapToolWithCategories,
  mapToolToInsert,
  mapToolToUpdate,
  TOOL_DEFAULTS,
} from './tool.mapper';

// Category mappers
export {
  mapCategoryRowToCategory,
  mapCategoryWithToolCount,
  mapCategoryToInsert,
  mapCategoryToUpdate,
  CATEGORY_DEFAULTS,
} from './category.mapper';

// Subcategory mappers
export {
  mapSubcategoryRowToSubcategory,
  mapSubcategoryWithTools,
  mapSubcategoryToInsert,
  mapSubcategoryToUpdate,
  SUBCATEGORY_DEFAULTS,
  type Subcategory,
  type SubcategoryWithToolsApp,
} from './subcategory.mapper';
