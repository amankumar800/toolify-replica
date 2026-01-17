/**
 * Free AI Tools Data Service
 * 
 * Provides access to free AI tools data from Supabase with in-memory caching.
 * Implements Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 12.2
 */

import { createClient } from '@/lib/supabase/server';
import {
  type Category,
  type CategoryListItem,
  type FeaturedTool,
  type FAQItem,
  type Tool,
  type Subcategory,
  type CategoryRef,
} from '@/lib/types/free-ai-tools';

// =============================================================================
// Error Handling (Requirement 7.7)
// =============================================================================

/**
 * Error codes for FreeAIToolsError
 */
export type FreeAIToolsErrorCode = 'NOT_FOUND' | 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'NETWORK_ERROR';

/**
 * Custom error class for Free AI Tools service
 * Provides structured error responses with retry guidance
 */
export class FreeAIToolsError extends Error {
  constructor(
    message: string,
    public readonly code: FreeAIToolsErrorCode,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'FreeAIToolsError';
  }

  /**
   * Returns a structured error response
   */
  toResponse() {
    return {
      error: {
        code: this.code,
        message: this.message,
        retryable: this.retryable,
        retryGuidance: this.retryable 
          ? 'This error may be temporary. Please try again in a few moments.'
          : 'This error is not retryable. Please check your request and try again.',
      },
    };
  }
}

// =============================================================================
// Cache Types
// =============================================================================

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

// =============================================================================
// Service Class
// =============================================================================

/**
 * Free AI Tools Data Service
 * 
 * Provides methods to access categories, tools, and featured tools data
 * with in-memory caching (1-hour TTL per Requirement 7.4).
 */
