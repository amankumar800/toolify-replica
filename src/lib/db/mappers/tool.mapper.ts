/**
 * Tool mapper functions for transforming between database rows and application types.
 * Handles snake_case to camelCase conversion and default value application.
 *
 * @module tool.mapper
 */

import type { ToolRow, ToolInsert, ToolWithCategories } from '../repositories/tools.repository';
import type { Tool, PricingType } from '@/lib/types/tool';

/**
 * Default values applied when database columns are null.
 * These ensure the application always has valid data to work with.
 */
export const TOOL_DEFAULTS = {
  description: '',
  shortDescription: '',
  image: 'https://placehold.co/600x400',
  tags: [] as string[],
  savedCount: 0,
  reviewCount: 0,
  reviewScore: 0,
  verified: false,
  isNew: false,
  isFeatured: false,
} as const;

/**
 * Valid pricing values for tools.
 */
const VALID_PRICING_VALUES: PricingType[] = [
  'Free',
  'Freemium',
  'Paid',
  'Free Trial',
  'Contact for Pricing',
];

/**
 * Validates and returns a valid pricing type, defaulting to 'Freemium' if invalid.
 */
function validatePricing(pricing: string | null): PricingType {
  if (pricing && VALID_PRICING_VALUES.includes(pricing as PricingType)) {
    return pricing as PricingType;
  }
  return 'Freemium';
}

/**
 * Maps a database tool row (snake_case) to an application Tool type (camelCase).
 * Applies default values for null fields.
 *
 * @param row - Database row with snake_case columns
 * @returns Application Tool object with camelCase properties
 *
 * @example
 * ```ts
 * const row = await toolsRepo.findBySlug('chatgpt');
 * const tool = mapToolRowToTool(row);
 * console.log(tool.shortDescription); // camelCase property
 * ```
 */
export function mapToolRowToTool(row: ToolRow): Tool {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? TOOL_DEFAULTS.description,
    shortDescription: row.short_description ?? TOOL_DEFAULTS.shortDescription,
    image: row.image_url ?? TOOL_DEFAULTS.image,
    websiteUrl: row.website_url,
    pricing: validatePricing(row.pricing),
    categories: [], // Will be populated by mapToolWithCategories if needed
    tags: row.tags ?? TOOL_DEFAULTS.tags,
    savedCount: row.saved_count ?? TOOL_DEFAULTS.savedCount,
    reviewCount: row.review_count ?? TOOL_DEFAULTS.reviewCount,
    reviewScore: row.review_score ?? TOOL_DEFAULTS.reviewScore,
    verified: row.verified ?? TOOL_DEFAULTS.verified,
    isNew: row.is_new ?? TOOL_DEFAULTS.isNew,
    isFeatured: row.is_featured ?? TOOL_DEFAULTS.isFeatured,
    dateAdded: row.created_at ?? undefined,
    monthlyVisits: row.monthly_visits ?? undefined,
    changePercentage: row.change_percentage ?? undefined,
  };
}


/**
 * Maps a database tool row with joined categories to an application Tool type.
 * Extracts category names from the joined tool_categories relationship.
 *
 * @param row - Database row with snake_case columns and joined categories
 * @returns Application Tool object with populated categories array
 *
 * @example
 * ```ts
 * const rows = await toolsRepo.findWithCategories();
 * const tools = rows.map(mapToolWithCategories);
 * console.log(tools[0].categories); // ['AI Chatbots', 'Productivity']
 * ```
 */
export function mapToolWithCategories(row: ToolWithCategories): Tool {
  const baseTool = mapToolRowToTool(row);
  
  // Extract category names from the joined relationship
  const categoryNames = row.categories?.map((cat) => cat.name) ?? [];
  
  return {
    ...baseTool,
    categories: categoryNames,
  };
}

/**
 * Maps an application Tool object (camelCase) to a database insert type (snake_case).
 * Used when creating or updating tools in the database.
 *
 * @param tool - Application Tool object (partial, without id and dateAdded)
 * @returns Database insert object with snake_case columns
 *
 * @example
 * ```ts
 * const toolData = { name: 'ChatGPT', slug: 'chatgpt', websiteUrl: 'https://chat.openai.com' };
 * const insert = mapToolToInsert(toolData);
 * await toolsRepo.create(insert);
 * ```
 */
export function mapToolToInsert(
  tool: Omit<Tool, 'id' | 'dateAdded' | 'categories'> & { categories?: string[] }
): ToolInsert {
  return {
    name: tool.name,
    slug: tool.slug,
    description: tool.description || null,
    short_description: tool.shortDescription || null,
    image_url: tool.image || null,
    website_url: tool.websiteUrl,
    pricing: tool.pricing || 'Freemium',
    tags: tool.tags || null,
    saved_count: tool.savedCount ?? null,
    review_count: tool.reviewCount ?? null,
    review_score: tool.reviewScore ?? null,
    verified: tool.verified ?? null,
    is_new: tool.isNew ?? null,
    is_featured: tool.isFeatured ?? null,
    monthly_visits: tool.monthlyVisits ?? null,
    change_percentage: tool.changePercentage ?? null,
  };
}

/**
 * Maps an application Tool update object (camelCase) to a database update type (snake_case).
 * Only includes fields that are present in the update object.
 *
 * @param updates - Partial Tool object with fields to update
 * @returns Database update object with snake_case columns
 *
 * @example
 * ```ts
 * const updates = { name: 'ChatGPT Plus', pricing: 'Paid' };
 * const dbUpdates = mapToolToUpdate(updates);
 * await toolsRepo.update(toolId, dbUpdates);
 * ```
 */
export function mapToolToUpdate(
  updates: Partial<Omit<Tool, 'id' | 'dateAdded' | 'categories'>>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (updates.name !== undefined) result.name = updates.name;
  if (updates.slug !== undefined) result.slug = updates.slug;
  if (updates.description !== undefined) result.description = updates.description || null;
  if (updates.shortDescription !== undefined) result.short_description = updates.shortDescription || null;
  if (updates.image !== undefined) result.image_url = updates.image || null;
  if (updates.websiteUrl !== undefined) result.website_url = updates.websiteUrl;
  if (updates.pricing !== undefined) result.pricing = updates.pricing;
  if (updates.tags !== undefined) result.tags = updates.tags || null;
  if (updates.savedCount !== undefined) result.saved_count = updates.savedCount;
  if (updates.reviewCount !== undefined) result.review_count = updates.reviewCount;
  if (updates.reviewScore !== undefined) result.review_score = updates.reviewScore;
  if (updates.verified !== undefined) result.verified = updates.verified;
  if (updates.isNew !== undefined) result.is_new = updates.isNew;
  if (updates.isFeatured !== undefined) result.is_featured = updates.isFeatured;
  if (updates.monthlyVisits !== undefined) result.monthly_visits = updates.monthlyVisits;
  if (updates.changePercentage !== undefined) result.change_percentage = updates.changePercentage;

  return result;
}
