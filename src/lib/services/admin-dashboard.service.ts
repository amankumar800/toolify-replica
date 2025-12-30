/**
 * Admin Dashboard Service
 * 
 * Provides statistics and data for the admin dashboard.
 * Uses Supabase repositories to fetch counts and recent data.
 * 
 * @module admin-dashboard.service
 */

import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/db/constants/tables';
import type { Database } from '@/lib/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Dashboard statistics interface.
 */
export interface DashboardStats {
  totalTools: number;
  totalCategories: number;
  totalAiNews: number;
}

/**
 * Recent tool interface for dashboard display.
 */
export interface RecentTool {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

/**
 * Get total count of tools from the database.
 * 
 * @param supabase - Optional Supabase client (for testing)
 * @returns Total number of tools
 * 
 * @example
 * ```ts
 * const count = await getToolsCount();
 * console.log(`Total tools: ${count}`);
 * ```
 */
export async function getToolsCount(
  supabase?: SupabaseClient<Database>
): Promise<number> {
  const client = supabase ?? await createClient();
  
  const { count, error } = await client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLES.TOOLS as any)
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Failed to get tools count: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Get total count of categories from the database.
 * 
 * @param supabase - Optional Supabase client (for testing)
 * @returns Total number of categories
 * 
 * @example
 * ```ts
 * const count = await getCategoriesCount();
 * console.log(`Total categories: ${count}`);
 * ```
 */
export async function getCategoriesCount(
  supabase?: SupabaseClient<Database>
): Promise<number> {
  const client = supabase ?? await createClient();
  
  const { count, error } = await client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLES.CATEGORIES as any)
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Failed to get categories count: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Get total count of AI news articles from the database.
 * 
 * @param supabase - Optional Supabase client (for testing)
 * @returns Total number of AI news articles
 * 
 * @example
 * ```ts
 * const count = await getAiNewsCount();
 * console.log(`Total AI news: ${count}`);
 * ```
 */
export async function getAiNewsCount(
  supabase?: SupabaseClient<Database>
): Promise<number> {
  const client = supabase ?? await createClient();
  
  const { count, error } = await client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLES.AI_NEWS as any)
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Failed to get AI news count: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Get N most recently created tools ordered by created_at DESC.
 * 
 * @param limit - Maximum number of tools to return (default: 5)
 * @param supabase - Optional Supabase client (for testing)
 * @returns Array of recent tools with id, name, slug, and created_at
 * 
 * @example
 * ```ts
 * const recentTools = await getRecentTools(5);
 * recentTools.forEach(tool => {
 *   console.log(`${tool.name} - ${tool.created_at}`);
 * });
 * ```
 */
export async function getRecentTools(
  limit: number = 5,
  supabase?: SupabaseClient<Database>
): Promise<RecentTool[]> {
  const client = supabase ?? await createClient();
  
  const { data, error } = await client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLES.TOOLS as any)
    .select('id, name, slug, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get recent tools: ${error.message}`);
  }

  return (data ?? []) as unknown as RecentTool[];
}

/**
 * Get all dashboard statistics in a single call.
 * 
 * @param supabase - Optional Supabase client (for testing)
 * @returns Dashboard statistics object
 * 
 * @example
 * ```ts
 * const stats = await getDashboardStats();
 * console.log(`Tools: ${stats.totalTools}`);
 * console.log(`Categories: ${stats.totalCategories}`);
 * console.log(`AI News: ${stats.totalAiNews}`);
 * ```
 */
export async function getDashboardStats(
  supabase?: SupabaseClient<Database>
): Promise<DashboardStats> {
  const client = supabase ?? await createClient();
  
  const [totalTools, totalCategories, totalAiNews] = await Promise.all([
    getToolsCount(client),
    getCategoriesCount(client),
    getAiNewsCount(client),
  ]);

  return {
    totalTools,
    totalCategories,
    totalAiNews,
  };
}
