/**
 * Prompts Service for Admin Panel
 *
 * Provides CRUD operations for Midjourney prompts management using Supabase.
 * Handles pagination, filtering, sorting, and bulk operations.
 *
 * @module prompts.service
 *
 * Requirements: 8.1-8.6
 */

import { createClient } from '@/lib/supabase/server';
import {
  createMidjourneyPromptsRepository,
  type MidjourneyPromptInsert,
  type MidjourneyPromptUpdate,
  type MidjourneyPromptRow,
} from '@/lib/db/repositories/midjourney-prompts.repository';
import type {
  ListResponse,
  PaginationParams,
  SortParams,
  PromptFilters,
} from '@/lib/services/admin-crud.types';
import { TABLES } from '@/lib/db/constants/tables';

// ============================================================================
// Types
// ============================================================================

/**
 * Prompt item for list display
 * Requirements: 8.1
 */
export interface PromptListItem {
  id: string;
  title: string;
  slug: string;
  type: string;
  tags: string[] | null;
  view_count: number | null;
  copy_count: number | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Options for listing prompts
 */
export interface ListPromptsOptions extends PaginationParams, Partial<SortParams> {
  filters?: PromptFilters;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get paginated list of prompts with filtering and sorting
 *
 * Requirements: 8.1, 8.2, 8.3
 */
export async function listPrompts(
  options: ListPromptsOptions
): Promise<ListResponse<PromptListItem>> {
  const supabase = await createClient();
  const { page, pageSize, sortBy = 'created_at', sortDirection = 'desc', filters = {} } = options;

  // Build query
  let query = supabase
    .from(TABLES.MIDJOURNEY_PROMPTS)
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,slug.ilike.%${filters.search}%,prompt_text.ilike.%${filters.search}%`);
  }

  // Requirements: 8.2 - Filter by type (sref/prompt)
  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortDirection === 'asc' });

  // Apply pagination
  const offset = (page - 1) * pageSize;
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch prompts: ${error.message}`);
  }

  const prompts: PromptListItem[] = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    type: row.type,
    tags: row.tags,
    view_count: row.view_count,
    copy_count: row.copy_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  return {
    data: prompts,
    pagination: {
      page,
      pageSize,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    },
  };
}

/**
 * Get a single prompt by ID
 */
export async function getPromptById(id: string): Promise<MidjourneyPromptRow | null> {
  const supabase = await createClient();
  const promptsRepo = createMidjourneyPromptsRepository(supabase);

  return promptsRepo.findById(id);
}

/**
 * Create a new prompt
 *
 * Requirements: 8.4, 8.6
 */
export async function createPrompt(promptData: MidjourneyPromptInsert): Promise<MidjourneyPromptRow> {
  const supabase = await createClient();
  const promptsRepo = createMidjourneyPromptsRepository(supabase);

  return promptsRepo.create(promptData);
}

/**
 * Update an existing prompt
 *
 * Requirements: 8.4, 8.6
 */
export async function updatePrompt(
  id: string,
  promptData: MidjourneyPromptUpdate
): Promise<MidjourneyPromptRow> {
  const supabase = await createClient();
  const promptsRepo = createMidjourneyPromptsRepository(supabase);

  return promptsRepo.update(id, promptData);
}

/**
 * Delete a prompt
 */
export async function deletePrompt(id: string): Promise<void> {
  const supabase = await createClient();
  const promptsRepo = createMidjourneyPromptsRepository(supabase);

  await promptsRepo.delete(id);
}

/**
 * Bulk delete prompts
 *
 * Requirements: 8.3
 */
export async function bulkDeletePrompts(ids: string[]): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from(TABLES.MIDJOURNEY_PROMPTS)
    .delete()
    .in('id', ids);

  if (error) {
    throw new Error(`Failed to bulk delete prompts: ${error.message}`);
  }
}
