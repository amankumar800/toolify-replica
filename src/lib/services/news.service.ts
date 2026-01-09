/**
 * AI News Service for Admin Panel
 *
 * Provides CRUD operations for AI news management using Supabase.
 * Handles pagination, filtering, sorting, and bulk operations.
 *
 * @module news.service
 *
 * Requirements: 7.1-7.8
 */

import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAINewsRepository, type AINewsInsert, type AINewsUpdate, type AINewsRow } from '@/lib/db/repositories/ai-news.repository';
import type {
  ListResponse,
  PaginationParams,
  SortParams,
  NewsFilters,
} from '@/lib/services/admin-crud.types';
import { TABLES } from '@/lib/db/constants/tables';
import type { Database } from '@/lib/supabase/types';

/**
 * Creates a static Supabase client for public data fetching.
 * This client doesn't use cookies, making it safe for use inside unstable_cache.
 */
function createStaticClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ============================================================================
// Types
// ============================================================================

/**
 * AI News item for list display
 */
export interface NewsListItem {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  is_published: boolean | null;
  published_at: string | null;
  view_count: number | null;
  like_count: number | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Options for listing news
 */
export interface ListNewsOptions extends PaginationParams, Partial<SortParams> {
  filters?: NewsFilters;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get paginated list of news with filtering and sorting
 *
 * Requirements: 7.1, 7.2, 7.3
 */
export async function listNews(
  options: ListNewsOptions
): Promise<ListResponse<NewsListItem>> {
  const supabase = await createClient();
  const { page, pageSize, sortBy = 'created_at', sortDirection = 'desc', filters = {} } = options;

  // Build query
  let query = supabase
    .from(TABLES.AI_NEWS)
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,slug.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`);
  }

  if (filters.is_published !== undefined) {
    query = query.eq('is_published', filters.is_published);
  }

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortDirection === 'asc' });

  // Apply pagination
  const offset = (page - 1) * pageSize;
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch news: ${error.message}`);
  }

  const news: NewsListItem[] = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    is_published: row.is_published,
    published_at: row.published_at,
    view_count: row.view_count,
    like_count: row.like_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  return {
    data: news,
    pagination: {
      page,
      pageSize,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    },
  };
}

/**
 * Get a single news item by ID
 */
export async function getNewsById(id: string): Promise<AINewsRow | null> {
  const supabase = await createClient();
  const newsRepo = createAINewsRepository(supabase);

  return newsRepo.findById(id);
}

/**
 * Create a new news item
 *
 * Requirements: 7.6, 7.8
 */
export async function createNews(newsData: AINewsInsert): Promise<AINewsRow> {
  const supabase = await createClient();
  const newsRepo = createAINewsRepository(supabase);

  // If publishing, set published_at timestamp
  // Requirements: 7.8 - Auto-set published_at when is_published changes to true
  if (newsData.is_published && !newsData.published_at) {
    newsData.published_at = new Date().toISOString();
  }

  return newsRepo.create(newsData);
}

/**
 * Update an existing news item
 *
 * Requirements: 7.6, 7.8
 */
export async function updateNews(
  id: string,
  newsData: AINewsUpdate,
  previousIsPublished?: boolean
): Promise<AINewsRow> {
  const supabase = await createClient();
  const newsRepo = createAINewsRepository(supabase);

  // If is_published changes from false to true, set published_at
  // Requirements: 7.8 - Auto-set published_at when is_published changes to true
  if (newsData.is_published === true && previousIsPublished === false && !newsData.published_at) {
    newsData.published_at = new Date().toISOString();
  }

  return newsRepo.update(id, newsData);
}

/**
 * Delete a news item
 */
export async function deleteNews(id: string): Promise<void> {
  const supabase = await createClient();
  const newsRepo = createAINewsRepository(supabase);

  await newsRepo.delete(id);
}

/**
 * Publish a news item
 *
 * Requirements: 7.4, 7.8
 */
export async function publishNews(id: string): Promise<AINewsRow> {
  const supabase = await createClient();
  const newsRepo = createAINewsRepository(supabase);

  return newsRepo.publish(id);
}