class FreeAIToolsService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly TTL = 60 * 60 * 1000; // 1 hour in milliseconds
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cache entries

  // ===========================================================================
  // Cache Management (Requirement 7.4)
  // ===========================================================================

  /**
   * Get cached data if not expired
   */
  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && entry.expiry > Date.now()) {
      // Move to end for LRU (delete and re-add)
      this.cache.delete(key);
      this.cache.set(key, entry);
      return entry.data as T;
    }
    // Remove expired entry
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Set data in cache with TTL and LRU eviction
   * Implements max cache size with LRU (Least Recently Used) eviction
   */
  private setCache<T>(key: string, data: T): void {
    // If key already exists, delete it first (will be re-added at end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest entries if cache is at max size
    while (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      } else {
        break;
      }
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + this.TTL,
    });
  }

  /**
   * Invalidate cache entries
   * @param key - Optional specific key to invalidate. If not provided, clears all cache.
   */
  invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Invalidate cache entries matching a pattern
   * @param pattern - Pattern with wildcard (*) to match keys
   */
  invalidateCacheByPattern(pattern: string): void {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Check if a cache entry exists and is valid
   */
  isCacheValid(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && entry.expiry > Date.now();
  }

  /**
   * Get cache statistics (useful for debugging)
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }


  // ===========================================================================
  // Category Methods (Requirements 7.1, 7.5, 7.6, 7.8)
  // ===========================================================================

  /**
   * Get all categories with metadata
   * Requirement 7.1: Return all 22 categories with their metadata
   */
  async getCategories(): Promise<CategoryListItem[]> {
    const cacheKey = 'categories';
    const cached = this.getCached<CategoryListItem[]>(cacheKey);
    if (cached) return cached;

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('free_ai_tools_categories')
        .select('id, slug, name, icon, tool_count')
        .order('display_order', { ascending: true });

      if (error) {
        throw new FreeAIToolsError(
          `Failed to fetch categories: ${error.message}`,
          'NETWORK_ERROR',
          true
        );
      }

      // Transform to match expected format
      const categories: CategoryListItem[] = (data || []).map(cat => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon,
        toolCount: cat.tool_count,
      }));

      this.setCache(cacheKey, categories);
      return categories;
    } catch (error) {
      if (error instanceof FreeAIToolsError) throw error;
      throw new FreeAIToolsError(
        `Failed to fetch categories: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NETWORK_ERROR',
        true
      );
    }
  }

  /**
   * Get category by slug
   * Requirement 7.5: Return category data or throw NotFoundError
   */
  async getCategoryBySlug(slug: string): Promise<Category> {
    const cacheKey = `category:${slug}`;
    const cached = this.getCached<Category>(cacheKey);
    if (cached) return cached;

    try {
      const supabase = await createClient();
      
      // Fetch category
      const { data: categoryData, error: categoryError } = await supabase
        .from('free_ai_tools_categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (categoryError || !categoryData) {
        throw new FreeAIToolsError(
          `Category not found: ${slug}`,
          'NOT_FOUND',
          false
        );
      }

      // Fetch subcategories with tools
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('free_ai_tools_subcategories')
        .select(`
          id,
          name,
          tool_count,
          display_order,
          free_ai_tools_tools (
            id,
            name,
            slug,
            external_url,
            description,
            free_tier_details,
            pricing,
            category_ids
          )
        `)
        .eq('category_id', categoryData.id)
        .order('display_order', { ascending: true });

      if (subcategoriesError) {
        throw new FreeAIToolsError(
          `Failed to fetch subcategories: ${subcategoriesError.message}`,
          'NETWORK_ERROR',
          true
        );
      }

      // Transform subcategories to match expected format
      const subcategories: Subcategory[] = (subcategoriesData || []).map(sub => ({
        id: sub.id,
        name: sub.name,
        toolCount: sub.tool_count,
        tools: (sub.free_ai_tools_tools || []).map((tool: {
          id: string;
          name: string;
          slug: string;
          external_url: string | null;
          description: string;
          free_tier_details: string | null;
          pricing: string | null;
          category_ids: string[] | null;
        }) => ({
          id: tool.id,
          name: tool.name,
          slug: tool.slug,
          externalUrl: tool.external_url,
          description: tool.description,
          freeTierDetails: tool.free_tier_details,
          pricing: tool.pricing,
          categoryIds: tool.category_ids || [],
        })),
      }));

      // Build category object
      const category: Category = {
        id: categoryData.id,
        slug: categoryData.slug,
        name: categoryData.name,
        description: categoryData.description,
        icon: categoryData.icon,
        toolCount: categoryData.tool_count,
        subcategories,
        previousCategory: categoryData.previous_category_slug ? {
          slug: categoryData.previous_category_slug,
          name: categoryData.previous_category_name || '',
        } : null,
        nextCategory: categoryData.next_category_slug ? {
          slug: categoryData.next_category_slug,
          name: categoryData.next_category_name || '',
        } : null,
        createdAt: categoryData.created_at || new Date().toISOString(),
        updatedAt: categoryData.updated_at || new Date().toISOString(),
      };

      this.setCache(cacheKey, category);
      return category;
    } catch (error) {
      if (error instanceof FreeAIToolsError) throw error;
      throw new FreeAIToolsError(
        `Failed to fetch category '${slug}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NETWORK_ERROR',
        true
      );
    }
  }

  /**
   * Get adjacent categories for navigation
   * Requirement 7.8: Return previous and next category metadata
   */
  async getAdjacentCategories(slug: string): Promise<{
    previous: CategoryRef | null;
    next: CategoryRef | null;
  }> {
    const category = await this.getCategoryBySlug(slug);
    return {
      previous: category.previousCategory,
      next: category.nextCategory,
    };
  }


  // ===========================================================================
  // Tool Methods (Requirements 7.2, 7.3, 7.6)
  // ===========================================================================

  /**
   * Get tools by category with pagination
   * Requirement 7.2: Return tools organized by subcategory with pagination (default 50)
   */
  async getToolsByCategory(
    slug: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    tools: Tool[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const category = await this.getCategoryBySlug(slug);
    
    // Flatten all tools from subcategories
    const allTools: Tool[] = category.subcategories.flatMap(sub => sub.tools);
    
    // Calculate pagination
    const total = allTools.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const tools = allTools.slice(startIndex, endIndex);

    return {
      tools,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get subcategories for a category
   * Requirement 7.6: Return subcategories with tool counts
   */
  async getSubcategories(categorySlug: string): Promise<Subcategory[]> {
    const category = await this.getCategoryBySlug(categorySlug);
    return category.subcategories;
  }

  /**
   * Get featured tools for main page
   * Requirement 7.3: Return curated featured tools list
   */
  async getFeaturedTools(): Promise<FeaturedTool[]> {
    const cacheKey = 'featured-tools';
    const cached = this.getCached<FeaturedTool[]>(cacheKey);
    if (cached) return cached;

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('free_ai_tools_featured')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        throw new FreeAIToolsError(
          `Failed to fetch featured tools: ${error.message}`,
          'NETWORK_ERROR',
          true
        );
      }

      // Transform to match expected format
      const featuredTools: FeaturedTool[] = (data || []).map(tool => ({
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        imageUrl: tool.image_url,
        description: tool.description,
        badge: tool.badge as 'Free' | 'New' | 'Popular' | null,
        displayOrder: tool.display_order,
      }));

      this.setCache(cacheKey, featuredTools);
      return featuredTools;
    } catch (error) {
      if (error instanceof FreeAIToolsError) throw error;
      throw new FreeAIToolsError(
        `Failed to fetch featured tools: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NETWORK_ERROR',
        true
      );
    }
  }

  /**
   * Get FAQ items for main page
   */
  async getFAQItems(): Promise<FAQItem[]> {
    const cacheKey = 'faq';
    const cached = this.getCached<FAQItem[]>(cacheKey);
    if (cached) return cached;

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('free_ai_tools_faqs')
        .select('id, question, answer')
        .order('display_order', { ascending: true });

      if (error) {
        throw new FreeAIToolsError(
          `Failed to fetch FAQ items: ${error.message}`,
          'NETWORK_ERROR',
          true
        );
      }

      const faqItems: FAQItem[] = (data || []).map(item => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
      }));

      this.setCache(cacheKey, faqItems);
      return faqItems;
    } catch (error) {
      if (error instanceof FreeAIToolsError) throw error;
      throw new FreeAIToolsError(
        `Failed to fetch FAQ items: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NETWORK_ERROR',
        true
      );
    }
  }


  // ===========================================================================
  // Search Functionality (Requirement 12.2)
  // ===========================================================================

  /**
   * Search tools by name, description, or category
   * Requirement 12.2: Filter tools case-insensitively with relevance scoring
   * 
   * Relevance scoring:
   * - Exact name match: 100 points
   * - Name starts with query: 80 points
   * - Name contains query: 60 points
   * - Description contains query: 40 points
   * - Category name contains query: 20 points
   */
  async searchTools(query: string): Promise<{
    results: Array<Tool & { categoryName: string; relevanceScore: number }>;
    total: number;
  }> {
    if (!query || query.trim().length === 0) {
      return { results: [], total: 0 };
    }

    const normalizedQuery = query.toLowerCase().trim();
    const categories = await this.getCategories();
    const results: Array<Tool & { categoryName: string; relevanceScore: number }> = [];

    // Search through all categories
    for (const categoryMeta of categories) {
      try {
        const category = await this.getCategoryBySlug(categoryMeta.slug);
        const categoryNameLower = category.name.toLowerCase();

        for (const subcategory of category.subcategories) {
          for (const tool of subcategory.tools) {
            const nameLower = tool.name.toLowerCase();
            const descriptionLower = tool.description.toLowerCase();

            let relevanceScore = 0;

            // Calculate relevance score
            if (nameLower === normalizedQuery) {
              relevanceScore = 100; // Exact name match
            } else if (nameLower.startsWith(normalizedQuery)) {
              relevanceScore = 80; // Name starts with query
            } else if (nameLower.includes(normalizedQuery)) {
              relevanceScore = 60; // Name contains query
            } else if (descriptionLower.includes(normalizedQuery)) {
              relevanceScore = 40; // Description contains query
            } else if (categoryNameLower.includes(normalizedQuery)) {
              relevanceScore = 20; // Category name contains query
            }

            // Only include if there's a match
            if (relevanceScore > 0) {
              results.push({
                ...tool,
                categoryName: category.name,
                relevanceScore,
              });
            }
          }
        }
      } catch {
        // Skip categories that fail to load
        continue;
      }
    }

    // Sort by relevance score (highest first)
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      results,
      total: results.length,
    };
  }
}

// =============================================================================
// Export Singleton Instance
// =============================================================================

export const freeAIToolsService = new FreeAIToolsService();

// Also export the class for testing purposes
export { FreeAIToolsService };
