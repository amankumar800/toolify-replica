/**
 * Featured tools repository with specialized queries for the featured_tools table.
 * Extends base repository with featured tool-specific operations.
 *
 * @module featured-tools.repository
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  FeaturedToolRow as GeneratedFeaturedToolRow,
  FeaturedToolInsert as GeneratedFeaturedToolInsert,
  FeaturedToolUpdate as GeneratedFeaturedToolUpdate,
} from '@/lib/supabase/types';
import { DatabaseError } from '../errors';
import { TABLES } from '../constants/tables';
import {
  createBaseRepository,
  type BaseRepository,
} from './base.repository';
import type { ToolRow } from './tools.repository';

/**
 * Featured tool row type from database.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type FeaturedToolRow = GeneratedFeaturedToolRow & { [key: string]: unknown };

/**
 * Featured tool insert type for creating new featured tools.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type FeaturedToolInsert = GeneratedFeaturedToolInsert & { [key: string]: unknown };

/**
 * Featured tool update type for partial updates.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type FeaturedToolUpdate = GeneratedFeaturedToolUpdate & { [key: string]: unknown };

/**
 * Featured tool with joined tool data.
 */
export interface FeaturedToolWithTool extends FeaturedToolRow {
  tool: ToolRow;
}


/**
 * Featured tools repository interface extending base repository.
 */
export interface FeaturedToolsRepository
  extends BaseRepository<FeaturedToolRow, FeaturedToolInsert, FeaturedToolUpdate> {
  /** Find all featured tools with their tool data, ordered by display_order */
  findAllWithTools(): Promise<FeaturedToolWithTool[]>;
  /** Reorder featured tools by updating display_order for each tool ID */
  reorder(toolIds: string[]): Promise<void>;
}

/**
 * Creates a featured tools repository with specialized queries.
 *
 * @param supabase - Supabase client instance
 * @returns Featured tools repository with CRUD and specialized operations
 *
 * @example
 * ```ts
 * const featuredToolsRepo = createFeaturedToolsRepository(supabase);
 * const featured = await featuredToolsRepo.findAllWithTools();
 * ```
 */
export function createFeaturedToolsRepository(
  supabase: SupabaseClient<Database>
): FeaturedToolsRepository {
  const tableName = TABLES.FEATURED_TOOLS;
  const baseRepo = createBaseRepository<FeaturedToolRow, FeaturedToolInsert, FeaturedToolUpdate>(
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

    async findAllWithTools(): Promise<FeaturedToolWithTool[]> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select(`
          *,
          tools (*)
        `)
        .order('display_order', { ascending: true });

      if (error) {
        throw wrapError(error, 'findAllWithTools');
      }

      // Transform the nested structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data ?? []) as any[])
        .map((row: Record<string, unknown>) => {
          const tool = row.tools as ToolRow | null;
          if (!tool) {
            return null;
          }

          // Remove tools from the row and add as tool property
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { tools: _, ...featuredToolRow } = row;
          return {
            ...featuredToolRow,
            tool,
          } as FeaturedToolWithTool;
        })
        .filter((item): item is FeaturedToolWithTool => item !== null);
    },

    async reorder(toolIds: string[]): Promise<void> {
      // Update display_order for each featured tool based on position in array
      const updates = toolIds.map((toolId, index) => ({
        tool_id: toolId,
        display_order: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from(tableName as any)
          .update({ display_order: update.display_order })
          .eq('tool_id', update.tool_id);

        if (error) {
          throw wrapError(error, 'reorder');
        }
      }
    },
  };
}
