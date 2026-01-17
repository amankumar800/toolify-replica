/**
 * Tools Service for Admin Panel
 *
 * Provides CRUD operations for tools management using Supabase.
 * Handles pagination, filtering, sorting, and bulk operations.
 *
 * @module tools.service
 *
 * Requirements: 3.1-3.11, 17.1, 19.1-19.7, 21.1-21.5
 */

import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAnonClient } from '@/lib/supabase/anon';
import { createToolsRepository, type ToolInsert, type ToolUpdate } from '@/lib/db/repositories/tools.repository';
import { createCategoriesRepository } from '@/lib/db/repositories/categories.repository';
import type {
  ListResponse,
  PaginationParams,
  SortParams,
  ToolFilters,
  DuplicateMatch,
  DuplicateDetectionResult,
} from '@/lib/services/admin-crud.types';
import type { ToolStatus } from '@/lib/types/admin-forms';
import { TABLES } from '@/lib/db/constants/tables';
import type { Database } from '@/lib/supabase/types';
import { createLogger } from '@/lib/logger';

const log = createLogger('ToolsService');

// ============================================================================
// Types
// ============================================================================

/**
 * Tool row type from database
 */
export type ToolRow = Database['public']['Tables']['tools']['Row'];

/**
 * Tool with category names for display
 */
export interface ToolWithCategories {
  id: string;
  name: string;
  slug: string;
  website_url: string;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  pricing: string | null;
  status: string | null;
  platform: string | null;
  is_featured: boolean | null;
  is_new: boolean | null;
  verified: boolean | null;
  tags: string[] | null;
  monthly_visits: number | null;
  review_score: number | null;
  review_count: number | null;
  metadata: unknown;
  submitter_name: string | null;
  submitter_email: string | null;
  rejection_reason: string | null;
  // Platform availability
  has_mobile_app: boolean | null;
  has_browser_extension: boolean | null;
  has_discord_bot: boolean | null;
  // Discord community fields
  discord_url: string | null;
  discord_members: number | null;
  discord_online_7d: number | null;
  created_at: string | null;
  updated_at: string | null;
  categories: { id: string; name: string; slug: string }[];
}

/**
 * Options for listing tools
 */
export interface ListToolsOptions extends PaginationParams, Partial<SortParams> {
  filters?: ToolFilters;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get paginated list of tools with filtering and sorting
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export async function listTools(
  options: ListToolsOptions
): Promise<ListResponse<ToolWithCategories>> {
  const supabase = await createClient();
  const { page, pageSize, sortBy = 'created_at', sortDirection = 'desc', filters = {} } = options;

  // Build query
  let query = supabase
    .from(TABLES.TOOLS)
    .select(`
      *,
      tool_categories (
        category_id,
        categories (
          id,
          name,
          slug
        )
      )
    `, { count: 'exact' });

  // Apply filters
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  } else if (!filters.includeArchived) {
    // By default, exclude archived tools unless explicitly requested
    query = query.neq('status', 'archived');
  }

  if (filters.is_featured !== undefined) {
    query = query.eq('is_featured', filters.is_featured);
  }

  if (filters.pricing) {
    query = query.eq('pricing', filters.pricing);
  }

