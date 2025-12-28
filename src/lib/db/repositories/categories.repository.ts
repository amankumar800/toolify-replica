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
 * Category with its parent group information.
 */
export interface CategoryWithGroup extends CategoryRow {
  group: {
    id: string;
    name: string;
    icon_name: string | null;
    display_order: number | null;
  } | null;
}

/**
 * Category with both group and tool count.
 */
export interface CategoryWithGroupAndToolCount extends CategoryWithGroup {
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
  /** Find a category with its group information */
  findWithGroup(categoryId: string): Promise<CategoryWithGroup | null>;
  /** Find all categories with their group information */
  findAllWithGroups(): Promise<CategoryWithGroup[]>;
  /** Find all categories with group info and tool counts */
  findAllWithGroupsAndToolCount(): Promise<CategoryWithGroupAndToolCount[]>;
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
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .eq('group_id', groupId)
        .order('display_order', { ascending: true });

      if (error) {
        throw wrapError(error, 'findByGroup');
      }

      return (data ?? []) as unknown as CategoryRow[];
    },

    async findWithGroup(categoryId: string): Promise<CategoryWithGroup | null> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select(`
          *,
          category_groups (
            id,
            name,
            icon_name,
            display_order
          )
        `)
        .eq('id', categoryId)
        .maybeSingle();

      if (error) {
        throw wrapError(error, 'findWithGroup');
      }

      if (!data) {
        return null;
      }

      // Transform the nested structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = data as any as Record<string, unknown>;
      const group = row.category_groups as {
        id: string;
        name: string;
        icon_name: string | null;
        display_order: number | null;
      } | null;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { category_groups: _, ...categoryRow } = row;
      return {
        ...categoryRow,
        group,
      } as CategoryWithGroup;
    },

    async findAllWithGroups(): Promise<CategoryWithGroup[]> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select(`
          *,
          category_groups (
            id,
            name,
            icon_name,
            display_order
          )
        `)
        .order('display_order', { ascending: true });

      if (error) {
        throw wrapError(error, 'findAllWithGroups');
      }

      // Transform the nested structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data ?? []) as any[]).map((row: Record<string, unknown>) => {
        const group = row.category_groups as {
          id: string;
          name: string;
          icon_name: string | null;
          display_order: number | null;
        } | null;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { category_groups: _, ...categoryRow } = row;
        return {
          ...categoryRow,
          group,
        } as CategoryWithGroup;
      });
    },

    async findAllWithGroupsAndToolCount(): Promise<CategoryWithGroupAndToolCount[]> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select(`
          *,
          category_groups (
            id,
            name,
            icon_name,
            display_order
          ),
          tool_categories (
            tool_id
          )
        `)
        .order('display_order', { ascending: true });

      if (error) {
        throw wrapError(error, 'findAllWithGroupsAndToolCount');
      }

      // Transform the nested structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data ?? []) as any[]).map((row: Record<string, unknown>) => {
        const group = row.category_groups as {
          id: string;
          name: string;
          icon_name: string | null;
          display_order: number | null;
        } | null;

        const toolCategories = row.tool_categories as Array<{ tool_id: string }> | null;
        const computedToolCount = toolCategories?.length ?? 0;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { category_groups: _g, tool_categories: _tc, ...categoryRow } = row;
        return {
          ...categoryRow,
          group,
          computed_tool_count: computedToolCount,
        } as CategoryWithGroupAndToolCount;
      });
    },
  };
}
