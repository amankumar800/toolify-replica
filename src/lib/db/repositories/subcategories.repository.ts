/**
 * Subcategories repository with specialized queries for the subcategories table.
 * Extends base repository with subcategory-specific operations.
 *
 * @module subcategories.repository
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  SubcategoryRow as GeneratedSubcategoryRow,
  SubcategoryInsert as GeneratedSubcategoryInsert,
  SubcategoryUpdate as GeneratedSubcategoryUpdate,
} from '@/lib/supabase/types';
import { DatabaseError } from '../errors';
import { TABLES } from '../constants/tables';
import {
  createBaseRepository,
  type BaseRepository,
} from './base.repository';
import type { ToolRow } from './tools.repository';

/**
 * Subcategory row type from database.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type SubcategoryRow = GeneratedSubcategoryRow & { [key: string]: unknown };

/**
 * Subcategory insert type for creating new subcategories.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type SubcategoryInsert = GeneratedSubcategoryInsert & { [key: string]: unknown };

/**
 * Subcategory update type for partial updates.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type SubcategoryUpdate = GeneratedSubcategoryUpdate & { [key: string]: unknown };

/**
 * Subcategory with its associated tools.
 */
export interface SubcategoryWithTools extends SubcategoryRow {
  tools: ToolRow[];
}


/**
 * Subcategories repository interface extending base repository.
 */
export interface SubcategoriesRepository
  extends BaseRepository<SubcategoryRow, SubcategoryInsert, SubcategoryUpdate> {
  /** Find subcategories by parent category ID, ordered by display_order */
  findByCategory(categoryId: string): Promise<SubcategoryRow[]>;
  /** Find a subcategory with its associated tools */
  findWithTools(subcategoryId: string): Promise<SubcategoryWithTools | null>;
}

/**
 * Creates a subcategories repository with specialized queries.
 *
 * @param supabase - Supabase client instance
 * @returns Subcategories repository with CRUD and specialized operations
 *
 * @example
 * ```ts
 * const subcategoriesRepo = createSubcategoriesRepository(supabase);
 * const subcategories = await subcategoriesRepo.findByCategory(categoryId);
 * ```
 */
export function createSubcategoriesRepository(
  supabase: SupabaseClient<Database>
): SubcategoriesRepository {
  const tableName = TABLES.SUBCATEGORIES;
  const baseRepo = createBaseRepository<SubcategoryRow, SubcategoryInsert, SubcategoryUpdate>(
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

    async findByCategory(categoryId: string): Promise<SubcategoryRow[]> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .eq('category_id', categoryId)
        .order('display_order', { ascending: true });

      if (error) {
        throw wrapError(error, 'findByCategory');
      }

      return (data ?? []) as unknown as SubcategoryRow[];
    },

    async findWithTools(subcategoryId: string): Promise<SubcategoryWithTools | null> {
      // Get the subcategory
      const { data: subcategory, error: subcategoryError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .eq('id', subcategoryId)
        .maybeSingle();

      if (subcategoryError) {
        throw wrapError(subcategoryError, 'findWithTools');
      }

      if (!subcategory) {
        return null;
      }

      // Get tools associated with this subcategory via metadata
      // Note: The schema doesn't have a direct subcategory-tool relationship
      // Tools are linked to categories, not subcategories directly
      // This would need a tool_subcategories junction table or metadata field
      const { data: tools, error: toolsError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(TABLES.TOOLS as any)
        .select('*')
        .contains('metadata', { subcategory_id: subcategoryId });

      if (toolsError) {
        // If the query fails (e.g., no metadata field), return empty tools
        return {
          ...(subcategory as unknown as SubcategoryRow),
          tools: [],
        };
      }

      return {
        ...(subcategory as unknown as SubcategoryRow),
        tools: (tools ?? []) as unknown as ToolRow[],
      };
    },
  };
}
