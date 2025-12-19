/**
 * Category mapper functions for transforming between database rows and application types.
 * Handles snake_case to camelCase conversion and default value application.
 *
 * @module category.mapper
 */

import type {
  CategoryRow,
  CategoryInsert,
  CategoryWithToolCount,
} from '../repositories/categories.repository';
import type { Category } from '@/lib/types/tool';

/**
 * Default values applied when database columns are null.
 * These ensure the application always has valid data to work with.
 */
export const CATEGORY_DEFAULTS = {
  description: '',
  icon: '',
  toolCount: 0,
  displayOrder: 0,
} as const;

/**
 * Maps a database category row (snake_case) to an application Category type (camelCase).
 * Applies default values for null fields.
 *
 * @param row - Database row with snake_case columns
 * @returns Application Category object with camelCase properties
 *
 * @example
 * ```ts
 * const row = await categoriesRepo.findBySlug('ai-chatbots');
 * const category = mapCategoryRowToCategory(row);
 * console.log(category.toolCount); // camelCase property
 * ```
 */
export function mapCategoryRowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? CATEGORY_DEFAULTS.description,
    count: row.tool_count ?? CATEGORY_DEFAULTS.toolCount,
    toolCount: row.tool_count ?? CATEGORY_DEFAULTS.toolCount,
  };
}

/**
 * Maps a database category row with computed tool count to an application Category type.
 * Uses the computed_tool_count from the joined query instead of the stored tool_count.
 *
 * @param row - Database row with snake_case columns and computed tool count
 * @returns Application Category object with accurate tool count
 *
 * @example
 * ```ts
 * const rows = await categoriesRepo.findWithToolCount();
 * const categories = rows.map(mapCategoryWithToolCount);
 * console.log(categories[0].toolCount); // Computed from junction table
 * ```
 */
export function mapCategoryWithToolCount(row: CategoryWithToolCount): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? CATEGORY_DEFAULTS.description,
    count: row.computed_tool_count ?? CATEGORY_DEFAULTS.toolCount,
    toolCount: row.computed_tool_count ?? CATEGORY_DEFAULTS.toolCount,
  };
}

/**
 * Maps an application Category object (camelCase) to a database insert type (snake_case).
 * Used when creating or updating categories in the database.
 *
 * @param category - Application Category object (without id)
 * @returns Database insert object with snake_case columns
 *
 * @example
 * ```ts
 * const categoryData = { name: 'AI Chatbots', slug: 'ai-chatbots' };
 * const insert = mapCategoryToInsert(categoryData);
 * await categoriesRepo.create(insert);
 * ```
 */
export function mapCategoryToInsert(
  category: Omit<Category, 'id' | 'count'>
): CategoryInsert {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description || null,
    tool_count: category.toolCount ?? null,
  };
}

/**
 * Maps an application Category update object (camelCase) to a database update type (snake_case).
 * Only includes fields that are present in the update object.
 *
 * @param updates - Partial Category object with fields to update
 * @returns Database update object with snake_case columns
 *
 * @example
 * ```ts
 * const updates = { name: 'AI Assistants', toolCount: 50 };
 * const dbUpdates = mapCategoryToUpdate(updates);
 * await categoriesRepo.update(categoryId, dbUpdates);
 * ```
 */
export function mapCategoryToUpdate(
  updates: Partial<Omit<Category, 'id' | 'count'>>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (updates.name !== undefined) result.name = updates.name;
  if (updates.slug !== undefined) result.slug = updates.slug;
  if (updates.description !== undefined) result.description = updates.description || null;
  if (updates.toolCount !== undefined) result.tool_count = updates.toolCount;

  return result;
}
