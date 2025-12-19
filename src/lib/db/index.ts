/**
 * Database layer barrel export.
 *
 * This module provides a unified entry point for all database-related
 * functionality including repositories, mappers, constants, and error types.
 *
 * @module db
 *
 * @example
 * ```ts
 * import {
 *   // Repositories
 *   createToolsRepository,
 *   createCategoriesRepository,
 *
 *   // Mappers
 *   mapToolRowToTool,
 *   mapCategoryRowToCategory,
 *
 *   // Constants
 *   TABLES,
 *   TOOL_COLUMNS,
 *
 *   // Errors
 *   DatabaseError,
 *   NotFoundError,
 * } from '@/lib/db';
 * ```
 */

// Re-export repositories
export * from './repositories';

// Re-export mappers
export * from './mappers';

// Re-export constants
export * from './constants';

// Re-export error types
export {
  DatabaseError,
  NotFoundError,
  ValidationError,
} from './errors';
