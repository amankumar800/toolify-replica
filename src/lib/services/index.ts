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
  createTool,
  updateTool,
  deleteTool,
  type GetToolsOptions,
  type CreateToolInput,
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
