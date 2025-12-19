/**
 * Subcategory mapper functions for transforming between database rows and application types.
 * Handles snake_case to camelCase conversion and default value application.
 *
 * @module subcategory.mapper
 */

import type {
  SubcategoryRow,
  SubcategoryInsert,
  SubcategoryWithTools,
} from '../repositories/subcategories.repository';
import { mapToolRowToTool } from './tool.mapper';
import type { Tool } from '@/lib/types/tool';

/**
 * Application Subcategory type with camelCase properties.
 */
export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  toolCount: number;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Subcategory with its associated tools.
 */
export interface SubcategoryWithToolsApp extends Subcategory {
  tools: Tool[];
}

/**
 * Default values applied when database columns are null.
 * These ensure the application always has valid data to work with.
 */
export const SUBCATEGORY_DEFAULTS = {
  toolCount: 0,
  displayOrder: 0,
} as const;

/**
 * Maps a database subcategory row (snake_case) to an application Subcategory type (camelCase).
 * Applies default values for null fields.
 *
 * @param row - Database row with snake_case columns
 * @returns Application Subcategory object with camelCase properties
 *
 * @example
 * ```ts
 * const rows = await subcategoriesRepo.findByCategory(categoryId);
 * const subcategories = rows.map(mapSubcategoryRowToSubcategory);
 * console.log(subcategories[0].displayOrder); // camelCase property
 * ```
 */
export function mapSubcategoryRowToSubcategory(row: SubcategoryRow): Subcategory {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    toolCount: row.tool_count ?? SUBCATEGORY_DEFAULTS.toolCount,
    displayOrder: row.display_order ?? SUBCATEGORY_DEFAULTS.displayOrder,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

/**
 * Maps a database subcategory row with tools to an application type.
 * Transforms both the subcategory and its associated tools.
 *
 * @param row - Database row with snake_case columns and associated tools
 * @returns Application SubcategoryWithTools object
 *
 * @example
 * ```ts
 * const row = await subcategoriesRepo.findWithTools(subcategoryId);
 * const subcategory = mapSubcategoryWithTools(row);
 * console.log(subcategory.tools); // Array of Tool objects
 * ```
 */
export function mapSubcategoryWithTools(row: SubcategoryWithTools): SubcategoryWithToolsApp {
  const subcategory = mapSubcategoryRowToSubcategory(row);
  const tools = (row.tools ?? []).map(mapToolRowToTool);

  return {
    ...subcategory,
    tools,
  };
}

/**
 * Maps an application Subcategory object (camelCase) to a database insert type (snake_case).
 * Used when creating subcategories in the database.
 *
 * @param subcategory - Application Subcategory object (without id)
 * @returns Database insert object with snake_case columns
 *
 * @example
 * ```ts
 * const subcategoryData = { categoryId: 'cat-123', name: 'Chat Assistants', slug: 'chat-assistants' };
 * const insert = mapSubcategoryToInsert(subcategoryData);
 * await subcategoriesRepo.create(insert);
 * ```
 */
export function mapSubcategoryToInsert(
  subcategory: Omit<Subcategory, 'id' | 'createdAt' | 'updatedAt'>
): SubcategoryInsert {
  return {
    category_id: subcategory.categoryId,
    name: subcategory.name,
    slug: subcategory.slug,
    tool_count: subcategory.toolCount ?? null,
    display_order: subcategory.displayOrder ?? null,
  };
}

/**
 * Maps an application Subcategory update object (camelCase) to a database update type (snake_case).
 * Only includes fields that are present in the update object.
 *
 * @param updates - Partial Subcategory object with fields to update
 * @returns Database update object with snake_case columns
 *
 * @example
 * ```ts
 * const updates = { name: 'AI Chat Assistants', displayOrder: 5 };
 * const dbUpdates = mapSubcategoryToUpdate(updates);
 * await subcategoriesRepo.update(subcategoryId, dbUpdates);
 * ```
 */
export function mapSubcategoryToUpdate(
  updates: Partial<Omit<Subcategory, 'id' | 'createdAt' | 'updatedAt'>>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (updates.categoryId !== undefined) result.category_id = updates.categoryId;
  if (updates.name !== undefined) result.name = updates.name;
  if (updates.slug !== undefined) result.slug = updates.slug;
  if (updates.toolCount !== undefined) result.tool_count = updates.toolCount;
  if (updates.displayOrder !== undefined) result.display_order = updates.displayOrder;

  return result;
}
