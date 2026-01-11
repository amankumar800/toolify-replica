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
  mapToolRowToToolWithWorkflow,
  mapToolWithCategories,
  mapToolToInsert,
  mapToolWithWorkflowToInsert,
  mapToolToUpdate,
  mapToolWorkflowToUpdate,
  TOOL_DEFAULTS,
  type ToolWithWorkflow,
  type ToolWithWorkflowInput,
  type ToolWorkflowUpdateInput,
} from './tool.mapper';

// Category mappers
export {
  mapCategoryRowToCategory,
  mapCategoryRowToCategoryWithGroup,
  mapCategoryWithToolCount,
  mapCategoryWithToolCountAndGroup,
  mapCategoryToInsert,
  mapCategoryToUpdate,
  CATEGORY_DEFAULTS,
  type CategoryInput,
  type CategoryWithGroup,
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
  type SubcategoryInput,
} from './subcategory.mapper';
