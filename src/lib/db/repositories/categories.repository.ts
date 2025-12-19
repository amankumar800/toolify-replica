/**
 * Categories repository with specialized queries for the categories table.
 * Extends base repository with category-specific operations.
 *
 * @module categories.repository
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  CategoryRow as GeneratedCategoryRow,
  CategoryInsert as GeneratedCategoryInsert,
  CategoryUpdate as GeneratedCategoryUpdate,
} from '@/lib/supabase/types';
import { DatabaseError } from '../errors';
import { TABLES } from '../constants/tables';
import {
  createBaseRepository,
  type BaseRepository,
} from './base.repository';

/**
 * Category row type from database.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type CategoryRow = GeneratedCategoryRow & { [key: string]: unknown };

/**
 * Category insert type for creating new categories.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type CategoryInsert = GeneratedCategoryInsert & { [key: string]: unknown };

/**
 * Category update type for partial updates.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type CategoryUpdate = GeneratedCategoryUpdate & { [key: string]: unknown };

/**
 * Category with computed tool count from junction table.
 */
export interface CategoryWithToolCount extends CategoryRow {
  computed_tool_count: number;
}


/**
 * Categories repository interface extending base repository.
 */
export interface CategoriesRepository
  extends BaseRepository<CategoryRow, CategoryInsert, CategoryUpdate> {
  /** Find a category by its unique slug */
  findBySlug(slug: string): Promise<CategoryRow | null>;
  /** Find all categories with computed tool counts from junction table */
  findWithToolCount(): Promise<CategoryWithToolCount[]>;
  /** Find categories belonging to a specific group */
  findByGroup(groupId: string): Promise<CategoryRow[]>;
}

/**
 * Creates a categories repository with specialized queries.
 *
 * @param supabase - Supabase client instance
 * @returns Categories repository with CRUD and specialized operations
 *
 * @example
 * ```ts
 * const categoriesRepo = createCategoriesRepository(supabase);
 * const category = await categoriesRepo.findBySlug('ai-chatbots');
 * ```
 */
export function createCategoriesRepository(
  supabase: SupabaseClient<Database>
): CategoriesRepository {
  const tableName = TABLES.CATEGORIES;
  const baseRepo = createBaseRepository<CategoryRow, CategoryInsert, CategoryUpdate>(
    supabase,
    tableName
  );

  /**
   * Helper to wrap Supabase errors in DatabaseError.
   */
  function wrapError(error: unknown, operation: string): DatabaseError {
    const message = error instanceof Error ? error.message : String(error);
    return new DatabaseError(operation, tableName, message, error);
  }

  return {
    // Inherit base repository methods
    ...baseRepo,

    async findBySlug(slug: string): Promise<CategoryRow | null> {
      return baseRepo.findBy('slug' as keyof CategoryRow, slug as CategoryRow[keyof CategoryRow]);
    },

    async findWithToolCount(): Promise<CategoryWithToolCount[]> {
      // Get all categories with their tool counts from junction table
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select(`
          *,
          tool_categories (
            tool_id
          )
        `)
        .order('display_order', { ascending: true });

      if (error) {
        throw wrapError(error, 'findWithToolCount');
      }

      // Transform to include computed tool count
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data ?? []) as any[]).map((row: Record<string, unknown>) => {
        const toolCategories = row.tool_categories as Array<{ tool_id: string }> | null;
        const computedToolCount = toolCategories?.length ?? 0;

        // Remove tool_categories from the row
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { tool_categories: _, ...categoryRow } = row;
        return {
          ...categoryRow,
          computed_tool_count: computedToolCount,
        } as CategoryWithToolCount;
      });
    },

    async findByGroup(groupId: string): Promise<CategoryRow[]> {
      // Note: This assumes there's a group_id column or a junction table
      // Based on the schema, categories don't have a direct group_id
      // This would need a category_group_categories junction table
      // For now, return empty array as the relationship isn't defined in schema
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        throw wrapError(error, 'findByGroup');
      }

      // Filter by metadata.group_id if present
      return ((data ?? []) as unknown as CategoryRow[]).filter((cat) => {
        const metadata = cat.metadata as Record<string, unknown> | null;
        return metadata?.group_id === groupId;
      });
    },
  };
}
