/**
 * Stats Service for Public-Facing Pages
 *
 * Provides real-time statistics from the database for homepage and other public pages.
 * Includes proper error handling with fallback values.
 *
 * @module stats.service
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { TABLES, TOOL_STATUS } from '@/lib/db/constants/tables';
import { unstable_cache } from 'next/cache';
import { createLogger } from '@/lib/logger';

const log = createLogger('StatsService');

/**
 * Homepage statistics interface
 */
export interface HomePageStats {
  totalTools: number;
  totalCategories: number;
}

/**
 * Default fallback values if database queries fail
 */
const FALLBACK_STATS: HomePageStats = {
  totalTools: 0,
  totalCategories: 0,
};

/**
 * Fetches homepage statistics from the database.
 * Counts published tools and all categories across both main and free AI tools tables.
 *
 * @returns Homepage statistics with tool and category counts
 */
async function fetchHomePageStats(): Promise<HomePageStats> {
  const supabase = createAdminClient();

  try {
    // Run all count queries in parallel for performance
    const [
      publishedToolsResult,
      freeToolsResult,
      categoriesResult,
      freeCategoriesResult,
    ] = await Promise.all([
      // Count published tools from main tools table
      supabase
        .from(TABLES.TOOLS)
        .select('*', { count: 'exact', head: true })
        .eq('status', TOOL_STATUS.PUBLISHED),

      // Count all tools from free_ai_tools_tools table
      supabase
        .from('free_ai_tools_tools')
        .select('*', { count: 'exact', head: true }),

      // Count categories from main categories table
      supabase
        .from(TABLES.CATEGORIES)
        .select('*', { count: 'exact', head: true }),

      // Count categories from free_ai_tools_categories table
      supabase
        .from('free_ai_tools_categories')
        .select('*', { count: 'exact', head: true }),
    ]);

    // Handle errors gracefully - log but don't throw
    if (publishedToolsResult.error) {
      log.error('Error fetching published tools count', publishedToolsResult.error, { action: 'fetchHomePageStats' });
    }
    if (freeToolsResult.error) {
      log.error('Error fetching free tools count', freeToolsResult.error, { action: 'fetchHomePageStats' });
    }
    if (categoriesResult.error) {
      log.error('Error fetching categories count', categoriesResult.error, { action: 'fetchHomePageStats' });
    }
    if (freeCategoriesResult.error) {
      log.error('Error fetching free categories count', freeCategoriesResult.error, { action: 'fetchHomePageStats' });
    }

    // Calculate totals with fallback to 0 for any failed queries
    const totalTools =
      (publishedToolsResult.count ?? 0) + (freeToolsResult.count ?? 0);
    const totalCategories =
      (categoriesResult.count ?? 0) + (freeCategoriesResult.count ?? 0);

    return {
      totalTools,
      totalCategories,
    };
  } catch (error) {
    log.error('Failed to fetch homepage stats', error, { action: 'fetchHomePageStats' });
    return FALLBACK_STATS;
  }
}

/**
 * Cached version of homepage stats.
 * Uses Next.js unstable_cache for ISR-compatible caching.
 * Cache is revalidated every hour (3600 seconds) to match page revalidation.
 */
export const getHomePageStats = unstable_cache(
  fetchHomePageStats,
  ['homepage-stats'],
  {
    revalidate: 3600, // 1 hour, matches page revalidation
    tags: ['stats', 'homepage'],
  }
);
