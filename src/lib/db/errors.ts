/**
 * Custom error types for database operations.
 * Provides structured error handling with context for different failure modes.
 */

/**
 * Error thrown when a database operation fails.
 * Contains context about the operation, table, and original error.
 */
export class DatabaseError extends Error {
  public readonly name = 'DatabaseError';

  constructor(
    public readonly operation: string,
    public readonly table: string,
    message: string,
    public readonly originalError?: unknown
  ) {
    super(`Database error in ${operation} on ${table}: ${message}`);
    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }
}

/**
 * Error thrown when a required record is not found.
 * Contains the entity type and identifier that was searched for.
 */
export class NotFoundError extends Error {
  public readonly name = 'NotFoundError';

  constructor(
    public readonly entity: string,
    public readonly identifier: string
  ) {
    super(`${entity} not found: ${identifier}`);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotFoundError);
    }
  }
}

/**
 * Error thrown when input validation fails.
 * Contains the field name and validation message.
 */
export class ValidationError extends Error {
  public readonly name = 'ValidationError';

  constructor(
    public readonly field: string,
    message: string
  ) {
    super(`Validation error on ${field}: ${message}`);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}
