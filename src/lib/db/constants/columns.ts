/**
 * Column mapping constants for database tables.
 * Maps application property names (camelCase) to database column names (snake_case).
 * Enables single-point updates when database columns are renamed.
 */

/** Maps application property names to database column names for tools table */
export const TOOL_COLUMNS = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  shortDescription: 'short_description',
  imageUrl: 'image_url',
  websiteUrl: 'website_url',
  externalUrl: 'external_url',
  pricing: 'pricing',
  tags: 'tags',
  savedCount: 'saved_count',
  reviewCount: 'review_count',
  reviewScore: 'review_score',
  verified: 'verified',
  isNew: 'is_new',
  isFeatured: 'is_featured',
  monthlyVisits: 'monthly_visits',
  changePercentage: 'change_percentage',
  freeTierDetails: 'free_tier_details',
  metadata: 'metadata',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
} as const;

/** Maps application property names to database column names for categories table */
export const CATEGORY_COLUMNS = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  icon: 'icon',
  toolCount: 'tool_count',
  displayOrder: 'display_order',
  metadata: 'metadata',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
} as const;

/** Maps application property names to database column names for subcategories table */
export const SUBCATEGORY_COLUMNS = {
  id: 'id',
  categoryId: 'category_id',
  name: 'name',
  slug: 'slug',
  toolCount: 'tool_count',
  displayOrder: 'display_order',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
} as const;

/** Maps application property names to database column names for category_groups table */
export const CATEGORY_GROUP_COLUMNS = {
  id: 'id',
  name: 'name',
  iconName: 'icon_name',
  displayOrder: 'display_order',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
} as const;

/** Maps application property names to database column names for faqs table */
export const FAQ_COLUMNS = {
  id: 'id',
  question: 'question',
  answer: 'answer',
  displayOrder: 'display_order',
  createdAt: 'created_at',
} as const;

/** Maps application property names to database column names for featured_tools table */
export const FEATURED_TOOL_COLUMNS = {
  id: 'id',
  toolId: 'tool_id',
  displayOrder: 'display_order',
  createdAt: 'created_at',
} as const;

/** Maps application property names to database column names for tool_categories junction table */
export const TOOL_CATEGORY_COLUMNS = {
  toolId: 'tool_id',
  categoryId: 'category_id',
  createdAt: 'created_at',
} as const;

/** Maps application property names to database column names for user_favorites table */
export const USER_FAVORITE_COLUMNS = {
  id: 'id',
  userEmail: 'user_email',
  toolId: 'tool_id',
  toolName: 'tool_name',
  categoryId: 'category_id',
  createdAt: 'created_at',
} as const;

export type ToolColumnKey = keyof typeof TOOL_COLUMNS;
export type CategoryColumnKey = keyof typeof CATEGORY_COLUMNS;
export type SubcategoryColumnKey = keyof typeof SUBCATEGORY_COLUMNS;
