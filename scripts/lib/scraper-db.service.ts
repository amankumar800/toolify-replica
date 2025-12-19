/**
 * Scraper Database Service
 * 
 * Provides database operations for the scraper to write directly to Supabase.
 * Handles errors gracefully and continues processing on individual failures.
 * 
 * All tools upserted through this service automatically include metadata:
 * - source: 'scraper'
 * - scraped_at: ISO timestamp
 * 
 * @module scraper-db.service
 */

import { SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// Constants
// =============================================================================

const TABLES = {
  TOOLS: 'tools',
  CATEGORIES: 'categories',
  TOOL_CATEGORIES: 'tool_categories',
  FAQS: 'faqs',
} as const;

// =============================================================================
// Types
// =============================================================================

/**
 * Category insert type for scraper operations.
 */
export interface ScraperCategoryInsert {
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  tool_count?: number | null;
  display_order?: number | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Tool insert type for scraper operations.
 */
export interface ScraperToolInsert {
  name: string;
  slug: string;
  website_url: string;
  description?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  external_url?: string | null;
  pricing?: string | null;
  tags?: string[] | null;
  saved_count?: number | null;
  review_count?: number | null;
  review_score?: number | null;
  verified?: boolean | null;
  is_new?: boolean | null;
  is_featured?: boolean | null;
  free_tier_details?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Tool-category relationship insert type.
 */
export interface ScraperToolCategoryInsert {
  tool_id: string;
  category_id: string;
}

/**
 * FAQ insert type for scraper operations.
 */
export interface ScraperFaqInsert {
  question: string;
  answer: string;
  display_order?: number | null;
}

/**
 * Result of a scraper database operation.
 */
export interface ScraperResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Scraper metadata added to all tools.
 */
export interface ScraperMetadata {
  source: 'scraper';
  scraped_at: string;
  [key: string]: unknown;
}

// =============================================================================
// Scraper Database Service
// =============================================================================

/**
 * Service for scraper database operations.
 * Handles upserts with error resilience - continues processing on individual failures.
 */
export class ScraperDbService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Upsert categories using slug as conflict column.
   * Continues processing on individual failures.
   * 
   * @param categories - Array of categories to upsert
   * @returns Result with success/failed counts and error messages
   */
  async upsertCategories(categories: ScraperCategoryInsert[]): Promise<ScraperResult> {
    const result: ScraperResult = { success: 0, failed: 0, errors: [] };

    for (const category of categories) {
      try {
        const { error } = await this.supabase
          .from(TABLES.CATEGORIES)
          .upsert(category, { onConflict: 'slug' });

        if (error) {
          throw error;
        }

        result.success++;
      } catch (error) {
        result.failed++;
        const message = error instanceof Error ? error.message : String(error);
        result.errors.push(`Category ${category.slug}: ${message}`);
        console.error(`[ScraperDb] Failed to upsert category ${category.slug}:`, message);
      }
    }

    return result;
  }

  /**
   * Upsert tools using slug as conflict column.
   * Automatically adds scraper metadata (source='scraper', scraped_at=timestamp).
   * Continues processing on individual failures.
   * 
   * @param tools - Array of tools to upsert
   * @returns Result with success/failed counts and error messages
   */
  async upsertTools(tools: ScraperToolInsert[]): Promise<ScraperResult> {
    const result: ScraperResult = { success: 0, failed: 0, errors: [] };
    const scrapedAt = new Date().toISOString();

    for (const tool of tools) {
      try {
        // Add scraper metadata
        const toolWithMetadata = {
          ...tool,
          metadata: {
            ...(tool.metadata || {}),
            source: 'scraper' as const,
            scraped_at: scrapedAt,
          },
        };

        const { error } = await this.supabase
          .from(TABLES.TOOLS)
          .upsert(toolWithMetadata, { onConflict: 'slug' });

        if (error) {
          throw error;
        }

        result.success++;
      } catch (error) {
        result.failed++;
        const message = error instanceof Error ? error.message : String(error);
        result.errors.push(`Tool ${tool.slug}: ${message}`);
        console.error(`[ScraperDb] Failed to upsert tool ${tool.slug}:`, message);
      }
    }

    return result;
  }

  /**
   * Upsert tool-category relationships using (tool_id, category_id) as conflict.
   * Continues processing on individual failures.
   * 
   * @param relationships - Array of tool-category relationships to upsert
   * @returns Result with success/failed counts and error messages
   */
  async upsertToolCategories(relationships: ScraperToolCategoryInsert[]): Promise<ScraperResult> {
    const result: ScraperResult = { success: 0, failed: 0, errors: [] };

    for (const rel of relationships) {
      try {
        const { error } = await this.supabase
          .from(TABLES.TOOL_CATEGORIES)
          .upsert(rel, { onConflict: 'tool_id,category_id' });

        if (error) {
          throw error;
        }

        result.success++;
      } catch (error) {
        result.failed++;
        const message = error instanceof Error ? error.message : String(error);
        result.errors.push(`Tool-Category ${rel.tool_id}-${rel.category_id}: ${message}`);
        console.error(`[ScraperDb] Failed to upsert tool-category relationship:`, message);
      }
    }

    return result;
  }

  /**
   * Upsert FAQs preserving display_order from source.
   * Uses question as the unique identifier for matching.
   * Continues processing on individual failures.
   * 
   * @param faqs - Array of FAQs to upsert
   * @returns Result with success/failed counts and error messages
   */
  async upsertFaqs(faqs: ScraperFaqInsert[]): Promise<ScraperResult> {
    const result: ScraperResult = { success: 0, failed: 0, errors: [] };

    for (const faq of faqs) {
      try {
        // Check if FAQ with this question exists
        const { data: existing } = await this.supabase
          .from(TABLES.FAQS)
          .select('id')
          .eq('question', faq.question)
          .maybeSingle();

        if (existing) {
          // Update existing FAQ
          const { error } = await this.supabase
            .from(TABLES.FAQS)
            .update({ answer: faq.answer, display_order: faq.display_order })
            .eq('id', existing.id);

          if (error) {
            throw error;
          }
        } else {
          // Insert new FAQ
          const { error } = await this.supabase
            .from(TABLES.FAQS)
            .insert(faq);

          if (error) {
            throw error;
          }
        }

        result.success++;
      } catch (error) {
        result.failed++;
        const message = error instanceof Error ? error.message : String(error);
        const questionPreview = faq.question.substring(0, 30);
        result.errors.push(`FAQ "${questionPreview}...": ${message}`);
        console.error(`[ScraperDb] Failed to upsert FAQ:`, message);
      }
    }

    return result;
  }

  /**
   * Get a tool by slug.
   * Useful for getting tool ID after upsert for creating relationships.
   * 
   * @param slug - Tool slug to find
   * @returns Tool data or null if not found
   */
  async getToolBySlug(slug: string): Promise<{ id: string; slug: string } | null> {
    const { data, error } = await this.supabase
      .from(TABLES.TOOLS)
      .select('id, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error(`[ScraperDb] Failed to get tool by slug ${slug}:`, error.message);
      return null;
    }

    return data;
  }

  /**
   * Get a category by slug.
   * Useful for getting category ID after upsert for creating relationships.
   * 
   * @param slug - Category slug to find
   * @returns Category data or null if not found
   */
  async getCategoryBySlug(slug: string): Promise<{ id: string; slug: string } | null> {
    const { data, error } = await this.supabase
      .from(TABLES.CATEGORIES)
      .select('id, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error(`[ScraperDb] Failed to get category by slug ${slug}:`, error.message);
      return null;
    }

    return data;
  }
}

/**
 * Creates a ScraperDbService instance.
 * 
 * @param supabase - Supabase client (should be admin client for bypassing RLS)
 * @returns ScraperDbService instance
 * 
 * @example
 * ```ts
 * import { createClient } from '@supabase/supabase-js';
 * import { createScraperDbService } from './lib/scraper-db.service';
 * 
 * const supabase = createClient(url, serviceRoleKey);
 * const scraperDb = createScraperDbService(supabase);
 * 
 * const result = await scraperDb.upsertTools([{ name: 'ChatGPT', slug: 'chatgpt', website_url: '...' }]);
 * console.log(`Upserted ${result.success} tools, ${result.failed} failed`);
 * ```
 */
export function createScraperDbService(supabase: SupabaseClient): ScraperDbService {
  return new ScraperDbService(supabase);
}
