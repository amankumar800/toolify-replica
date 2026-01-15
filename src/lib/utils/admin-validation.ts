/**
 * Admin Panel Validation Schemas
 * 
 * Zod schemas for validating all admin form data.
 * Includes slug validation, conditional field validation, and URL validation.
 * 
 * Requirements: 14.1, 14.2, 14.9, 14.10
 * 
 * @module admin-validation
 */

import { z } from 'zod';

// ============================================================================
// Common Validation Patterns
// ============================================================================

/**
 * Slug validation regex - lowercase letters, numbers, and hyphens only
 * Must start and end with alphanumeric character
 */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * URL validation regex - must start with http:// or https://
 * Requirements: 14.10
 */
export const URL_REGEX = /^https?:\/\/.+/;

/**
 * Required field error message
 * Requirements: 14.9
 */
export const REQUIRED_FIELD_MESSAGE = 'This field is required';

// ============================================================================
// Common Field Schemas
// ============================================================================

/**
 * Slug field schema with proper validation
 */
export const slugSchema = z
  .string({ error: REQUIRED_FIELD_MESSAGE })
  .min(1, REQUIRED_FIELD_MESSAGE)
  .regex(SLUG_REGEX, 'Slug must be lowercase with hyphens only (e.g., my-slug-name)');

/**
 * URL field schema - validates URL format
 * Requirements: 14.10
 */
export const urlSchema = z
  .string()
  .regex(URL_REGEX, 'URL must start with http:// or https://')
  .or(z.literal(''));

/**
 * Optional URL field schema
 */
export const optionalUrlSchema = urlSchema.optional();

/**
 * Required URL field schema
 */
export const requiredUrlSchema = z
  .string({ error: REQUIRED_FIELD_MESSAGE })
  .min(1, REQUIRED_FIELD_MESSAGE)
  .regex(URL_REGEX, 'URL must start with http:// or https://');

/**
 * Email field schema
 */
export const emailSchema = z
  .string({ error: REQUIRED_FIELD_MESSAGE })
  .min(1, REQUIRED_FIELD_MESSAGE)
  .email('Please enter a valid email address');

/**
 * Optional email field schema
 */
export const optionalEmailSchema = z
  .string()
  .email('Please enter a valid email address')
  .or(z.literal(''))
  .optional();

// ============================================================================
// Tool Validation Schema
// ============================================================================

/**
 * Tool pricing options
 */
export const toolPricingOptions = ['free', 'freemium', 'paid', 'contact'] as const;

/**
 * Tool status options (includes archived for soft delete)
 */
export const toolStatusOptions = ['draft', 'pending', 'published', 'rejected', 'archived'] as const;

/**
 * Tool form validation schema
 * Requirements: 3.8
 */
export const toolSchema = z.object({
  name: z
    .string({ error: REQUIRED_FIELD_MESSAGE })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  slug: slugSchema,
  website_url: requiredUrlSchema,
  description: z.string().max(5000, 'Description must be at most 5000 characters').optional(),
  short_description: z.string().max(300, 'Short description must be at most 300 characters').optional(),
  image_url: optionalUrlSchema,
  pricing: z.enum(toolPricingOptions).optional(),
  status: z.enum(toolStatusOptions).optional(),
  is_featured: z.boolean().optional(),
  is_new: z.boolean().optional(),
  verified: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  category_ids: z.array(z.string().uuid('Invalid category ID')).optional(),
  monthly_visits: z.number().min(0, 'Monthly visits must be non-negative').optional(),
  review_score: z.number().min(0, 'Review score must be at least 0').max(5, 'Review score must be at most 5').optional(),
  review_count: z.number().min(0, 'Review count must be non-negative').optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  submitter_name: z.string().optional(),
  submitter_email: optionalEmailSchema,
  rejection_reason: z.string().optional(),
  // Platform availability
  has_mobile_app: z.boolean().optional(),
  has_browser_extension: z.boolean().optional(),
  has_discord_bot: z.boolean().optional(),
});

export type ToolSchemaType = z.infer<typeof toolSchema>;

// ============================================================================
// Category Validation Schema
// ============================================================================

/**
 * Category form validation schema
 * Requirements: 5.5
 */
