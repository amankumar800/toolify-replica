/**
 * Free AI Tools Data Models
 * 
 * TypeScript interfaces and Zod schemas for the Free AI Tools feature.
 * Implements Requirements: 13.2, 13.3, 13.4, 13.5, 13.6
 */

import { z } from 'zod';

// =============================================================================
// Zod Schemas for Runtime Validation
// =============================================================================

/**
 * CategoryRef Schema - Lightweight reference for navigation
 * Used for previousCategory and nextCategory references
 */
export const CategoryRefSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

/**
 * Tool Schema - Individual AI tool data
 * Requirement 13.5: Tool storage with validation
 * - slug: max 100 characters, alphanumeric with hyphens only
 * - externalUrl: validated URL format, nullable
 * - description: max 500 characters
 */
export const ToolSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z
    .string()
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase alphanumeric characters and hyphens'),
  externalUrl: z.string().url().nullable(),
  description: z.string().max(500),
  freeTierDetails: z.string().nullable(),
  pricing: z.string().nullable(),
  categoryIds: z.array(z.string()),
});

/**
 * Subcategory Schema - Grouped tools within a category
 * Requirement 13.4: Subcategory storage
 */
export const SubcategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1), // e.g., "Free AI Chatbot"
  toolCount: z.number().int().nonnegative(),
  tools: z.array(ToolSchema),
});


/**
 * Category Schema - Main category data
 * Requirement 13.3: Category storage with all metadata
 */
export const CategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  icon: z.string(),
  description: z.string(),
  toolCount: z.number().int().nonnegative(),
  subcategories: z.array(SubcategorySchema),
  previousCategory: CategoryRefSchema.nullable(),
  nextCategory: CategoryRefSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * FeaturedTool Schema - Featured/sponsored tools for main page
 * Requirement 13.6: FeaturedTool storage with optional badge
 */
export const FeaturedToolSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  imageUrl: z.string().url(),
  description: z.string(),
  badge: z.enum(['Free', 'New', 'Popular']).nullable(),
  displayOrder: z.number().int().nonnegative(),
});

/**
 * FAQItem Schema - FAQ questions and answers
 */
export const FAQItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

/**
 * ScrapingMetadata Schema - Metadata about scraping runs
 * Requirement 13.8: ScrapingMetadata storage
 */
export const ScrapingMetadataSchema = z.object({
  lastScrapedAt: z.string().datetime(),
  totalTools: z.number().int().nonnegative(),
  totalCategories: z.number().int().nonnegative(),
  scrapeDurationMs: z.number().int().nonnegative(),
  version: z.string(),
});

// =============================================================================
// TypeScript Types (derived from Zod schemas)
// =============================================================================

export type CategoryRef = z.infer<typeof CategoryRefSchema>;
export type Tool = z.infer<typeof ToolSchema>;
export type Subcategory = z.infer<typeof SubcategorySchema>;
export type Category = z.infer<typeof CategorySchema>;
export type FeaturedTool = z.infer<typeof FeaturedToolSchema>;
export type FAQItem = z.infer<typeof FAQItemSchema>;
export type ScrapingMetadata = z.infer<typeof ScrapingMetadataSchema>;

// =============================================================================
// Collection Schemas (for JSON file validation)
// =============================================================================

/**
 * Schema for categories.json - array of category metadata (without full tool data)
 */
export const CategoriesListSchema = z.array(
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    slug: z.string().min(1),
    icon: z.string(),
    toolCount: z.number().int().nonnegative(),
  })
);

export type CategoryListItem = z.infer<typeof CategoriesListSchema>[number];

/**
 * Schema for featured-tools.json
 */
export const FeaturedToolsListSchema = z.array(FeaturedToolSchema);

/**
 * Schema for faq.json
 */
export const FAQListSchema = z.array(FAQItemSchema);

// =============================================================================
// Validation Helper Functions
// =============================================================================

/**
 * Validates a category object against the schema
 * @throws ZodError if validation fails
 */
export function validateCategory(data: unknown): Category {
  return CategorySchema.parse(data);
}

/**
 * Validates a tool object against the schema
 * @throws ZodError if validation fails
 */
export function validateTool(data: unknown): Tool {
  return ToolSchema.parse(data);
}

/**
 * Validates a featured tool object against the schema
 * @throws ZodError if validation fails
 */
export function validateFeaturedTool(data: unknown): FeaturedTool {
  return FeaturedToolSchema.parse(data);
}

/**
 * Safe validation that returns a result object instead of throwing
 */
export function safeValidateCategory(data: unknown): { success: true; data: Category } | { success: false; error: z.ZodError } {
  const result = CategorySchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Safe validation for tools
 */
export function safeValidateTool(data: unknown): { success: true; data: Tool } | { success: false; error: z.ZodError } {
  const result = ToolSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