/**
 * Unpublish a news item
 *
 * Requirements: 7.4
 */
export async function unpublishNews(id: string): Promise<AINewsRow> {
  const supabase = await createClient();
  const newsRepo = createAINewsRepository(supabase);

  return newsRepo.unpublish(id);
}

/**
 * Bulk publish news items
 *
 * Requirements: 7.4
 */
export async function bulkPublishNews(ids: string[]): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from(TABLES.AI_NEWS)
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .in('id', ids);

  if (error) {
    throw new Error(`Failed to bulk publish news: ${error.message}`);
  }
}

/**
 * Bulk unpublish news items
 *
 * Requirements: 7.4
 */
export async function bulkUnpublishNews(ids: string[]): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from(TABLES.AI_NEWS)
    .update({ is_published: false })
    .in('id', ids);

  if (error) {
    throw new Error(`Failed to bulk unpublish news: ${error.message}`);
  }
}

/**
 * Bulk delete news items
 *
 * Requirements: 7.4
 */
export async function bulkDeleteNews(ids: string[]): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from(TABLES.AI_NEWS)
    .delete()
    .in('id', ids);

  if (error) {
    throw new Error(`Failed to bulk delete news: ${error.message}`);
  }
}


// ============================================================================
// Public-Facing News Service (for site pages)
// ============================================================================

/**
 * Time filter options for news queries
 */
export type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'all';

/**
 * News item for public display
 */
export interface PublicNewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  category: string | null;
  source: { name?: string; url?: string } | null;
  published_at: string | null;
  view_count: number | null;
  like_count: number | null;
  priorityScore: number;
  stats?: { views: number; likes: number };
  image?: string | null;
  tags: string[];
  sourceCount?: number;
}

/**
 * Alias for backward compatibility with components
 */
export type NewsItem = PublicNewsItem;

/**
 * Options for fetching all news
 */
interface GetAllNewsOptions {
  page?: number;
  limit?: number;
  filter?: TimeFilter;
  category?: string;
  search?: string;
}

/**
 * Public-facing NewsService class for site pages
 */