  if (filters.platform) {
    query = query.eq('platform', filters.platform);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortDirection === 'asc' });

  // Apply pagination
  const offset = (page - 1) * pageSize;
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch tools: ${error.message}`);
  }

  // Transform data to include flattened categories
  const tools: ToolWithCategories[] = (data ?? []).map((row) => {
    const toolCategories = row.tool_categories as Array<{
      category_id: string;
      categories: { id: string; name: string; slug: string } | null;
    }> | null;

    const categories = (toolCategories ?? [])
      .map((tc) => tc.categories)
      .filter((c): c is { id: string; name: string; slug: string } => c !== null);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tool_categories: _, ...toolRow } = row;
    return {
      ...toolRow,
      categories,
    } as ToolWithCategories;
  });

  return {
    data: tools,
    pagination: {
      page,
      pageSize,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    },
  };
}

/**
 * Get a single tool by ID
 */
export async function getToolById(id: string): Promise<ToolWithCategories | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLES.TOOLS)
    .select(`
      *,
      tool_categories (
        category_id,
        categories (
          id,
          name,
          slug
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch tool: ${error.message}`);
  }

  const toolCategories = data.tool_categories as Array<{
    category_id: string;
    categories: { id: string; name: string; slug: string } | null;
  }> | null;

  const categories = (toolCategories ?? [])
    .map((tc) => tc.categories)
    .filter((c): c is { id: string; name: string; slug: string } => c !== null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { tool_categories: _, ...toolRow } = data;
  return {
    ...toolRow,
    categories,
  } as ToolWithCategories;
}

/**
 * Create a new tool
 *
 * Requirements: 3.8, 3.10, 3.11
 */
export async function createTool(
  toolData: ToolInsert,
  categoryIds?: string[]
): Promise<ToolRow> {
  const supabase = await createClient();
  const toolsRepo = createToolsRepository(supabase);

  // Create the tool
  const tool = await toolsRepo.create(toolData);

  // Link categories if provided
  if (categoryIds && categoryIds.length > 0) {
    await syncToolCategories(tool.id, categoryIds);
  }

  return tool;
}

/**
 * Update an existing tool
 *
 * Requirements: 3.8, 3.10, 3.11
 */
export async function updateTool(
  id: string,
  toolData: ToolUpdate,
  categoryIds?: string[]
): Promise<ToolRow> {
  const supabase = await createClient();
  const toolsRepo = createToolsRepository(supabase);

  // Update the tool
  const tool = await toolsRepo.update(id, toolData);

  // Sync categories if provided
  if (categoryIds !== undefined) {
    await syncToolCategories(id, categoryIds);
  }

  return tool;
}

/**
 * Sync tool categories (junction table)
 *
 * Requirements: 3.11
 */
export async function syncToolCategories(
  toolId: string,
  categoryIds: string[]
): Promise<void> {
  const supabase = await createClient();

  // Delete existing category links
  const { error: deleteError } = await supabase
    .from(TABLES.TOOL_CATEGORIES)
    .delete()
    .eq('tool_id', toolId);

  if (deleteError) {
    throw new Error(`Failed to clear tool categories: ${deleteError.message}`);
  }

  // Insert new category links
  if (categoryIds.length > 0) {
    const links = categoryIds.map((categoryId) => ({
      tool_id: toolId,
      category_id: categoryId,
    }));

    const { error: insertError } = await supabase
      .from(TABLES.TOOL_CATEGORIES)
      .insert(links);

    if (insertError) {
      throw new Error(`Failed to link tool categories: ${insertError.message}`);
    }
  }
}

/**
 * Soft delete a tool (change status to archived)
 *
 * Requirements: 19.1, 19.2
 */
export async function softDeleteTool(id: string): Promise<ToolRow> {
  const supabase = await createClient();
  const toolsRepo = createToolsRepository(supabase);

  return toolsRepo.update(id, { status: 'archived' });
}

/**
 * Restore an archived tool (change status to draft)
 *
 * Requirements: 19.5
 */
export async function restoreTool(id: string): Promise<ToolRow> {
  const supabase = await createClient();
  const toolsRepo = createToolsRepository(supabase);

  return toolsRepo.update(id, { status: 'draft' });
}

/**
 * Permanently delete a tool
 *
 * Requirements: 19.6
 */
export async function permanentlyDeleteTool(id: string): Promise<void> {
  const supabase = await createClient();
  const toolsRepo = createToolsRepository(supabase);

  await toolsRepo.delete(id);
}

/**
 * Bulk update tool status
 *
 * Requirements: 3.7
 */
export async function bulkUpdateToolStatus(
  ids: string[],
  status: ToolStatus
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from(TABLES.TOOLS)
    .update({ status })
    .in('id', ids);

  if (error) {
    throw new Error(`Failed to bulk update tools: ${error.message}`);
  }
}

/**
 * Bulk delete tools (soft delete)
 *
 * Requirements: 3.7, 19.2
 */
export async function bulkSoftDeleteTools(ids: string[]): Promise<void> {
  await bulkUpdateToolStatus(ids, 'archived');
}

/**
 * Get all categories for multi-select
 */
export async function getAllCategories(): Promise<{ id: string; name: string; slug: string }[]> {
  const supabase = await createClient();
  const categoriesRepo = createCategoriesRepository(supabase);

  const categories = await categoriesRepo.findAll({
    orderBy: 'name' as keyof typeof categories[0],
    ascending: true,
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));
}

/**
 * Check for duplicate tools
 *
 * Requirements: 21.1, 21.2, 21.3
 */
export async function checkForDuplicates(
  name: string,
  websiteUrl: string,
  excludeId?: string
): Promise<DuplicateDetectionResult> {
  const supabase = await createClient();
  const matches: DuplicateMatch[] = [];

  // Check for similar names (simple fuzzy match using ILIKE)
  const nameLower = name.toLowerCase();
  const { data: nameMatches, error: nameError } = await supabase
    .from(TABLES.TOOLS)
    .select('id, name, slug')
    .ilike('name', `%${nameLower}%`)
    .neq('status', 'archived')
    .limit(5);

  if (nameError) {
    log.error('Error checking name duplicates', nameError, { action: 'checkForDuplicates', data: { name } });
  } else if (nameMatches) {
    for (const match of nameMatches) {
      if (excludeId && match.id === excludeId) continue;

      // Calculate simple similarity score
      const matchNameLower = match.name.toLowerCase();
      const similarity = calculateSimilarity(nameLower, matchNameLower);

      if (similarity >= 80) {
        matches.push({
          id: match.id,
          name: match.name,
          matchType: 'name',
          matchScore: similarity,
          href: `/admin/tools/${match.id}/edit`,
        });
      }
    }
  }

  // Check for same website URL
  if (websiteUrl) {
    const { data: urlMatches, error: urlError } = await supabase
      .from(TABLES.TOOLS)
      .select('id, name, slug')
      .eq('website_url', websiteUrl)
      .neq('status', 'archived')
      .limit(5);

    if (urlError) {
      log.error('Error checking URL duplicates', urlError, { action: 'checkForDuplicates', data: { websiteUrl } });
    } else if (urlMatches) {
      for (const match of urlMatches) {
        if (excludeId && match.id === excludeId) continue;

        // Don't add if already in matches
        if (!matches.some((m) => m.id === match.id)) {
          matches.push({
            id: match.id,
            name: match.name,
            matchType: 'url',
            matchScore: 100,
            href: `/admin/tools/${match.id}/edit`,
          });
        }
      }
    }
  }

  return {
    hasDuplicates: matches.length > 0,
    matches,
  };
}

/**
 * Calculate simple string similarity (Levenshtein-based percentage)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 100;

  const editDistance = levenshteinDistance(longer, shorter);
  return Math.round(((longer.length - editDistance) / longer.length) * 100);
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}


// ============================================================================
// Public-Facing Tools Functions (for site pages)
// ============================================================================

/**
 * Options for public getTools function
 */
export interface GetToolsOptions {
  search?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

/**
 * Public tool item for display
 */
export interface PublicToolItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  website_url: string;
  pricing: string | null;
  is_featured: boolean | null;
  is_new: boolean | null;
  tags: string[] | null;
  monthly_visits: number | null;
  change_percentage: number | null;
  review_score: number | null;
  review_count: number | null;
}

/**
 * Get published tools with optional search and filtering
 * Used by public-facing pages and server actions
 */
export async function getTools(options: GetToolsOptions = {}): Promise<{
  items: PublicToolItem[];
  total: number;
  hasMore: boolean;
}> {
  const { search, category, limit = 20, offset = 0 } = options;

  // Use cached version for non-search queries
  if (!search) {
    return getCachedTools(category, limit, offset);
  }

  // For search queries, don't cache (too many variations)
  // Use anon client since this is public data
  const supabase = createAnonClient();
  return getToolsInternal(supabase, undefined, category, limit, offset);
}

/**
 * Cached tools fetching for category browsing
 * Uses anon client to avoid cookies() inside unstable_cache()
 */
const getCachedTools = unstable_cache(
  async (
    category: string | undefined,
    limit: number,
    offset: number
  ): Promise<{
    items: PublicToolItem[];
    total: number;
    hasMore: boolean;
  }> => {
    // Create anon client inside cache - no cookies() dependency
    const supabase = createAnonClient();
    return getToolsInternal(supabase, undefined, category, limit, offset);
  },
  ['tools-list'],
  {
    revalidate: 1800, // Cache for 30 minutes
    tags: ['tools'],
  }
);

/**
 * Internal tools fetching implementation
 * Accepts supabase client to support both cached (anon) and non-cached (server) usage
 */
async function getToolsInternal(
  supabase: ReturnType<typeof createAnonClient>,
  search: string | undefined,
  category: string | undefined,
  limit: number,
  offset: number
): Promise<{
  items: PublicToolItem[];
  total: number;
  hasMore: boolean;
}> {

  let query = supabase
    .from(TABLES.TOOLS)
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('monthly_visits', { ascending: false, nullsFirst: false });

  // Apply search filter
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,short_description.ilike.%${search}%,tags.cs.{${search}}`);
  }

  // Apply category filter via junction table
  if (category) {
    // Get tool IDs in this category first
    const { data: categoryTools } = await supabase
      .from(TABLES.TOOL_CATEGORIES)
      .select('tool_id, categories!inner(slug)')
      .eq('categories.slug', category);

    if (categoryTools && categoryTools.length > 0) {
      const toolIds = categoryTools.map((ct) => ct.tool_id);
      query = query.in('id', toolIds);
    } else {
      // No tools in this category
      return { items: [], total: 0, hasMore: false };
    }
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    log.error('Failed to fetch tools', error, { action: 'getToolsInternal', data: { search, category } });
    return { items: [], total: 0, hasMore: false };
  }

  const items: PublicToolItem[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    short_description: row.short_description,
    image_url: row.image_url,
    website_url: row.website_url,
    pricing: row.pricing,
    is_featured: row.is_featured,
    is_new: row.is_new,
    tags: row.tags,
    monthly_visits: row.monthly_visits,
    change_percentage: row.change_percentage,
    review_score: row.review_score,
    review_count: row.review_count,
  }));

  const total = count ?? 0;

  return {
    items,
    total,
    hasMore: offset + limit < total,
  };
}

