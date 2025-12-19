/**
 * Tools service layer for business logic orchestration.
 * Provides functions for managing tools with validation and error handling.
 *
 * @module tools.service
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createToolsRepository } from '@/lib/db/repositories/tools.repository';
import {
  mapToolRowToTool,
  mapToolWithCategories,
  mapToolToInsert,
  mapToolToUpdate,
} from '@/lib/db/mappers/tool.mapper';
import { ValidationError } from '@/lib/db/errors';
import type { Tool, PricingType } from '@/lib/types/tool';

/**
 * Options for filtering and paginating tools.
 */
export interface GetToolsOptions {
  /** Filter by category slug */
  category?: string;
  /** Filter by pricing type */
  pricing?: string;
  /** Search query for name/description */
  search?: string;
  /** Maximum number of results */
  limit?: number;
  /** Number of results to skip */
  offset?: number;
}

/**
 * Input data for creating a new tool.
 */
export interface CreateToolInput {
  /** Tool name (required) */
  name: string;
  /** URL-friendly slug (required) */
  slug: string;
  /** Website URL (required) */
  websiteUrl: string;
  /** Full description */
  description?: string;
  /** Short description for cards */
  shortDescription?: string;
  /** Image URL */
  image?: string;
  /** Pricing model */
  pricing?: PricingType;
  /** Tags for categorization */
  tags?: string[];
  /** Category IDs to link */
  categoryIds?: string[];
}

/**
 * Creates a tools repository instance with admin client.
 * Uses admin client to bypass RLS for all operations.
 */
function getToolsRepository() {
  const supabase = createAdminClient();
  return createToolsRepository(supabase);
}


/**
 * Fetches tools with optional filtering, pagination, and search.
 *
 * @param options - Filtering and pagination options
 * @returns Array of tools matching the criteria
 *
 * @example
 * ```ts
 * // Get all tools
 * const tools = await getTools();
 *
 * // Get tools by category with pagination
 * const tools = await getTools({ category: 'ai-chatbots', limit: 10, offset: 0 });
 *
 * // Search tools
 * const tools = await getTools({ search: 'chatgpt', limit: 20 });
 * ```
 */
export async function getTools(options?: GetToolsOptions): Promise<Tool[]> {
  const repo = getToolsRepository();

  // If searching, use the search method
  if (options?.search) {
    const rows = await repo.search(options.search, options?.limit);
    return rows.map(mapToolRowToTool);
  }

  // If filtering by category, use findByCategory
  if (options?.category) {
    const rows = await repo.findByCategory(options.category, options?.limit);

    // Apply pricing filter if specified
    let tools = rows.map(mapToolRowToTool);
    if (options?.pricing) {
      tools = tools.filter((t) => t.pricing === options.pricing);
    }

    return tools;
  }

  // Otherwise, get all tools with categories
  const rows = await repo.findWithCategories({
    limit: options?.limit,
    offset: options?.offset,
    orderBy: 'created_at',
    ascending: false,
  });

  let tools = rows.map(mapToolWithCategories);

  // Apply pricing filter if specified
  if (options?.pricing) {
    tools = tools.filter((t) => t.pricing === options.pricing);
  }

  return tools;
}

/**
 * Fetches a single tool by its slug.
 *
 * @param slug - URL-friendly identifier
 * @returns The tool or null if not found
 *
 * @example
 * ```ts
 * const tool = await getToolBySlug('chatgpt');
 * if (tool) {
 *   console.log(tool.name); // 'ChatGPT'
 * }
 * ```
 */
export async function getToolBySlug(slug: string): Promise<Tool | null> {
  const repo = getToolsRepository();
  const row = await repo.findBySlug(slug);

  if (!row) {
    return null;
  }

  return mapToolRowToTool(row);
}

/**
 * Fetches featured tools.
 *
 * @param limit - Maximum number of featured tools to return (default: 10)
 * @returns Array of featured tools
 *
 * @example
 * ```ts
 * const featured = await getFeaturedTools(5);
 * ```
 */
export async function getFeaturedTools(limit: number = 10): Promise<Tool[]> {
  const repo = getToolsRepository();
  const rows = await repo.findFeatured(limit);
  return rows.map(mapToolRowToTool);
}


/**
 * Creates a new tool with validation.
 *
 * @param data - Tool creation data
 * @returns The created tool
 * @throws {ValidationError} If required fields are missing
 *
 * @example
 * ```ts
 * const tool = await createTool({
 *   name: 'ChatGPT',
 *   slug: 'chatgpt',
 *   websiteUrl: 'https://chat.openai.com',
 *   pricing: 'Freemium',
 *   categoryIds: ['category-uuid-1'],
 * });
 * ```
 */
export async function createTool(data: CreateToolInput): Promise<Tool> {
  // Validate required fields
  if (!data.name || data.name.trim() === '') {
    throw new ValidationError('name', 'Name is required');
  }

  if (!data.slug || data.slug.trim() === '') {
    throw new ValidationError('slug', 'Slug is required');
  }

  if (!data.websiteUrl || data.websiteUrl.trim() === '') {
    throw new ValidationError('websiteUrl', 'Website URL is required');
  }

  const repo = getToolsRepository();

  // Map input to database insert format
  const insertData = mapToolToInsert({
    name: data.name,
    slug: data.slug,
    websiteUrl: data.websiteUrl,
    description: data.description ?? '',
    shortDescription: data.shortDescription ?? '',
    image: data.image ?? '',
    pricing: data.pricing ?? 'Freemium',
    tags: data.tags ?? [],
    savedCount: 0,
    reviewCount: 0,
    reviewScore: 0,
    verified: false,
    isNew: true,
    isFeatured: false,
  });

  // Create the tool
  const row = await repo.create(insertData);

  // Link to categories if provided
  if (data.categoryIds && data.categoryIds.length > 0) {
    for (const categoryId of data.categoryIds) {
      await repo.linkToCategory(row.id, categoryId);
    }
  }

  return mapToolRowToTool(row);
}

/**
 * Updates an existing tool.
 *
 * @param id - Tool ID
 * @param updates - Partial tool data to update
 * @returns The updated tool
 *
 * @example
 * ```ts
 * const updated = await updateTool('tool-uuid', {
 *   name: 'ChatGPT Plus',
 *   pricing: 'Paid',
 * });
 * ```
 */
export async function updateTool(
  id: string,
  updates: Partial<Omit<Tool, 'id' | 'dateAdded' | 'categories'>>
): Promise<Tool> {
  const repo = getToolsRepository();

  // Map updates to database format
  const dbUpdates = mapToolToUpdate(updates);

  // Update the tool
  const row = await repo.update(id, dbUpdates);

  return mapToolRowToTool(row);
}

/**
 * Deletes a tool and its category relationships.
 * The tool_categories junction table records are automatically deleted
 * via ON DELETE CASCADE constraint.
 *
 * @param id - Tool ID to delete
 *
 * @example
 * ```ts
 * await deleteTool('tool-uuid');
 * ```
 */
export async function deleteTool(id: string): Promise<void> {
  const repo = getToolsRepository();

  // Delete the tool - cascade will handle tool_categories cleanup
  await repo.delete(id);
}
