/**
 * Midjourney prompts repository with specialized queries for the midjourney_prompts table.
 * Extends base repository with prompt-specific operations.
 *
 * @module midjourney-prompts.repository
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  MidjourneyPromptRow as GeneratedMidjourneyPromptRow,
  MidjourneyPromptInsert as GeneratedMidjourneyPromptInsert,
  MidjourneyPromptUpdate as GeneratedMidjourneyPromptUpdate,
  MidjourneyPromptType,
} from '@/lib/supabase/types';
import { DatabaseError } from '../errors';
import { TABLES, PROMPT_TYPES } from '../constants/tables';
import {
  createBaseRepository,
  type BaseRepository,
} from './base.repository';

/**
 * Midjourney prompt row type from database.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type MidjourneyPromptRow = GeneratedMidjourneyPromptRow & { [key: string]: unknown };

/**
 * Midjourney prompt insert type for creating new prompts.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type MidjourneyPromptInsert = GeneratedMidjourneyPromptInsert & { [key: string]: unknown };

/**
 * Midjourney prompt update type for partial updates.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type MidjourneyPromptUpdate = GeneratedMidjourneyPromptUpdate & { [key: string]: unknown };

/**
 * Sort options for midjourney prompts.
 */
export type MidjourneyPromptSortBy = 'created_at' | 'view_count' | 'copy_count';

/**
 * Options for listing midjourney prompts.
 */
export interface MidjourneyPromptListOptions {
  /** Filter by type (sref or prompt) */
  type?: MidjourneyPromptType;
  /** Filter by tags (any match) */
  tags?: string[];
  /** Sort by field */
  sortBy?: MidjourneyPromptSortBy;
  /** Sort direction (default: descending) */
  ascending?: boolean;
  /** Maximum number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Midjourney prompts repository interface extending base repository.
 */
export interface MidjourneyPromptsRepository
  extends BaseRepository<MidjourneyPromptRow, MidjourneyPromptInsert, MidjourneyPromptUpdate> {
  /** Find a prompt by its unique slug */
  findBySlug(slug: string): Promise<MidjourneyPromptRow | null>;
  /** Find prompts by type (sref or prompt) */
  findByType(type: MidjourneyPromptType, limit?: number): Promise<MidjourneyPromptRow[]>;
  /** Find prompts with filtering and sorting options */
  findWithOptions(options?: MidjourneyPromptListOptions): Promise<MidjourneyPromptRow[]>;
  /** Find prompts by tag */
  findByTag(tag: string, limit?: number): Promise<MidjourneyPromptRow[]>;
  /** Find most viewed prompts */
  findMostViewed(limit?: number): Promise<MidjourneyPromptRow[]>;
  /** Find most copied prompts */
  findMostCopied(limit?: number): Promise<MidjourneyPromptRow[]>;
  /** Increment view count for a prompt */
  incrementViewCount(promptId: string): Promise<void>;
  /** Increment copy count for a prompt */
  incrementCopyCount(promptId: string): Promise<void>;
}


/**
 * Creates a midjourney prompts repository with specialized queries.
 *
 * @param supabase - Supabase client instance
 * @returns Midjourney prompts repository with CRUD and specialized operations
 *
 * @example
 * ```ts
 * const promptsRepo = createMidjourneyPromptsRepository(supabase);
 * const srefs = await promptsRepo.findByType('sref');
 * ```
 */
export function createMidjourneyPromptsRepository(
  supabase: SupabaseClient<Database>
): MidjourneyPromptsRepository {
  const tableName = TABLES.MIDJOURNEY_PROMPTS;
  const baseRepo = createBaseRepository<MidjourneyPromptRow, MidjourneyPromptInsert, MidjourneyPromptUpdate>(
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

    async findBySlug(slug: string): Promise<MidjourneyPromptRow | null> {
      return baseRepo.findBy('slug' as keyof MidjourneyPromptRow, slug as MidjourneyPromptRow[keyof MidjourneyPromptRow]);
    },

    async findByType(type: MidjourneyPromptType, limit?: number): Promise<MidjourneyPromptRow[]> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false });

      if (limit !== undefined) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw wrapError(error, 'findByType');
      }

      return (data ?? []) as unknown as MidjourneyPromptRow[];
    },

    async findWithOptions(options?: MidjourneyPromptListOptions): Promise<MidjourneyPromptRow[]> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*');

      // Apply type filter
      if (options?.type) {
        query = query.eq('type', options.type);
      }

      // Apply tags filter (any match)
      if (options?.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
      }

      // Apply sorting
      const sortBy = options?.sortBy ?? 'created_at';
      const ascending = options?.ascending ?? false;
      query = query.order(sortBy, { ascending });

      // Apply pagination
      if (options?.limit !== undefined) {
        const offset = options.offset ?? 0;
        const to = offset + options.limit - 1;
        query = query.range(offset, to);
      }

      const { data, error } = await query;

      if (error) {
        throw wrapError(error, 'findWithOptions');
      }

      return (data ?? []) as unknown as MidjourneyPromptRow[];
    },

    async findByTag(tag: string, limit?: number): Promise<MidjourneyPromptRow[]> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .contains('tags', [tag])
        .order('created_at', { ascending: false });

      if (limit !== undefined) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw wrapError(error, 'findByTag');
      }

      return (data ?? []) as unknown as MidjourneyPromptRow[];
    },

    async findMostViewed(limit?: number): Promise<MidjourneyPromptRow[]> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .order('view_count', { ascending: false });

      if (limit !== undefined) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw wrapError(error, 'findMostViewed');
      }

      return (data ?? []) as unknown as MidjourneyPromptRow[];
    },

    async findMostCopied(limit?: number): Promise<MidjourneyPromptRow[]> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .order('copy_count', { ascending: false });

      if (limit !== undefined) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw wrapError(error, 'findMostCopied');
      }

      return (data ?? []) as unknown as MidjourneyPromptRow[];
    },

    async incrementViewCount(promptId: string): Promise<void> {
      // Read current count
      const { data: current, error: readError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('view_count')
        .eq('id', promptId)
        .single();

      if (readError) {
        throw wrapError(readError, 'incrementViewCount');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newCount = ((current as any)?.view_count ?? 0) + 1;

      const { error: updateError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .update({ view_count: newCount })
        .eq('id', promptId);

      if (updateError) {
        throw wrapError(updateError, 'incrementViewCount');
      }
    },

    async incrementCopyCount(promptId: string): Promise<void> {
      // Read current count
      const { data: current, error: readError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('copy_count')
        .eq('id', promptId)
        .single();

      if (readError) {
        throw wrapError(readError, 'incrementCopyCount');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newCount = ((current as any)?.copy_count ?? 0) + 1;

      const { error: updateError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .update({ copy_count: newCount })
        .eq('id', promptId);

      if (updateError) {
        throw wrapError(updateError, 'incrementCopyCount');
      }
    },
  };
}
