/**
 * Featured Tools Service for Admin Panel
 *
 * Provides CRUD operations for featured tools management using Supabase.
 * Handles pagination, filtering, sorting, and status calculation.
 *
 * @module featured-tools.service
 *
 * Requirements: 10.1-10.7
 */

import { createClient } from '@/lib/supabase/server';
import {
  createFeaturedToolsRepository,
  type FeaturedToolInsert,
  type FeaturedToolUpdate,
  type FeaturedToolRow,
} from '@/lib/db/repositories/featured-tools.repository';
import type {
  ListResponse,
  PaginationParams,
  SortParams,
  FeaturedToolFilters,
  FeaturedToolStatus,
} from '@/lib/services/admin-crud.types';
import { TABLES } from '@/lib/db/constants/tables';

// ============================================================================
// Types
// ============================================================================

/**
 * Featured tool item for list display with tool name
 */
export interface FeaturedToolListItem {
  id: string;
  tool_id: string;
  tool_name: string;
  tool_slug: string;
  placement_type: string | null;
  is_sponsored: boolean | null;
  sponsor_name: string | null;
  campaign_id: string | null;
  start_date: string | null;
  end_date: string | null;
  display_order: number | null;
  impression_count: number | null;
  click_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  status: FeaturedToolStatus;
}

/**
 * Options for listing featured tools
 */
