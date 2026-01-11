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
 * Contains counts for all database tables.
 * 
 * Requirements: 2.1
 */
export interface DashboardStats {
  totalTools: number;
  totalCategories: number;
  totalSubcategories: number;
  totalAiNews: number;
  totalPrompts: number;
  totalFaqs: number;
  activeFeaturedTools: number;
  totalAdmins: number;
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
 * Recent activity item interface for dashboard display.
 * Represents a recently created/updated record across tools, news, and prompts.
 * 
 * Requirements: 2.3
 */
export interface RecentActivityItem {
  id: string;
  type: 'tool' | 'news' | 'prompt';
  title: string;
  slug: string;
  date: string;
  action: 'created' | 'updated';
}

/**
 * Get total count of tools from the database.
 * 
 * @param supabase - Optional Supabase client (for testing)
 * @returns Total number of tools
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
 * Get total count of subcategories from the database.
 * 
 * @param supabase - Optional Supabase client (for testing)
 * @returns Total number of subcategories
 */
export async function getSubcategoriesCount(
  supabase?: SupabaseClient<Database>
): Promise<number> {
  const client = supabase ?? await createClient();
  
  const { count, error } = await client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLES.SUBCATEGORIES as any)
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Failed to get subcategories count: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Get total count of AI news articles from the database.
 * 
 * @param supabase - Optional Supabase client (for testing)
 * @returns Total number of AI news articles
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
 * Get total count of midjourney prompts from the database.
 * 
 * @param supabase - Optional Supabase client (for testing)
 * @returns Total number of prompts
 */
export async function getPromptsCount(
  supabase?: SupabaseClient<Database>
): Promise<number> {
  const client = supabase ?? await createClient();
  
  const { count, error } = await client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLES.MIDJOURNEY_PROMPTS as any)
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Failed to get prompts count: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Get total count of FAQs from the database.
 * 
 * @param supabase - Optional Supabase client (for testing)
 * @returns Total number of FAQs
 */
export async function getFaqsCount(
  supabase?: SupabaseClient<Database>
): Promise<number> {
  const client = supabase ?? await createClient();
  
  const { count, error } = await client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLES.FAQS as any)
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Failed to get FAQs count: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Get count of active featured tools from the database.
 * Active means: start_date <= today AND (end_date >= today OR end_date is null)
 * 
 * @param supabase - Optional Supabase client (for testing)
 * @returns Number of active featured tools
 */
export async function getActiveFeaturedToolsCount(
  supabase?: SupabaseClient<Database>
): Promise<number> {
  const client = supabase ?? await createClient();
  const today = new Date().toISOString().split('T')[0];
  
  // Query for active featured tools
  // Active = start_date <= today AND (end_date >= today OR end_date is null)
  const { count, error } = await client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLES.FEATURED_TOOLS as any)
    .select('*', { count: 'exact', head: true })
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`);

  if (error) {
    throw new Error(`Failed to get active featured tools count: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Get total count of admins from the database.
 * 
 * @param supabase - Optional Supabase client (for testing)
 * @returns Total number of admins
 */
export async function getAdminsCount(
  supabase?: SupabaseClient<Database>
): Promise<number> {
  const client = supabase ?? await createClient();
  
  const { count, error } = await client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLES.ADMINS as any)
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Failed to get admins count: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Get N most recently created tools ordered by created_at DESC.
 * 
 * @param limit - Maximum number of tools to return (default: 5)
 * @param supabase - Optional Supabase client (for testing)
 * @returns Array of recent tools with id, name, slug, and created_at
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
 * Get recent activity across tools, news, and prompts.
 * Returns the 10 most recently created/updated records.
 * 
 * Requirements: 2.3
 * 
 * @param limit - Maximum number of items to return (default: 10)
 * @param supabase - Optional Supabase client (for testing)
 * @returns Array of recent activity items sorted by date descending
 */
export async function getRecentActivity(
  limit: number = 10,
  supabase?: SupabaseClient<Database>
): Promise<RecentActivityItem[]> {
  const client = supabase ?? await createClient();
  
  // Fetch recent items from each table (get more than needed to ensure we have enough after combining)
  const fetchLimit = limit;
  
  const [toolsResult, newsResult, promptsResult] = await Promise.all([
    client
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(TABLES.TOOLS as any)
      .select('id, name, slug, created_at, updated_at')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(fetchLimit),
    client
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(TABLES.AI_NEWS as any)
      .select('id, title, slug, created_at, updated_at')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(fetchLimit),
    client
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(TABLES.MIDJOURNEY_PROMPTS as any)
      .select('id, title, slug, created_at, updated_at')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(fetchLimit),
  ]);

  if (toolsResult.error) {
    throw new Error(`Failed to get recent tools: ${toolsResult.error.message}`);
  }
  if (newsResult.error) {
    throw new Error(`Failed to get recent news: ${newsResult.error.message}`);
  }
  if (promptsResult.error) {
    throw new Error(`Failed to get recent prompts: ${promptsResult.error.message}`);
  }

  // Transform and combine results
  const activities: RecentActivityItem[] = [];

  // Add tools
  for (const tool of (toolsResult.data ?? []) as unknown[]) {
    const t = tool as { id: string; name: string; slug: string; created_at: string; updated_at: string | null };
    const isUpdated = t.updated_at && t.updated_at !== t.created_at;
    activities.push({
      id: t.id,
      type: 'tool',
      title: t.name,
      slug: t.slug,
      date: isUpdated ? t.updated_at! : t.created_at,
      action: isUpdated ? 'updated' : 'created',
    });
  }

  // Add news
  for (const news of (newsResult.data ?? []) as unknown[]) {
    const n = news as { id: string; title: string; slug: string; created_at: string; updated_at: string | null };
    const isUpdated = n.updated_at && n.updated_at !== n.created_at;
    activities.push({
      id: n.id,
      type: 'news',
      title: n.title,
      slug: n.slug,
      date: isUpdated ? n.updated_at! : n.created_at,
      action: isUpdated ? 'updated' : 'created',
    });
  }

  // Add prompts
  for (const prompt of (promptsResult.data ?? []) as unknown[]) {
    const p = prompt as { id: string; title: string; slug: string; created_at: string; updated_at: string | null };
    const isUpdated = p.updated_at && p.updated_at !== p.created_at;
    activities.push({
      id: p.id,
      type: 'prompt',
      title: p.title,
      slug: p.slug,
      date: isUpdated ? p.updated_at! : p.created_at,
      action: isUpdated ? 'updated' : 'created',
    });
  }

  // Sort by date descending and take top N
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return activities.slice(0, limit);
}

/**
 * Get all dashboard statistics in a single call.
 * 
 * Requirements: 2.1
 * 
 * @param supabase - Optional Supabase client (for testing)
 * @returns Dashboard statistics object with counts for all tables
 */
export async function getDashboardStats(
  supabase?: SupabaseClient<Database>
): Promise<DashboardStats> {
  const client = supabase ?? await createClient();
  
  const [
    totalTools,
    totalCategories,
    totalSubcategories,
    totalAiNews,
    totalPrompts,
    totalFaqs,
    activeFeaturedTools,
    totalAdmins,
  ] = await Promise.all([
    getToolsCount(client),
    getCategoriesCount(client),
    getSubcategoriesCount(client),
    getAiNewsCount(client),
    getPromptsCount(client),
    getFaqsCount(client),
    getActiveFeaturedToolsCount(client),
    getAdminsCount(client),
  ]);

  return {
    totalTools,
    totalCategories,
    totalSubcategories,
    totalAiNews,
    totalPrompts,
    totalFaqs,
    activeFeaturedTools,
    totalAdmins,
  };
}
