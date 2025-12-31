/**
 * AI News repository with specialized queries for the ai_news table.
 * Extends base repository with news-specific operations.
 *
 * @module ai-news.repository
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  AINewsRow as GeneratedAINewsRow,
  AINewsInsert as GeneratedAINewsInsert,
  AINewsUpdate as GeneratedAINewsUpdate,
} from '@/lib/supabase/types';
import { DatabaseError } from '../errors';
import { TABLES } from '../constants/tables';
import {
  createBaseRepository,
  type BaseRepository,
} from './base.repository';

/**
 * AI News row type from database.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type AINewsRow = GeneratedAINewsRow & { [key: string]: unknown };

/**
 * AI News insert type for creating new articles.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type AINewsInsert = GeneratedAINewsInsert & { [key: string]: unknown };

/**
 * AI News update type for partial updates.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type AINewsUpdate = GeneratedAINewsUpdate & { [key: string]: unknown };

/**
 * Options for listing AI news articles.
 */
export interface AINewsListOptions {
  /** Filter by category */
  category?: string;
  /** Filter by tags (any match) */
  tags?: string[];
  /** Only show published articles (default: true for public queries) */
  publishedOnly?: boolean;
  /** Maximum number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * AI News repository interface extending base repository.
 */
export interface AINewsRepository
  extends BaseRepository<AINewsRow, AINewsInsert, AINewsUpdate> {
  /** Find an article by its unique slug */
  findBySlug(slug: string): Promise<AINewsRow | null>;
  /** Find published articles ordered by priority and date */
  findPublished(limit?: number): Promise<AINewsRow[]>;
  /** Find articles with filtering options */
  findWithOptions(options?: AINewsListOptions): Promise<AINewsRow[]>;
  /** Find articles by category */
  findByCategory(category: string, limit?: number): Promise<AINewsRow[]>;
  /** Find articles by tag */
  findByTag(tag: string, limit?: number): Promise<AINewsRow[]>;
  /** Find most viewed articles */
  findMostViewed(limit?: number): Promise<AINewsRow[]>;
  /** Find most liked articles */
  findMostLiked(limit?: number): Promise<AINewsRow[]>;
  /** Publish an article */
  publish(articleId: string): Promise<AINewsRow>;
  /** Unpublish an article */
  unpublish(articleId: string): Promise<AINewsRow>;
  /** Increment view count for an article */
  incrementViewCount(articleId: string): Promise<void>;
  /** Increment like count for an article */
  incrementLikeCount(articleId: string): Promise<void>;
  /** Decrement like count for an article */
  decrementLikeCount(articleId: string): Promise<void>;
}


/**
 * Creates an AI news repository with specialized queries.
 *
 * @param supabase - Supabase client instance
 * @returns AI news repository with CRUD and specialized operations
 *
 * @example
 * ```ts
 * const newsRepo = createAINewsRepository(supabase);
 * const articles = await newsRepo.findPublished(10);
 * ```
 */
export function createAINewsRepository(
  supabase: SupabaseClient<Database>
): AINewsRepository {
  const tableName = TABLES.AI_NEWS;
  const baseRepo = createBaseRepository<AINewsRow, AINewsInsert, AINewsUpdate>(
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

    async findBySlug(slug: string): Promise<AINewsRow | null> {
      return baseRepo.findBy('slug' as keyof AINewsRow, slug as AINewsRow[keyof AINewsRow]);
    },

    async findPublished(limit?: number): Promise<AINewsRow[]> {
      // Order by priority_score DESC, published_at DESC (Requirement 10.9)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .eq('is_published', true)
        .order('priority_score', { ascending: false })
        .order('published_at', { ascending: false });

      if (limit !== undefined) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw wrapError(error, 'findPublished');
      }

      return (data ?? []) as unknown as AINewsRow[];
    },

    async findWithOptions(options?: AINewsListOptions): Promise<AINewsRow[]> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*');

      // Apply published filter (default: true)
      const publishedOnly = options?.publishedOnly ?? true;
      if (publishedOnly) {
        query = query.eq('is_published', true);
      }

      // Apply category filter
      if (options?.category) {
        query = query.eq('category', options.category);
      }

      // Apply tags filter (any match)
      if (options?.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
      }

      // Apply ordering (priority_score DESC, published_at DESC)
      query = query
        .order('priority_score', { ascending: false })
        .order('published_at', { ascending: false });

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

      return (data ?? []) as unknown as AINewsRow[];
    },

    async findByCategory(category: string, limit?: number): Promise<AINewsRow[]> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .eq('is_published', true)
        .eq('category', category)
        .order('priority_score', { ascending: false })
        .order('published_at', { ascending: false });

      if (limit !== undefined) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw wrapError(error, 'findByCategory');
      }

      return (data ?? []) as unknown as AINewsRow[];
    },

    async findByTag(tag: string, limit?: number): Promise<AINewsRow[]> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .eq('is_published', true)
        .contains('tags', [tag])
        .order('priority_score', { ascending: false })
        .order('published_at', { ascending: false });

      if (limit !== undefined) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw wrapError(error, 'findByTag');
      }

      return (data ?? []) as unknown as AINewsRow[];
    },

    async findMostViewed(limit?: number): Promise<AINewsRow[]> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .eq('is_published', true)
        .order('view_count', { ascending: false });

      if (limit !== undefined) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw wrapError(error, 'findMostViewed');
      }

      return (data ?? []) as unknown as AINewsRow[];
    },

    async findMostLiked(limit?: number): Promise<AINewsRow[]> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .eq('is_published', true)
        .order('like_count', { ascending: false });

      if (limit !== undefined) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw wrapError(error, 'findMostLiked');
      }

      return (data ?? []) as unknown as AINewsRow[];
    },

    async publish(articleId: string): Promise<AINewsRow> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq('id', articleId)
        .select()
        .single();

      if (error) {
        throw wrapError(error, 'publish');
      }

      return data as unknown as AINewsRow;
    },

    async unpublish(articleId: string): Promise<AINewsRow> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .update({
          is_published: false,
        })
        .eq('id', articleId)
        .select()
        .single();

      if (error) {
        throw wrapError(error, 'unpublish');
      }

      return data as unknown as AINewsRow;
    },

    async incrementViewCount(articleId: string): Promise<void> {
      // Read current count
      const { data: current, error: readError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('view_count')
        .eq('id', articleId)
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
        .eq('id', articleId);

      if (updateError) {
        throw wrapError(updateError, 'incrementViewCount');
      }
    },

    async incrementLikeCount(articleId: string): Promise<void> {
      // Read current count
      const { data: current, error: readError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('like_count')
        .eq('id', articleId)
        .single();

      if (readError) {
        throw wrapError(readError, 'incrementLikeCount');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newCount = ((current as any)?.like_count ?? 0) + 1;

      const { error: updateError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .update({ like_count: newCount })
        .eq('id', articleId);

      if (updateError) {
        throw wrapError(updateError, 'incrementLikeCount');
      }
    },

    async decrementLikeCount(articleId: string): Promise<void> {
      // Read current count
      const { data: current, error: readError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('like_count')
        .eq('id', articleId)
        .single();

      if (readError) {
        throw wrapError(readError, 'decrementLikeCount');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentCount = (current as any)?.like_count ?? 0;
      const newCount = Math.max(0, currentCount - 1);

      const { error: updateError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .update({ like_count: newCount })
        .eq('id', articleId);

      if (updateError) {
        throw wrapError(updateError, 'decrementLikeCount');
      }
    },
  };
}
