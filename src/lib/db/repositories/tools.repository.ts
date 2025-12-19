/**
 * Tools repository with specialized queries for the tools table.
 * Extends base repository with tool-specific operations.
 *
 * @module tools.repository
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  ToolRow as GeneratedToolRow,
  ToolInsert as GeneratedToolInsert,
  ToolUpdate as GeneratedToolUpdate,
} from '@/lib/supabase/types';
import { DatabaseError } from '../errors';
import { TABLES } from '../constants/tables';
import {
  createBaseRepository,
  type BaseRepository,
  type FindAllOptions,
} from './base.repository';

/**
 * Tool row type from database.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type ToolRow = GeneratedToolRow & { [key: string]: unknown };

/**
 * Tool insert type for creating new tools.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type ToolInsert = GeneratedToolInsert & { [key: string]: unknown };

/**
 * Tool update type for partial updates.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type ToolUpdate = GeneratedToolUpdate & { [key: string]: unknown };

/**
 * Tool with joined category names.
 */
export interface ToolWithCategories extends ToolRow {
  categories: { name: string; slug: string }[];
}

/**
 * Tools repository interface extending base repository.
 */
export interface ToolsRepository extends BaseRepository<ToolRow, ToolInsert, ToolUpdate> {
  /** Find a tool by its unique slug */
  findBySlug(slug: string): Promise<ToolRow | null>;
  /** Find tools with their category relationships */
  findWithCategories(options?: FindAllOptions<ToolRow>): Promise<ToolWithCategories[]>;
  /** Find tools belonging to a specific category */
  findByCategory(categorySlug: string, limit?: number): Promise<ToolRow[]>;
  /** Find featured tools */
  findFeatured(limit?: number): Promise<ToolRow[]>;
  /** Search tools by name or description */
  search(query: string, limit?: number): Promise<ToolRow[]>;
  /** Link a tool to a category */
  linkToCategory(toolId: string, categoryId: string): Promise<void>;
  /** Unlink a tool from a category */
  unlinkFromCategory(toolId: string, categoryId: string): Promise<void>;
  /** Bulk upsert tools using slug as conflict column */
  bulkUpsert(tools: ToolInsert[]): Promise<ToolRow[]>;
}


/**
 * Creates a tools repository with specialized queries.
 *
 * @param supabase - Supabase client instance
 * @returns Tools repository with CRUD and specialized operations
 *
 * @example
 * ```ts
 * const toolsRepo = createToolsRepository(supabase);
 * const tool = await toolsRepo.findBySlug('chatgpt');
 * ```
 */
export function createToolsRepository(
  supabase: SupabaseClient<Database>
): ToolsRepository {
  const tableName = TABLES.TOOLS;
  const baseRepo = createBaseRepository<ToolRow, ToolInsert, ToolUpdate>(
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

    async findBySlug(slug: string): Promise<ToolRow | null> {
      return baseRepo.findBy('slug' as keyof ToolRow, slug as ToolRow[keyof ToolRow]);
    },

    async findWithCategories(
      options?: FindAllOptions<ToolRow>
    ): Promise<ToolWithCategories[]> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase.from(tableName as any).select(`
        *,
        tool_categories (
          categories (
            name,
            slug
          )
        )
      `);

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy as string, {
          ascending: options.ascending ?? false,
        });
      }

      // Apply pagination
      if (options?.limit !== undefined) {
        const offset = options.offset ?? 0;
        const to = offset + options.limit - 1;
        query = query.range(offset, to);
      }

      const { data, error } = await query;

      if (error) {
        throw wrapError(error, 'findWithCategories');
      }

      // Transform the nested structure to flat categories array
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data ?? []) as any[]).map((row: Record<string, unknown>) => {
        const toolCategories = row.tool_categories as Array<{
          categories: { name: string; slug: string } | null;
        }> | null;
        
        const categories = (toolCategories ?? [])
          .map((tc) => tc.categories)
          .filter((c): c is { name: string; slug: string } => c !== null);

        // Remove tool_categories from the row and add flattened categories
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { tool_categories: _, ...toolRow } = row;
        return {
          ...toolRow,
          categories,
        } as ToolWithCategories;
      });
    },


    async findByCategory(
      categorySlug: string,
      limit?: number
    ): Promise<ToolRow[]> {
      // First get the category ID from slug
      const { data: category, error: categoryError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(TABLES.CATEGORIES as any)
        .select('id')
        .eq('slug', categorySlug)
        .maybeSingle();

      if (categoryError) {
        throw wrapError(categoryError, 'findByCategory');
      }

      if (!category) {
        return [];
      }

      // Get tool IDs from junction table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const junctionQuery = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(TABLES.TOOL_CATEGORIES as any)
        .select('tool_id')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq('category_id', (category as any).id);

      const { data: toolIds, error: junctionError } = await junctionQuery;

      if (junctionError) {
        throw wrapError(junctionError, 'findByCategory');
      }

      if (!toolIds || toolIds.length === 0) {
        return [];
      }

      // Get tools by IDs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let toolsQuery = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .in('id', (toolIds as any[]).map((t: { tool_id: string }) => t.tool_id));

      if (limit !== undefined) {
        toolsQuery = toolsQuery.limit(limit);
      }

      const { data, error } = await toolsQuery;

      if (error) {
        throw wrapError(error, 'findByCategory');
      }

      return (data ?? []) as unknown as ToolRow[];
    },

    async findFeatured(limit?: number): Promise<ToolRow[]> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false });

      if (limit !== undefined) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw wrapError(error, 'findFeatured');
      }

      return (data ?? []) as unknown as ToolRow[];
    },


    async search(query: string, limit?: number): Promise<ToolRow[]> {
      const searchPattern = `%${query}%`;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let searchQuery = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .or(`name.ilike.${searchPattern},description.ilike.${searchPattern},short_description.ilike.${searchPattern}`)
        .order('name', { ascending: true });

      if (limit !== undefined) {
        searchQuery = searchQuery.limit(limit);
      }

      const { data, error } = await searchQuery;

      if (error) {
        throw wrapError(error, 'search');
      }

      return (data ?? []) as unknown as ToolRow[];
    },

    async linkToCategory(toolId: string, categoryId: string): Promise<void> {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(TABLES.TOOL_CATEGORIES as any)
        .upsert(
          { tool_id: toolId, category_id: categoryId },
          { onConflict: 'tool_id,category_id' }
        );

      if (error) {
        throw wrapError(error, 'linkToCategory');
      }
    },

    async unlinkFromCategory(toolId: string, categoryId: string): Promise<void> {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(TABLES.TOOL_CATEGORIES as any)
        .delete()
        .eq('tool_id', toolId)
        .eq('category_id', categoryId);

      if (error) {
        throw wrapError(error, 'unlinkFromCategory');
      }
    },

    async bulkUpsert(tools: ToolInsert[]): Promise<ToolRow[]> {
      if (tools.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .upsert(tools as Record<string, unknown>[], { onConflict: 'slug' })
        .select();

      if (error) {
        throw wrapError(error, 'bulkUpsert');
      }

      return (data ?? []) as unknown as ToolRow[];
    },
  };
}