export class NewsService {
  /**
   * News item for detail page display
   */
  static mapRowToDetailItem(row: AINewsRow): {
    id: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    category: string;
    tags: string[];
    date: string;
    image: string | null;
    author: { name: string; avatar?: string };
    source: { name?: string; url?: string } | null;
    isPublished: boolean;
  } {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary ?? '',
      content: row.content ?? '',
      category: row.category ?? 'General',
      tags: row.tags ?? [],
      date: row.published_at ?? row.created_at ?? new Date().toISOString(),
      image: null, // ai_news table doesn't have image_url column
      author: {
        name: row.author_name ?? 'AI Tools Book',
        avatar: row.author_avatar ?? undefined,
      },
      source: row.source_name || row.source_url
        ? { name: row.source_name ?? undefined, url: row.source_url ?? undefined }
        : null,
      isPublished: row.is_published ?? false,
    };
  }

  /**
   * Get a news item by its slug for public display
   *
   * By default, only returns published news. When preview=true,
   * returns the news regardless of is_published status (for admin preview functionality).
   *
   * Requirements: 18.2, 18.4 - Preview functionality for news
   *
   * @param slug - URL-friendly identifier
   * @param options - Optional settings including preview mode
   * @returns The news item or null if not found
   */
  static async getNewsBySlug(
    slug: string,
    options: { preview?: boolean } = {}
  ): Promise<{
    id: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    category: string;
    tags: string[];
    date: string;
    image: string | null;
    author: { name: string; avatar?: string };
    source: { name?: string; url?: string } | null;
    isPublished: boolean;
  } | null> {
    const { preview = false } = options;
    
    // Don't cache preview requests
    if (preview) {
      return this.getNewsBySlugInternal(slug, preview);
    }
    
    // Use cached version for public requests
    return cachedGetNewsBySlug(slug);
  }

  /**
   * Internal implementation for getNewsBySlug
   */
  private static async getNewsBySlugInternal(
    slug: string,
    preview: boolean
  ): Promise<{
    id: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    category: string;
    tags: string[];
    date: string;
    image: string | null;
    author: { name: string; avatar?: string };
    source: { name?: string; url?: string } | null;
    isPublished: boolean;
  } | null> {
    // Use static client for cached calls (preview=false), server client for preview
    const supabase = preview ? await createClient() : createStaticClient();

    // Build query
    let query = supabase
      .from(TABLES.AI_NEWS)
      .select('*')
      .eq('slug', slug);

    // Only filter by is_published if not in preview mode
    if (!preview) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to fetch news: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return this.mapRowToDetailItem(data as AINewsRow);
  }

  /**
   * Get related news items (same category, excluding current)
   *
   * @param slug - Current news slug to exclude
   * @param limit - Maximum number of related items
   * @returns Array of related news items in PublicNewsItem format
   */
  static async getRelatedNews(
    slug: string,
    limit = 5
  ): Promise<PublicNewsItem[]> {
    return cachedGetRelatedNews(slug, limit);
  }

  /**
   * Internal implementation for getRelatedNews
   */
  static async getRelatedNewsInternal(
    slug: string,
    limit: number
  ): Promise<PublicNewsItem[]> {
    const supabase = createStaticClient();

    // First get the current news to find its category
    const { data: currentNews } = await supabase
      .from(TABLES.AI_NEWS)
      .select('category')
      .eq('slug', slug)
      .single();

    // Build query for related news
    let query = supabase
      .from(TABLES.AI_NEWS)
      .select('*')
      .eq('is_published', true)
      .neq('slug', slug)
      .order('published_at', { ascending: false })
      .limit(limit);

    // If we found the category, filter by it
    if (currentNews?.category) {
      query = query.eq('category', currentNews.category);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch related news: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      content: row.content,
      category: row.category,
      tags: row.tags ?? [],
      source: row.source_name || row.source_url 
        ? { name: row.source_name ?? undefined, url: row.source_url ?? undefined } 
        : null,
      published_at: row.published_at,
      view_count: row.view_count,
      like_count: row.like_count,
      priorityScore: row.priority_score ?? 0,
      stats: row.view_count || row.like_count 
        ? { views: row.view_count ?? 0, likes: row.like_count ?? 0 }
        : undefined,
    }));
  }

  /**
   * Get all published news with pagination and filtering
   */
  static async getAllNews(options: GetAllNewsOptions = {}): Promise<{
    items: PublicNewsItem[];
    total: number;
    hasMore: boolean;
  }> {
    const { page = 1, limit = 8, filter = 'weekly', category, search } = options;
    
    // Don't cache search queries (too many variations)
    if (search) {
      return this.getAllNewsInternal(page, limit, filter, category, search);
    }
    
    // Use cached version for non-search queries
    return cachedGetAllNews(page, limit, filter, category);
  }

  /**
   * Internal implementation for getAllNews
   */
  static async getAllNewsInternal(
    page: number,
    limit: number,
    filter: TimeFilter,
    category?: string,
    search?: string
  ): Promise<{
    items: PublicNewsItem[];
    total: number;
    hasMore: boolean;
  }> {
    const supabase = createStaticClient();

    let query = supabase
      .from(TABLES.AI_NEWS)
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    // Apply time filter
    if (filter !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (filter) {
        case 'daily':
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'weekly':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'monthly':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(0);
      }
      query = query.gte('published_at', startDate.toISOString());
    }

    // Apply category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch news: ${error.message}`);
    }

    const items: PublicNewsItem[] = (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      content: row.content,
      category: row.category,
      tags: row.tags ?? [],
      source: row.source_name || row.source_url 
        ? { name: row.source_name ?? undefined, url: row.source_url ?? undefined } 
        : null,
      published_at: row.published_at,
      view_count: row.view_count,
      like_count: row.like_count,
      priorityScore: row.priority_score ?? 0,
      stats: row.view_count || row.like_count 
        ? { views: row.view_count ?? 0, likes: row.like_count ?? 0 }
        : undefined,
    }));

    const total = count ?? 0;

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get trending/popular news items
   */
  static async getTrendingNews(limit = 5): Promise<PublicNewsItem[]> {
    return cachedGetTrendingNews(limit);
  }

  /**
   * Internal implementation for getTrendingNews
   */
  static async getTrendingNewsInternal(limit: number): Promise<PublicNewsItem[]> {
    const supabase = createStaticClient();

    const { data, error } = await supabase
      .from(TABLES.AI_NEWS)
      .select('*')
      .eq('is_published', true)
      .order('view_count', { ascending: false, nullsFirst: false })
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch trending news: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      content: row.content,
      category: row.category,
      tags: row.tags ?? [],
      source: row.source_name || row.source_url 
        ? { name: row.source_name ?? undefined, url: row.source_url ?? undefined } 
        : null,
      published_at: row.published_at,
      view_count: row.view_count,
      like_count: row.like_count,
      priorityScore: row.priority_score ?? 0,
      stats: row.view_count || row.like_count 
        ? { views: row.view_count ?? 0, likes: row.like_count ?? 0 }
        : undefined,
    }));
  }

  /**
   * Get news statistics
   */
  static async getNewsStats(): Promise<{
    totalAnalyzed: number;
    importantStories: number;
    lastUpdated: string;
  }> {
    return cachedGetNewsStats();
  }

  /**
   * Internal implementation for getNewsStats
   */
  static async getNewsStatsInternal(): Promise<{
    totalAnalyzed: number;
    importantStories: number;
    lastUpdated: string;
  }> {
    const supabase = createStaticClient();

    // Get total count
    const { count: totalCount } = await supabase
      .from(TABLES.AI_NEWS)
      .select('*', { count: 'exact', head: true });

    // Get published count
    const { count: publishedCount } = await supabase
      .from(TABLES.AI_NEWS)
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    // Get latest update
    const { data: latestNews } = await supabase
      .from(TABLES.AI_NEWS)
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    return {
      totalAnalyzed: totalCount ?? 0,
      importantStories: publishedCount ?? 0,
      lastUpdated: latestNews?.updated_at ?? new Date().toISOString(),
    };
  }
}

