/**
 * Admin Panel Form Data Types
 * 
 * These types define the shape of form data for all admin CRUD operations.
 * They are used for form state management and validation.
 * 
 * @module admin-forms
 */

// ============================================================================
// Tool Form Types
// ============================================================================

/**
 * Pricing options for tools
 */
export type ToolPricing = 'free' | 'freemium' | 'paid' | 'contact';

/**
 * Status options for tools (includes soft delete via 'archived')
 */
export type ToolStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'archived';

/**
 * Form data for creating/editing tools
 * Requirements: 3.8
 */
export interface ToolFormData {
  name: string;
  slug: string;
  website_url: string;
  description?: string;
  short_description?: string;
  image_url?: string;
  pricing?: ToolPricing;
  status?: ToolStatus;
  is_featured?: boolean;
  is_new?: boolean;
  verified?: boolean;
  tags?: string[];
  category_ids?: string[];
  monthly_visits?: number;
  review_score?: number;
  review_count?: number;
  metadata?: Record<string, unknown>;
  submitter_name?: string;
  submitter_email?: string;
  rejection_reason?: string;
}

// ============================================================================
// Category Form Types
// ============================================================================

/**
 * Form data for creating/editing categories
 * Requirements: 5.5
 */
export interface CategoryFormData {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Subcategory Form Types
// ============================================================================

/**
 * Form data for creating/editing subcategories
 * Requirements: 6.5
 */
export interface SubcategoryFormData {
  name: string;
  slug: string;
  category_id: string;
  display_order?: number;
}

// ============================================================================
// AI News Form Types
// ============================================================================

/**
 * Category options for AI news articles
 */
export type NewsCategory = 
  | 'AI Research' 
  | 'Industry News' 
  | 'Product Launch' 
  | 'Tutorial' 
  | 'Opinion';

/**
 * Form data for creating/editing AI news articles
 * Requirements: 7.6
 */
export interface AINewsFormData {
  title: string;
  slug: string;
  content?: string;
  summary?: string;
  author_name?: string;
  author_avatar?: string;
  source_name?: string;
  source_url?: string;
  category?: NewsCategory;
  tags?: string[];
  is_published?: boolean;
  published_at?: Date;
  priority_score?: number;
}

// ============================================================================
// Prompt Form Types
// ============================================================================

/**
 * Type options for prompts
 */
export type PromptType = 'sref' | 'prompt';

/**
 * Form data for creating/editing prompts
 * Requirements: 8.4
 */
export interface PromptFormData {
  title: string;
  slug: string;
  type: PromptType;
  prompt_text?: string;
  sref_code?: string;
  image_url?: string;
  tags?: string[];
}

// ============================================================================
// FAQ Form Types
// ============================================================================

/**
 * Category options for FAQs
 */
export type FAQCategory = 'General' | 'Tools' | 'Account' | 'Technical';

/**
 * Form data for creating/editing FAQs
 * Requirements: 9.5
 */
export interface FAQFormData {
  question: string;
  answer: string;
  category?: FAQCategory;
  display_order?: number;
}

// ============================================================================
// Featured Tool Form Types
// ============================================================================

/**
 * Placement type options for featured tools
 */
export type FeaturedPlacementType = 'homepage' | 'category' | 'search';

/**
 * Form data for creating/editing featured tools
 * Requirements: 10.5
 */
export interface FeaturedToolFormData {
  tool_id: string;
  placement_type?: FeaturedPlacementType;
  is_sponsored?: boolean;
  sponsor_name?: string;
  campaign_id?: string;
  start_date?: Date;
  end_date?: Date;
  display_order?: number;
}

// ============================================================================
// Admin Form Types
// ============================================================================

/**
 * Form data for creating/editing admin users
 * Requirements: 11.4
 */
export interface AdminFormData {
  email: string;
  password?: string; // Only required on create
  is_active?: boolean;
}

// ============================================================================
// Read-Only Display Types (for forms showing computed/audit fields)
// ============================================================================

/**
 * Audit fields displayed as read-only in forms
 */
export interface AuditFields {
  created_at: Date;
  updated_at: Date;
}

/**
 * Tool analytics fields (read-only)
 */
export interface ToolAnalytics {
  view_count?: number;
  search_vector?: string;
}

/**
 * News analytics fields (read-only)
 */
export interface NewsAnalytics {
  view_count: number;
  like_count: number;
}

/**
 * Prompt analytics fields (read-only)
 */
export interface PromptAnalytics {
  view_count: number;
  copy_count: number;
}

/**
 * Featured tool analytics fields (read-only)
 */
export interface FeaturedToolAnalytics {
  impression_count: number;
  click_count: number;
}

/**
 * Admin status fields (read-only)
 */
export interface AdminStatusFields {
  last_login_at?: Date;
  failed_login_attempts: number;
  locked_until?: Date;
}

/**
 * Computed count fields (read-only)
 */
export interface ComputedCounts {
  tool_count?: number;
  category_count?: number;
}