export interface ListFeaturedToolsOptions extends PaginationParams, Partial<SortParams> {
  filters?: FeaturedToolFilters;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate featured tool status from start_date and end_date
 *
 * Requirements: 10.3
 * Property 17: Featured Tool Status Calculation
 * - "scheduled" if start_date > today
 * - "expired" if end_date < today
 * - "active" otherwise
 * 
 * Note: Dates are compared at the date level (ignoring time).
 * A featured tool is considered:
 * - "scheduled" if start_date is strictly after today
 * - "expired" if end_date is strictly before today
 * - "active" if start_date <= today AND end_date >= today (or if dates are null)
 */
export function calculateFeaturedToolStatus(
  startDate: string | null,
  endDate: string | null
): FeaturedToolStatus {
  // Get today's date as YYYY-MM-DD string for consistent comparison
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Check if start_date is in the future (strictly after today)
  if (startDate) {
    // Extract just the date part (YYYY-MM-DD) for comparison
    const startStr = startDate.split('T')[0];
    if (startStr > todayStr) {
      return 'scheduled';
    }
  }

  // Check if end_date is in the past (strictly before today)
  if (endDate) {
    // Extract just the date part (YYYY-MM-DD) for comparison
    const endStr = endDate.split('T')[0];
    if (endStr < todayStr) {
      return 'expired';
    }
  }

  return 'active';
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get paginated list of featured tools with filtering and sorting
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */
export async function listFeaturedTools(
  options: ListFeaturedToolsOptions
): Promise<ListResponse<FeaturedToolListItem>> {
  const supabase = await createClient();
  const { page, pageSize, sortBy = 'created_at', sortDirection = 'desc', filters = {} } = options;

  // Build query with tool join
  let query = supabase
    .from(TABLES.FEATURED_TOOLS)
    .select(`
      *,
      tools (
        id,
        name,
        slug
      )
    `, { count: 'exact' });

  // Apply filters
  if (filters.search) {
    // Search by tool name or sponsor name
    query = query.or(`sponsor_name.ilike.%${filters.search}%,campaign_id.ilike.%${filters.search}%`);
  }

  if (filters.placement_type) {
    query = query.eq('placement_type', filters.placement_type);
  }

  if (filters.is_sponsored !== undefined) {
    query = query.eq('is_sponsored', filters.is_sponsored);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortDirection === 'asc' });

  // Apply pagination
  const offset = (page - 1) * pageSize;
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch featured tools: ${error.message}`);
  }

  // Transform data and calculate status
  const featuredTools: FeaturedToolListItem[] = (data ?? [])
    .map((row) => {
      const tool = row.tools as { id: string; name: string; slug: string } | null;
      if (!tool) return null;

      const status = calculateFeaturedToolStatus(row.start_date, row.end_date);

      return {
        id: row.id,
        tool_id: row.tool_id,
        tool_name: tool.name,
        tool_slug: tool.slug,
        placement_type: row.placement_type,
        is_sponsored: row.is_sponsored,
        sponsor_name: row.sponsor_name,
        campaign_id: row.campaign_id,
        start_date: row.start_date,
        end_date: row.end_date,
        display_order: row.display_order,
        impression_count: row.impression_count,
        click_count: row.click_count,
        created_at: row.created_at,
        updated_at: row.updated_at,
        status,
      };
    })
    .filter((item): item is FeaturedToolListItem => item !== null);

  // Filter by status if specified (post-query filter since status is calculated)
  let filteredTools = featuredTools;
  if (filters.status) {
    filteredTools = featuredTools.filter((t) => t.status === filters.status);
  }

  return {
    data: filteredTools,
    pagination: {
      page,
      pageSize,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    },
  };
}

/**
 * Get a single featured tool by ID
 */
export async function getFeaturedToolById(id: string): Promise<FeaturedToolListItem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLES.FEATURED_TOOLS)
    .select(`
      *,
      tools (
        id,
        name,
        slug
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch featured tool: ${error.message}`);
  }

  const tool = data.tools as { id: string; name: string; slug: string } | null;
  if (!tool) return null;

  const status = calculateFeaturedToolStatus(data.start_date, data.end_date);

  return {
    id: data.id,
    tool_id: data.tool_id,
    tool_name: tool.name,
    tool_slug: tool.slug,
    placement_type: data.placement_type,
    is_sponsored: data.is_sponsored,
    sponsor_name: data.sponsor_name,
    campaign_id: data.campaign_id,
    start_date: data.start_date,
    end_date: data.end_date,
    display_order: data.display_order,
    impression_count: data.impression_count,
    click_count: data.click_count,
    created_at: data.created_at,
    updated_at: data.updated_at,
    status,
  };
}

/**
 * Create a new featured tool
 *
 * Requirements: 10.5
 */
export async function createFeaturedTool(
  featuredToolData: FeaturedToolInsert
): Promise<FeaturedToolRow> {
  const supabase = await createClient();
  const featuredToolsRepo = createFeaturedToolsRepository(supabase);

  return featuredToolsRepo.create(featuredToolData);
}

/**
 * Update an existing featured tool
 *
 * Requirements: 10.5
 */
export async function updateFeaturedTool(
  id: string,
  featuredToolData: FeaturedToolUpdate
): Promise<FeaturedToolRow> {
  const supabase = await createClient();
  const featuredToolsRepo = createFeaturedToolsRepository(supabase);

  return featuredToolsRepo.update(id, featuredToolData);
}

/**
 * Delete a featured tool
 */
export async function deleteFeaturedTool(id: string): Promise<void> {
  const supabase = await createClient();
  const featuredToolsRepo = createFeaturedToolsRepository(supabase);

  await featuredToolsRepo.delete(id);
}

/**
 * Search tools for the searchable select field
 */
export async function searchToolsForSelect(
  query: string
): Promise<{ value: string; label: string }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLES.TOOLS)
    .select('id, name, slug')
    .neq('status', 'archived')
    .or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
    .order('name', { ascending: true })
    .limit(20);

  if (error) {
    throw new Error(`Failed to search tools: ${error.message}`);
  }

  return (data ?? []).map((tool) => ({
    value: tool.id,
    label: `${tool.name} (${tool.slug})`,
  }));
}

/**
 * Get tool by ID for display
 */
export async function getToolForSelect(
  toolId: string
): Promise<{ value: string; label: string } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLES.TOOLS)
    .select('id, name, slug')
    .eq('id', toolId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch tool: ${error.message}`);
  }

  return {
    value: data.id,
    label: `${data.name} (${data.slug})`,
  };
}
