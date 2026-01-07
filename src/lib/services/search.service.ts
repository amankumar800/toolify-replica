/**
 * Unified Search Service
 *
 * Provides global search functionality across tools, news, prompts, and categories.
 * Used by the search results page and search bar typeahead.
 *
 * @module search.service
 */

import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/db/constants/tables';

// ============================================================================
// Types
// ============================================================================

/**
 * Search result types
 */
export type SearchResultType = 'tool' | 'news' | 'prompt' | 'category';

/**
 * Base search result item
 */
interface BaseSearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  slug: string;
  description: string | null;
  url: string;
}

/**
 * Tool search result
 */
export interface ToolSearchResult extends BaseSearchResult {
  type: 'tool';
  image: string | null;
  pricing: string | null;
  categories: string[];
}

/**
 * News search result
 */
export interface NewsSearchResult extends BaseSearchResult {
  type: 'news';
  category: string | null;
  publishedAt: string | null;
  image: string | null;
}

/**
 * Prompt search result
 */
export interface PromptSearchResult extends BaseSearchResult {
  type: 'prompt';
  promptType: string | null;
  tags: string[] | null;
  image: string | null;
}

/**
 * Category search result
 */
export interface CategorySearchResult extends BaseSearchResult {
  type: 'category';
  toolCount: number;
  icon: string | null;
}

/**
 * Union type for all search results
 */
export type SearchResult = ToolSearchResult | NewsSearchResult | PromptSearchResult | CategorySearchResult;

/**
 * Search options
 */
export interface SearchOptions {
  query: string;
  types?: SearchResultType[];
  limit?: number;
  offset?: number;
}

/**
 * Search response with results grouped by type
 */
export interface GlobalSearchResponse {
  query: string;
  results: SearchResult[];
  counts: {
    tools: number;
    news: number;
    prompts: number;
    categories: number;
    total: number;
  };
  hasMore: boolean;
}

// ============================================================================
// Search Functions
// ============================================================================

/**
 * Search tools by name, description, or tags
 */
async function searchTools(
  query: string,
  limit: number = 10,
  offset: number = 0
): Promise<{ results: ToolSearchResult[]; count: number }> {
  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from(TABLES.TOOLS)
    .select(`
      id,
      name,
      slug,
      short_description,
      description,
      image_url,
      pricing,
      tool_categories (
        categories (
          name
        )
      )
    `, { count: 'exact' })
    .eq('status', 'published')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,short_description.ilike.%${query}%,tags.cs.{${query}}`)
    .order('is_featured', { ascending: false })
    .order('monthly_visits', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Failed to search tools:', error);
    return { results: [], count: 0 };
  }

  const results: ToolSearchResult[] = (data ?? []).map((row) => {
    // Extract category names from the nested structure
    const categories = (row.tool_categories as Array<{ categories: { name: string } | null }> ?? [])
      .map((tc) => tc.categories?.name)
      .filter((name): name is string => !!name);

    return {
      id: row.id,
      type: 'tool' as const,
      title: row.name,
      slug: row.slug,
      description: row.short_description || row.description,
      url: `/tool/${row.slug}`,
      image: row.image_url,
      pricing: row.pricing,
      categories,
    };
  });

  return { results, count: count ?? 0 };
}

/**
 * Search news by title or summary
 */
async function searchNews(
  query: string,
  limit: number = 10,
  offset: number = 0
): Promise<{ results: NewsSearchResult[]; count: number }> {
  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from(TABLES.AI_NEWS)
    .select('id, title, slug, summary, category, published_at', { count: 'exact' })
    .eq('is_published', true)
    .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%`)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Failed to search news:', error);
    return { results: [], count: 0 };
  }

  const results: NewsSearchResult[] = (data ?? []).map((row) => ({
    id: row.id,
    type: 'news' as const,
    title: row.title,
    slug: row.slug,
    description: row.summary,
    url: `/ai-news/${row.slug}`,
    category: row.category,
    publishedAt: row.published_at,
    image: null, // ai_news table doesn't have image_url column
  }));

  return { results, count: count ?? 0 };
}

/**
 * Search prompts by title or prompt text
 */
