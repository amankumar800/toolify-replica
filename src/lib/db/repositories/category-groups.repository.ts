/**
 * Category Groups repository with specialized queries for the category_groups table.
 * Extends base repository with category group-specific operations.
 *
 * @module category-groups.repository
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { DatabaseError } from '../errors';
import { TABLES } from '../constants/tables';
import {
  createBaseRepository,
  type BaseRepository,
} from './base.repository';

// ============================================================================
// Types
// ============================================================================

/**
 * Category group row type from database.
 */
export type CategoryGroupRow = Database['public']['Tables']['category_groups']['Row'] & {
  [key: string]: unknown;
};

/**
 * Category group insert type for creating new category groups.
 */
export type CategoryGroupInsert = Database['public']['Tables']['category_groups']['Insert'] & {
  [key: string]: unknown;
};

/**
 * Category group update type for partial updates.
 */
export type CategoryGroupUpdate = Database['public']['Tables']['category_groups']['Update'] & {
  [key: string]: unknown;
};

/**
 * Category group with computed category count.
 */
export interface CategoryGroupWithCategoryCount extends CategoryGroupRow {
  category_count: number;
}

/**
 * Category info for deletion prevention check.
 */
export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
}

// ============================================================================
// Repository Interface
// ============================================================================

/**
 * Category Groups repository interface extending base repository.
 */
export interface CategoryGroupsRepository
  extends BaseRepository<CategoryGroupRow, CategoryGroupInsert, CategoryGroupUpdate> {
  /** Find all category groups with computed category counts */
  findAllWithCategoryCount(): Promise<CategoryGroupWithCategoryCount[]>;
  /** Find a category group by name */
  findByName(name: string): Promise<CategoryGroupRow | null>;
  /** Get categories assigned to a group (for deletion prevention) */
  getCategoriesInGroup(groupId: string): Promise<CategoryInfo[]>;
  /** Check if a group can be deleted (has no categories) */
  canDelete(groupId: string): Promise<{ canDelete: boolean; categories: CategoryInfo[] }>;
  /** Update display order for multiple groups (for drag-drop reordering) */
  updateDisplayOrders(orders: { id: string; display_order: number }[]): Promise<void>;
  /** Get the next display order value */
  getNextDisplayOrder(): Promise<number>;
}

// ============================================================================
// Repository Implementation
// ============================================================================

/**
 * Creates a category groups repository with specialized queries.
 *
 * @param supabase - Supabase client instance
 * @returns Category groups repository with CRUD and specialized operations
 *
 * @example
 * ```ts
 * const categoryGroupsRepo = createCategoryGroupsRepository(supabase);
 * const groups = await categoryGroupsRepo.findAllWithCategoryCount();
 * ```
 */
export function createCategoryGroupsRepository(
  supabase: SupabaseClient<Database>
): CategoryGroupsRepository {
  const tableName = TABLES.CATEGORY_GROUPS;
  const baseRepo = createBaseRepository<CategoryGroupRow, CategoryGroupInsert, CategoryGroupUpdate>(
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

    async findAllWithCategoryCount(): Promise<CategoryGroupWithCategoryCount[]> {
      // Get all category groups with their category counts
      const { data, error } = await supabase
        .from(tableName)
        .select(`
          *,
          categories (
            id
          )
        `)
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });

      if (error) {
        throw wrapError(error, 'findAllWithCategoryCount');
      }

      // Transform to include computed category count
      return ((data ?? []) as unknown[]).map((row) => {
        const typedRow = row as Record<string, unknown>;
        const categories = typedRow.categories as Array<{ id: string }> | null;
        const categoryCount = categories?.length ?? 0;

        // Remove categories from the row
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { categories: _, ...groupRow } = typedRow;
        return {
          ...groupRow,
          category_count: categoryCount,
        } as CategoryGroupWithCategoryCount;
      });
    },

    async findByName(name: string): Promise<CategoryGroupRow | null> {
      return baseRepo.findBy('name' as keyof CategoryGroupRow, name as CategoryGroupRow[keyof CategoryGroupRow]);
    },

    async getCategoriesInGroup(groupId: string): Promise<CategoryInfo[]> {
      const { data, error } = await supabase
        .from(TABLES.CATEGORIES)
        .select('id, name, slug')
        .eq('group_id', groupId)
        .order('display_order', { ascending: true });

      if (error) {
        throw wrapError(error, 'getCategoriesInGroup');
      }

      return (data ?? []) as CategoryInfo[];
    },

    async canDelete(groupId: string): Promise<{ canDelete: boolean; categories: CategoryInfo[] }> {
      const categories = await this.getCategoriesInGroup(groupId);
      return {
        canDelete: categories.length === 0,
        categories,
      };
    },

    async updateDisplayOrders(orders: { id: string; display_order: number }[]): Promise<void> {
      // Update each group's display order
      // Using Promise.all for parallel updates
      const updatePromises = orders.map(async ({ id, display_order }) => {
        const { error } = await supabase
          .from(tableName)
          .update({ display_order })
          .eq('id', id);

        if (error) {
          throw wrapError(error, 'updateDisplayOrders');
        }
      });

      await Promise.all(updatePromises);
    },

    async getNextDisplayOrder(): Promise<number> {
      const { data, error } = await supabase
        .from(tableName)
        .select('display_order')
        .order('display_order', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw wrapError(error, 'getNextDisplayOrder');
      }

      const maxOrder = (data as { display_order: number | null } | null)?.display_order ?? 0;
      return maxOrder + 1;
    },
  };
}