/**
 * Tool data for public display pages
 */
export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  image: string;
  websiteUrl: string;
  pricing: string;
  categories: string[];
  tags: string[];
  savedCount: number;
  reviewCount: number;
  reviewScore: number;
  verified: boolean;
  isNew: boolean;
  isFeatured: boolean;
  status: string;
}

/**
 * Options for getToolBySlug
 */
export interface GetToolBySlugOptions {
  /** If true, returns the tool regardless of status (for admin preview) */
  preview?: boolean;
}

/**
 * Get a tool by its slug for public display
 *
 * By default, only returns published tools. When preview=true,
 * returns the tool regardless of status (for admin preview functionality).
 *
 * Requirements: 18.1, 18.4 - Preview functionality for tools
 *
 * @param slug - URL-friendly identifier
 * @param options - Optional settings including preview mode
 * @returns The tool or null if not found
 */
export async function getToolBySlug(
  slug: string,
  options: GetToolBySlugOptions = {}
): Promise<Tool | null> {
  const supabase = await createClient();
  const { preview = false } = options;

  // Build query
  let query = supabase
    .from(TABLES.TOOLS)
    .select(`
      *,
      tool_categories (
        category_id,
        categories (
          id,
          name,
          slug
        )
      )
    `)
    .eq('slug', slug);

  // Only filter by status if not in preview mode
  if (!preview) {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to fetch tool: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  // Extract categories from junction table
  const toolCategories = data.tool_categories as Array<{
    category_id: string;
    categories: { id: string; name: string; slug: string } | null;
  }> | null;

  const categories = (toolCategories ?? [])
    .map((tc) => tc.categories?.name)
    .filter((name): name is string => name !== null && name !== undefined);

  // Map to Tool interface
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description ?? '',
    shortDescription: data.short_description ?? '',
    image: data.image_url ?? '',
    websiteUrl: data.website_url,
    pricing: data.pricing ?? 'Free',
    categories,
    tags: data.tags ?? [],
    savedCount: 0, // Not tracked in current schema
    reviewCount: data.review_count ?? 0,
    reviewScore: data.review_score ?? 0,
    verified: data.verified ?? false,
    isNew: data.is_new ?? false,
    isFeatured: data.is_featured ?? false,
    status: data.status ?? 'draft',
  };
}

