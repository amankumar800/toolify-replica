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
 *
 *   // Connection pooling utilities
 *   validateSupabaseConfig,
 *   CONNECTION_POOLING,
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

// Re-export connection pooling utilities
export {
  CONNECTION_POOLING,
  validateSupabaseConfig,
  checkConnectionHealth,
  getPoolerUrl,
  getProjectRef,
  getPoolingStatus,
  type ConnectionHealthStatus,
  type ConfigValidationResult,
} from './connection-pooling';