async function searchPrompts(
  query: string,
  limit: number = 10,
  offset: number = 0
): Promise<{ results: PromptSearchResult[]; count: number }> {
  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from(TABLES.MIDJOURNEY_PROMPTS)
    .select('id, title, slug, prompt_text, type, tags, image_url', { count: 'exact' })
    .or(`title.ilike.%${query}%,prompt_text.ilike.%${query}%,tags.cs.{${query}}`)
    .order('view_count', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Failed to search prompts:', error);
    return { results: [], count: 0 };
  }

  const results: PromptSearchResult[] = (data ?? []).map((row) => ({
    id: row.id,
    type: 'prompt' as const,
    title: row.title,
    slug: row.slug,
    description: row.prompt_text,
    url: `/midjourney-library/${row.id}`,
    promptType: row.type,
    tags: row.tags,
    image: row.image_url,
  }));

  return { results, count: count ?? 0 };
}

/**
 * Search categories by name or description
 */
async function searchCategories(
  query: string,
  limit: number = 10,
  offset: number = 0
): Promise<{ results: CategorySearchResult[]; count: number }> {
  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from(TABLES.CATEGORIES)
    .select('id, name, slug, description, icon, tool_count', { count: 'exact' })
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('tool_count', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Failed to search categories:', error);
    return { results: [], count: 0 };
  }

  const results: CategorySearchResult[] = (data ?? []).map((row) => ({
    id: row.id,
    type: 'category' as const,
    title: row.name,
    slug: row.slug,
    description: row.description,
    url: `/category/${row.slug}`,
    toolCount: row.tool_count ?? 0,
    icon: row.icon,
  }));

  return { results, count: count ?? 0 };
}

/**
 * Perform a global search across all content types
 */
export async function globalSearch(options: SearchOptions): Promise<GlobalSearchResponse> {
  const {
    query,
    types = ['tool', 'news', 'prompt', 'category'],
    limit = 20,
    offset = 0,
  } = options;

  // Early return for empty queries
  if (!query || query.trim().length < 2) {
    return {
      query,
      results: [],
      counts: { tools: 0, news: 0, prompts: 0, categories: 0, total: 0 },
      hasMore: false,
    };
  }

  const sanitizedQuery = query.trim();

  // Determine per-type limits based on how many types are requested
  // If searching all types, limit each to a fraction
  // If searching specific types, give them the full limit
  const perTypeLimit = types.length === 1 ? limit : Math.ceil(limit / types.length);

  // Execute searches in parallel for requested types
  const searchPromises: Promise<{ type: SearchResultType; results: SearchResult[]; count: number }>[] = [];

  if (types.includes('tool')) {
    searchPromises.push(
      searchTools(sanitizedQuery, perTypeLimit, offset).then((r) => ({
        type: 'tool' as const,
        results: r.results,
        count: r.count,
      }))
    );
  }

  if (types.includes('news')) {
    searchPromises.push(
      searchNews(sanitizedQuery, perTypeLimit, offset).then((r) => ({
        type: 'news' as const,
        results: r.results,
        count: r.count,
      }))
    );
  }

  if (types.includes('prompt')) {
    searchPromises.push(
      searchPrompts(sanitizedQuery, perTypeLimit, offset).then((r) => ({
        type: 'prompt' as const,
        results: r.results,
        count: r.count,
      }))
    );
  }

  if (types.includes('category')) {
    searchPromises.push(
      searchCategories(sanitizedQuery, perTypeLimit, offset).then((r) => ({
        type: 'category' as const,
        results: r.results,
        count: r.count,
      }))
    );
  }

  const searchResults = await Promise.all(searchPromises);

  // Aggregate results
  const counts = {
    tools: 0,
    news: 0,
    prompts: 0,
    categories: 0,
    total: 0,
  };

  const allResults: SearchResult[] = [];

  for (const result of searchResults) {
    allResults.push(...result.results);

    switch (result.type) {
      case 'tool':
        counts.tools = result.count;
        break;
      case 'news':
        counts.news = result.count;
        break;
      case 'prompt':
        counts.prompts = result.count;
        break;
      case 'category':
        counts.categories = result.count;
        break;
    }
  }

  counts.total = counts.tools + counts.news + counts.prompts + counts.categories;

  // Sort results by type priority: tools > news > categories > prompts
  const typePriority: Record<SearchResultType, number> = {
    tool: 0,
    news: 1,
    category: 2,
    prompt: 3,
  };

  allResults.sort((a, b) => typePriority[a.type] - typePriority[b.type]);

  return {
    query: sanitizedQuery,
    results: allResults.slice(0, limit),
    counts,
    hasMore: offset + limit < counts.total,
  };
}

/**
 * Quick search for typeahead - returns limited results optimized for speed
 */
export async function quickSearch(query: string, limit: number = 8): Promise<SearchResult[]> {
  const response = await globalSearch({
    query,
    types: ['tool', 'news', 'category'],
    limit,
    offset: 0,
  });

  return response.results;
}
