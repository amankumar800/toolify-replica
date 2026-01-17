/**
 * Admin CRUD Service Types
 * 
 * These types define pagination, filtering, sorting, and response structures
 * for all admin CRUD operations.
 * 
 * @module admin-crud.types
 */

import type {
  ToolStatus,
  ToolPricing,
  ToolPlatform,
  NewsCategory,
  PromptType,
  FAQCategory,
  FeaturedPlacementType,
} from '@/lib/types/admin-forms';

// ============================================================================
// Common Types
// ============================================================================

/**
 * Pagination parameters for list queries
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Sort direction options
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort parameters for list queries
 */
export interface SortParams {
  sortBy: string;
  sortDirection: SortDirection;
}

/**
 * Base filter parameters with optional search
 */
export interface FilterParams {
  search?: string;
  [key: string]: unknown;
}

/**
 * Pagination metadata in list responses
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Generic list response wrapper
 */
export interface ListResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ============================================================================
// Tool Filters
// ============================================================================

/**
 * Filter parameters for tools list
 * Requirements: 3.4, 3.5
 */
export interface ToolFilters extends FilterParams {
  status?: ToolStatus;
  is_featured?: boolean;
  pricing?: ToolPricing;
  platform?: ToolPlatform;
  includeArchived?: boolean;
}

// ============================================================================
// Category Filters
// ============================================================================

/**
 * Filter parameters for categories list
 * Requirements: 5.2
 */
export interface CategoryFilters extends FilterParams {
  // Categories can be filtered by search
}

// ============================================================================
// Subcategory Filters
// ============================================================================

/**
 * Filter parameters for subcategories list
 * Requirements: 6.2
 */
export interface SubcategoryFilters extends FilterParams {
  category_id?: string;
}

// ============================================================================
// AI News Filters
// ============================================================================

/**
 * Filter parameters for AI news list
 * Requirements: 7.2
 */
export interface NewsFilters extends FilterParams {
  is_published?: boolean;
  category?: NewsCategory;
}

// ============================================================================
// Prompt Filters
// ============================================================================

/**
 * Filter parameters for prompts list
 * Requirements: 8.2
 */
export interface PromptFilters extends FilterParams {
  type?: PromptType;
}

// ============================================================================
// FAQ Filters
// ============================================================================

/**
 * Filter parameters for FAQs list
 * Requirements: 9.2
 */
export interface FAQFilters extends FilterParams {
  category?: FAQCategory;
}

// ============================================================================
// Featured Tool Filters
// ============================================================================

/**
 * Status options for featured tools (calculated from dates)
 */
export type FeaturedToolStatus = 'active' | 'expired' | 'scheduled';

/**
 * Filter parameters for featured tools list
 * Requirements: 10.2
 */
export interface FeaturedToolFilters extends FilterParams {
  placement_type?: FeaturedPlacementType;
  is_sponsored?: boolean;
  status?: FeaturedToolStatus;
}

// ============================================================================
// Admin Filters
// ============================================================================

/**
 * Status options for admin users
 */
export type AdminStatus = 'active' | 'inactive' | 'locked';

/**
 * Filter parameters for admins list
 */
export interface AdminFilters extends FilterParams {
  status?: AdminStatus;
}

// ============================================================================
// User Activity Filters
// ============================================================================

/**
 * Filter parameters for user activity (favorites) list
 * Requirements: 12.3, 12.4
 */
export interface UserActivityFilters extends FilterParams {
  is_shortcut?: boolean;
}

// ============================================================================
// Aggregate Statistics Types
// ============================================================================

/**
 * User activity aggregate statistics
 * Requirements: 12.5
 */
export interface UserActivityStats {
  totalFavorites: number;
  totalShortcuts: number;
  topFavoritedTools: Array<{
    tool_id: string;
    tool_name: string;
    favorite_count: number;
  }>;
}

// ============================================================================
// Dashboard Statistics Types
// ============================================================================

/**
 * Dashboard stat card data
 * Requirements: 2.1
 */
export interface DashboardStats {
  totalTools: number;
  totalCategories: number;
  totalSubcategories: number;
  totalNews: number;
  totalPrompts: number;
  totalFaqs: number;
  activeFeaturedTools: number;
  totalAdmins: number;
}

/**
 * Recent activity item for dashboard
 * Requirements: 2.3
 */
export interface RecentActivityItem {
  id: string;
  type: 'tool' | 'news' | 'prompt';
  title: string;
  action: 'created' | 'updated';
  timestamp: Date;
  href: string;
}

// ============================================================================
// Bulk Action Types
// ============================================================================

/**
 * Result of a bulk action operation
 */
export interface BulkActionResult {
  success: boolean;
  affectedCount: number;
  errors?: Array<{
    id: string;
    error: string;
  }>;
}

// ============================================================================
// Global Search Types
// ============================================================================

/**
 * Content types searchable via global search
 * Requirements: 16.1
 */
export type SearchableContentType = 'tool' | 'news' | 'prompt' | 'category' | 'faq';

/**
 * Global search result item
 * Requirements: 16.3, 16.4
 */
export interface GlobalSearchResult {
  id: string;
  type: SearchableContentType;
  title: string;
  subtitle?: string;
  href: string;
  matchedText?: string;
}

/**
 * Global search response grouped by type
 */
export interface GlobalSearchResponse {
  results: GlobalSearchResult[];
  totalByType: Record<SearchableContentType, number>;
}

// ============================================================================
// CSV Export Types
// ============================================================================

/**
 * CSV export options
 * Requirements: 17.2, 17.3
 */
export interface CSVExportOptions {
  tableName: string;
  columns: string[];
  filters?: FilterParams;
  maxRecords?: number; // Default: 10000
}

/**
 * CSV export result
 */
export interface CSVExportResult {
  filename: string;
  content: string;
  recordCount: number;
  truncated: boolean;
}

// ============================================================================
// Duplicate Detection Types
// ============================================================================

/**
 * Potential duplicate match
 * Requirements: 21.1, 21.2
 */
export interface DuplicateMatch {
  id: string;
  name: string;
  matchType: 'name' | 'url';
  matchScore: number; // 0-100 for fuzzy name match
  href: string;
}

/**
 * Duplicate detection result
 */
export interface DuplicateDetectionResult {
  hasDuplicates: boolean;
  matches: DuplicateMatch[];
}

// ============================================================================
// Related Data Types
// ============================================================================

/**
 * Related data item for display in forms
 * Requirements: 20.1-20.5
 */
export interface RelatedDataItem {
  id: string;
  name: string;
  href: string;
}

/**
 * Related data section
 */
export interface RelatedDataSection {
  title: string;
  items: RelatedDataItem[];
  totalCount: number;
  viewAllHref: string;
}

// ============================================================================
// Cascade Delete Types
// ============================================================================

/**
 * Affected records for cascade delete warning
 * Requirements: 5.7, 5.8
 */
export interface AffectedRecords {
  type: string;
  count: number;
  items?: string[];
}

/**
 * Delete preview showing what will be affected
 */
export interface DeletePreview {
  canDelete: boolean;
  affectedRecords: AffectedRecords[];
  warningMessage?: string;
}