/**
 * Input type for creating a tool
 */
export interface CreateToolInput {
  name: string;
  slug: string;
  websiteUrl: string;
  description?: string;
  shortDescription?: string;
  imageUrl?: string;
  pricing?: string;
  status?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  verified?: boolean;
  tags?: string[];
  categoryIds?: string[];
}

/**
 * Create a new tool (public API)
 */
export async function createToolPublic(input: CreateToolInput): Promise<Tool | null> {
  const tool = await createTool({
    name: input.name,
    slug: input.slug,
    website_url: input.websiteUrl,
    description: input.description,
    short_description: input.shortDescription,
    image_url: input.imageUrl,
    pricing: input.pricing,
    status: input.status ?? 'draft',
    is_featured: input.isFeatured ?? false,
    is_new: input.isNew ?? false,
    verified: input.verified ?? false,
    tags: input.tags ?? [],
  }, input.categoryIds);

  return getToolBySlug(tool.slug, { preview: true });
}

/**
 * Update an existing tool (public API)
 */
export async function updateToolPublic(
  id: string,
  input: Partial<CreateToolInput>
): Promise<Tool | null> {
  const tool = await updateTool(id, {
    name: input.name,
    slug: input.slug,
    website_url: input.websiteUrl,
    description: input.description,
    short_description: input.shortDescription,
    image_url: input.imageUrl,
    pricing: input.pricing,
    status: input.status,
    is_featured: input.isFeatured,
    is_new: input.isNew,
    verified: input.verified,
    tags: input.tags,
  }, input.categoryIds);

  return getToolBySlug(tool.slug, { preview: true });
}

/**
 * Delete a tool (public API)
 */
export async function deleteTool(id: string): Promise<void> {
  await permanentlyDeleteTool(id);
}

/**
 * Get featured tools for homepage
 */
export async function getFeaturedTools(limit = 10): Promise<Tool[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLES.TOOLS)
    .select(`
      *,
      tool_categories (
        category_id,
        categories (
          id,
          name,
          slug
        )
      )
    `)
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('monthly_visits', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch featured tools: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const toolCategories = row.tool_categories as Array<{
      category_id: string;
      categories: { id: string; name: string; slug: string } | null;
    }> | null;

    const categories = (toolCategories ?? [])
      .map((tc) => tc.categories?.name)
      .filter((name): name is string => name !== null && name !== undefined);

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? '',
      shortDescription: row.short_description ?? '',
      image: row.image_url ?? '',
      websiteUrl: row.website_url,
      pricing: row.pricing ?? 'Free',
      categories,
      tags: row.tags ?? [],
      savedCount: 0,
      reviewCount: row.review_count ?? 0,
      reviewScore: row.review_score ?? 0,
      verified: row.verified ?? false,
      isNew: row.is_new ?? false,
      isFeatured: row.is_featured ?? false,
      status: row.status ?? 'draft',
    };
  });
}
