/**
 * Database table name constants.
 * Centralized table naming for single-point updates when tables are renamed.
 */
export const TABLES = {
  TOOLS: 'tools',
  CATEGORIES: 'categories',
  CATEGORY_GROUPS: 'category_groups',
  SUBCATEGORIES: 'subcategories',
  TOOL_CATEGORIES: 'tool_categories',
  FEATURED_TOOLS: 'featured_tools',
  FAQS: 'faqs',
  USER_FAVORITES: 'user_favorites',
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];
