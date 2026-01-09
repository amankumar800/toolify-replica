/**
 * Services layer barrel export.
 *
 * This module provides a unified entry point for all service-layer
 * functionality including tools, categories, and related operations.
 *
 * @module services
 *
 * @example
 * ```ts
 * import {
 *   // Tools service
 *   getTools,
 *   getToolBySlug,
 *   getFeaturedTools,
 *   createTool,
 *   updateTool,
 *   deleteTool,
 *
 *   // Categories service
 *   getCategories,
 *   getCategoryBySlug,
 *   getCategoryGroups,
 *   getSubcategories,
 *   getFaqs,
 * } from '@/lib/services';
 * ```
 */

// Tools service exports
export {
  getTools,
  getToolBySlug,
  getFeaturedTools,
  createToolPublic as createTool,
  updateToolPublic as updateTool,
  deleteTool,
  type GetToolsOptions,
  type CreateToolInput,
  type GetToolBySlugOptions,
  type Tool,
} from './tools.service';

// Categories service exports
export {
  getCategories,
  getCategoryBySlug,
  getCategoryGroups,
  getSubcategories,
  getFaqs,
  type GetCategoriesOptions,
  type Subcategory,
  type FAQ,
} from './categories.service';

// Admin dashboard service exports
export {
  getToolsCount,
  getCategoriesCount,
  getAiNewsCount,
  getRecentTools,
  getDashboardStats,
  type DashboardStats,
  type RecentTool,
} from './admin-dashboard.service';

// Public stats service exports
export {
  getHomePageStats,
  type HomePageStats,
} from './stats.service';