// ============================================================================
// Cached wrapper functions for NewsService
// ============================================================================

/**
 * Cached getNewsBySlug - 15 minute cache
 */
const cachedGetNewsBySlug = unstable_cache(
  async (slug: string) => {
    return NewsService['getNewsBySlugInternal'](slug, false);
  },
  ['news-by-slug'],
  {
    revalidate: 900, // 15 minutes
    tags: ['news'],
  }
);

/**
 * Cached getRelatedNews - 15 minute cache
 */
const cachedGetRelatedNews = unstable_cache(
  async (slug: string, limit: number) => {
    return NewsService.getRelatedNewsInternal(slug, limit);
  },
  ['related-news'],
  {
    revalidate: 900, // 15 minutes
    tags: ['news'],
  }
);

/**
 * Cached getAllNews - 15 minute cache
 */
const cachedGetAllNews = unstable_cache(
  async (page: number, limit: number, filter: TimeFilter, category?: string) => {
    return NewsService.getAllNewsInternal(page, limit, filter, category, undefined);
  },
  ['all-news'],
  {
    revalidate: 900, // 15 minutes
    tags: ['news'],
  }
);

/**
 * Cached getTrendingNews - 15 minute cache
 */
const cachedGetTrendingNews = unstable_cache(
  async (limit: number) => {
    return NewsService.getTrendingNewsInternal(limit);
  },
  ['trending-news'],
  {
    revalidate: 900, // 15 minutes
    tags: ['news'],
  }
);

/**
 * Cached getNewsStats - 1 hour cache
 */
const cachedGetNewsStats = unstable_cache(
  async () => {
    return NewsService.getNewsStatsInternal();
  },
  ['news-stats'],
  {
    revalidate: 3600, // 1 hour
    tags: ['news'],
  }
);