export const categorySchema = z.object({
  name: z
    .string({ error: REQUIRED_FIELD_MESSAGE })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  slug: slugSchema,
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  icon: z.string().optional(),
  display_order: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CategorySchemaType = z.infer<typeof categorySchema>;

// ============================================================================
// Subcategory Validation Schema
// ============================================================================

/**
 * Subcategory form validation schema
 * Requirements: 6.5
 */
export const subcategorySchema = z.object({
  name: z
    .string({ error: REQUIRED_FIELD_MESSAGE })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  slug: slugSchema,
  category_id: z
    .string({ error: REQUIRED_FIELD_MESSAGE })
    .min(1, REQUIRED_FIELD_MESSAGE)
    .uuid('Invalid category ID'),
  display_order: z.number().optional(),
});

export type SubcategorySchemaType = z.infer<typeof subcategorySchema>;

// ============================================================================
// AI News Validation Schema
// ============================================================================

/**
 * AI News category options
 */
export const newsCategoryOptions = [
  'AI Research',
  'Industry News',
  'Product Launch',
  'Tutorial',
  'Opinion',
] as const;

/**
 * AI News form validation schema
 * Requirements: 7.6
 */
export const aiNewsSchema = z.object({
  title: z
    .string({ error: REQUIRED_FIELD_MESSAGE })
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be at most 200 characters'),
  slug: slugSchema,
  content: z.string().max(50000, 'Content must be at most 50000 characters').optional(),
  summary: z.string().max(500, 'Summary must be at most 500 characters').optional(),
  author_name: z.string().max(100, 'Author name must be at most 100 characters').optional(),
  author_avatar: optionalUrlSchema,
  source_name: z.string().max(100, 'Source name must be at most 100 characters').optional(),
  source_url: optionalUrlSchema,
  category: z.enum(newsCategoryOptions).optional(),
  tags: z.array(z.string()).optional(),
  is_published: z.boolean().optional(),
  published_at: z.date().optional(),
  priority_score: z.number().min(0, 'Priority score must be at least 0').max(100, 'Priority score must be at most 100').optional(),
});

export type AINewsSchemaType = z.infer<typeof aiNewsSchema>;

// ============================================================================
// Prompt Validation Schema
// ============================================================================

/**
 * Prompt type options
 */
export const promptTypeOptions = ['sref', 'prompt'] as const;

/**
 * Prompt form validation schema with conditional sref_code requirement
 * Requirements: 8.4, 8.6
 * 
 * Property 16: Conditional Field Validation
 * When type is 'sref', sref_code is required
 */
export const promptSchema = z
  .object({
    title: z
      .string({ error: REQUIRED_FIELD_MESSAGE })
      .min(5, 'Title must be at least 5 characters')
      .max(200, 'Title must be at most 200 characters'),
    slug: slugSchema,
    type: z.enum(promptTypeOptions, { error: REQUIRED_FIELD_MESSAGE }),
    prompt_text: z.string().max(2000, 'Prompt text must be at most 2000 characters').optional(),
    sref_code: z.string().optional(),
    image_url: optionalUrlSchema,
    tags: z.array(z.string()).optional(),
  })
  .refine(
    (data) => data.type !== 'sref' || (data.sref_code && data.sref_code.length > 0),
    {
      message: 'SREF code is required when type is sref',
      path: ['sref_code'],
    }
  );

export type PromptSchemaType = z.infer<typeof promptSchema>;

// ============================================================================
// FAQ Validation Schema
// ============================================================================

/**
 * FAQ category options
 */
export const faqCategoryOptions = ['General', 'Tools', 'Account', 'Technical'] as const;

/**
 * FAQ form validation schema
 * Requirements: 9.5
 */
export const faqSchema = z.object({
  question: z
    .string({ error: REQUIRED_FIELD_MESSAGE })
    .min(10, 'Question must be at least 10 characters')
    .max(500, 'Question must be at most 500 characters'),
  answer: z
    .string({ error: REQUIRED_FIELD_MESSAGE })
    .min(1, REQUIRED_FIELD_MESSAGE)
    .max(5000, 'Answer must be at most 5000 characters'),
  category: z.enum(faqCategoryOptions).optional(),
  display_order: z.number().optional(),
});

export type FAQSchemaType = z.infer<typeof faqSchema>;

// ============================================================================
// Featured Tool Validation Schema
// ============================================================================

/**
 * Featured tool placement type options
 */
export const featuredPlacementOptions = ['homepage', 'category', 'search'] as const;

/**
 * Featured tool form validation schema with conditional sponsor_name requirement
 * Requirements: 10.5, 10.7
 * 
 * Property 16: Conditional Field Validation
 * When is_sponsored is true, sponsor_name is required
 */
export const featuredToolSchema = z
  .object({
    tool_id: z
      .string({ error: REQUIRED_FIELD_MESSAGE })
      .min(1, REQUIRED_FIELD_MESSAGE)
      .uuid('Invalid tool ID'),
    placement_type: z.enum(featuredPlacementOptions).optional(),
    is_sponsored: z.boolean().optional(),
    sponsor_name: z.string().optional(),
    campaign_id: z.string().optional(),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
    display_order: z.number().optional(),
  })
  .refine(
    (data) => !data.is_sponsored || (data.sponsor_name && data.sponsor_name.length > 0),
    {
      message: 'Sponsor name is required when sponsored',
      path: ['sponsor_name'],
    }
  )
  .refine(
    (data) => !data.end_date || !data.start_date || data.end_date >= data.start_date,
    {
      message: 'End date must be after start date',
      path: ['end_date'],
    }
  );

export type FeaturedToolSchemaType = z.infer<typeof featuredToolSchema>;

// ============================================================================
// Admin Validation Schema
// ============================================================================

/**
 * Password validation requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export const passwordSchema = z
  .string({ error: REQUIRED_FIELD_MESSAGE })
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Admin form validation schema for creating new admins
 * Requirements: 11.4
 */
export const adminCreateSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  is_active: z.boolean().optional().default(true),
});

export type AdminCreateSchemaType = z.infer<typeof adminCreateSchema>;

/**
 * Admin form validation schema for editing existing admins
 * Password is optional when editing
 */
export const adminEditSchema = z.object({
  email: emailSchema,
  password: passwordSchema.optional(),
  is_active: z.boolean().optional(),
});

export type AdminEditSchemaType = z.infer<typeof adminEditSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Extract error messages from Zod validation result
 */
function extractErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}

/**
 * Validate form data against a schema and return formatted errors
 * 
 * @param schema - Zod schema to validate against
 * @param data - Form data to validate
 * @returns Object with success flag and either data or errors
 */
export function validateFormData<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: extractErrors(result.error) };
}

/**
 * Check if a value is a valid slug
 */
export function isValidSlug(value: string): boolean {
  return SLUG_REGEX.test(value);
}

/**
 * Check if a value is a valid URL (http or https)
 */
export function isValidUrl(value: string): boolean {
  if (!value) return true; // Empty is valid for optional fields
  return URL_REGEX.test(value);
}

/**
 * Generate a slug from a string
 */
export function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}
