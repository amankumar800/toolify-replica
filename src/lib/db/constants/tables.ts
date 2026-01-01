/**
 * Database table name constants.
 * Centralized table naming for single-point updates when tables are renamed.
 * 
 * Optimized Schema (10 tables):
 * - 8 existing tables (tools, categories, category_groups, subcategories, 
 *   tool_categories, featured_tools, faqs, user_favorites)
 * - 2 new tables (midjourney_prompts, ai_news)
 * 
 * Merged tables:
 * - tool_submissions → tools (via status column)
 * - user_tool_shortcuts → user_favorites (via is_shortcut column)
 * 
 * Deferred to external services:
 * - newsletter_subscriptions → Mailchimp/ConvertKit
 * - tool_analytics → Plausible/PostHog
 * - search_analytics → Plausible/PostHog
 */
export const TABLES = {
  // Core tables
  TOOLS: 'tools',
  CATEGORIES: 'categories',
  CATEGORY_GROUPS: 'category_groups',
  SUBCATEGORIES: 'subcategories',
  TOOL_CATEGORIES: 'tool_categories',
  FEATURED_TOOLS: 'featured_tools',
  FAQS: 'faqs',
  USER_FAVORITES: 'user_favorites',
  
  // New feature tables
  MIDJOURNEY_PROMPTS: 'midjourney_prompts',
  AI_NEWS: 'ai_news',
  
  // Admin authentication
  ADMINS: 'admins',
  
  // Settings
  SOCIAL_LINKS: 'social_links',
  COMPANY_PAGES: 'company_pages',
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];

/**
 * Tool status values for submission workflow.
 * Merged from tool_submissions table into tools table.
 */
export const TOOL_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
} as const;

export type ToolStatus = (typeof TOOL_STATUS)[keyof typeof TOOL_STATUS];

/**
 * Featured tool placement types for ad tracking.
 */
export const PLACEMENT_TYPES = {
  HOMEPAGE: 'homepage',
  CATEGORY: 'category',
  SEARCH: 'search',
} as const;

export type PlacementType = (typeof PLACEMENT_TYPES)[keyof typeof PLACEMENT_TYPES];

/**
 * Midjourney prompt types.
 */
export const PROMPT_TYPES = {
  SREF: 'sref',
  PROMPT: 'prompt',
} as const;

export type PromptType = (typeof PROMPT_TYPES)[keyof typeof PROMPT_TYPES];
