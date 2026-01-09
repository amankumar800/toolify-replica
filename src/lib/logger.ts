/**
 * Centralized Logging Service
 * 
 * This module provides a unified logging interface that replaces console.* calls.
 * In development, logs are output to the console.
 * In production, errors are sent to Sentry, and debug/info logs are suppressed.
 * 
 * Usage:
 * - logger.debug('message', data) - Debug info (dev only)
 * - logger.info('message', data) - Informational (dev only)
 * - logger.warn('message', data) - Warnings (dev + Sentry in prod)
 * - logger.error('message', error, context) - Errors (dev + Sentry)
 * 
 * @module logger
 */

import * as Sentry from '@sentry/nextjs';
import { captureError, type ErrorContext } from './error-tracking';

// ============================================================================
// Types
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  /** Component or module name */
  component?: string;
  /** Action being performed */
  action?: string;
  /** Additional data to log */
  data?: Record<string, unknown>;
}

// ============================================================================
// Configuration
// ============================================================================

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Log levels that should be output in production (errors always go to Sentry)
const PRODUCTION_LOG_LEVELS: LogLevel[] = [];

// Whether to send warnings to Sentry in production
const SEND_WARNINGS_TO_SENTRY = true;

// ============================================================================
// Logger Implementation
// ============================================================================

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  if (isDevelopment || isTest) {
    return true;
  }
  return PRODUCTION_LOG_LEVELS.includes(level);
}

/**
 * Format log message with optional context
 */
function formatMessage(message: string, context?: LogContext): string {
  if (context?.component) {
    return `[${context.component}${context.action ? `:${context.action}` : ''}] ${message}`;
  }
  return message;
}

/**
 * Debug level logging - development only
 * Use for detailed debugging information
 * 
 * @example
 * logger.debug('Processing items', { component: 'ToolsService', data: { count: items.length } });
 */
function debug(message: string, context?: LogContext): void {
  if (!shouldLog('debug')) return;
  
  const formattedMessage = formatMessage(message, context);
  if (context?.data) {
    console.debug(formattedMessage, context.data);
  } else {
    console.debug(formattedMessage);
  }
}

/**
 * Info level logging - development only
 * Use for general informational messages
 * 
 * @example
 * logger.info('User logged in', { component: 'AuthService', data: { userId: user.id } });
 */
function info(message: string, context?: LogContext): void {
  if (!shouldLog('info')) return;
  
  const formattedMessage = formatMessage(message, context);
  if (context?.data) {
    console.info(formattedMessage, context.data);
  } else {
    console.info(formattedMessage);
  }
}

/**
 * Warning level logging
 * In production, optionally sends to Sentry
 * 
 * @example
 * logger.warn('Rate limit approaching', { component: 'RateLimiter', data: { remaining: 10 } });
 */
function warn(message: string, context?: LogContext): void {
  const formattedMessage = formatMessage(message, context);
  
  if (shouldLog('warn')) {
    if (context?.data) {
      console.warn(formattedMessage, context.data);
    } else {
      console.warn(formattedMessage);
    }
  }
  
  // Send warnings to Sentry in production
  if (!isDevelopment && !isTest && SEND_WARNINGS_TO_SENTRY) {
    Sentry.captureMessage(formattedMessage, {
      level: 'warning',
      tags: {
        component: context?.component,
        action: context?.action,
      },
      extra: context?.data,
    });
  }
}

/**
 * Serialize error for logging, handling Supabase PostgrestError and other special cases
 */
function serializeError(err: unknown): unknown {
  if (err === null || err === undefined) {
    return err;
  }
  
  // Handle Supabase PostgrestError (has message, details, hint, code properties)
  if (typeof err === 'object' && err !== null) {
    const errorObj = err as Record<string, unknown>;
    
    // Check for PostgrestError-like structure
    if ('message' in errorObj || 'code' in errorObj || 'details' in errorObj || 'hint' in errorObj) {
      const result: Record<string, unknown> = {
        message: errorObj.message,
        code: errorObj.code,
        details: errorObj.details,
        hint: errorObj.hint,
      };
      // Include stack if it's an Error instance
      if (err instanceof Error) {
        result.stack = err.stack;
      }
      return result;
    }
    
    // Standard Error object
    if (err instanceof Error) {
      const result: Record<string, unknown> = {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };
      // Include cause if present
      if (err.cause) {
        result.cause = serializeError(err.cause);
      }
      return result;
    }
    
    // Try to extract enumerable properties
    const keys = Object.keys(errorObj);
    if (keys.length > 0) {
      return errorObj;
    }
    
    // Last resort: try JSON stringify
    try {
      const jsonStr = JSON.stringify(err);
      if (jsonStr !== '{}') {
        return JSON.parse(jsonStr);
      }
    } catch {
      // Ignore stringify errors
    }
  }
  
  return err;
}

/**
 * Error level logging
 * Always sends to Sentry in production via error-tracking module
 * 
 * @example
 * logger.error('Failed to fetch tools', error, { component: 'ToolsAPI', action: 'GET' });
 */
function error(
  message: string,
  err?: unknown,
  context?: LogContext
): void {
  const formattedMessage = formatMessage(message, context);
  
  // Always log errors in development
  if (isDevelopment || isTest) {
    if (err) {
      const serializedError = serializeError(err);
      console.error(formattedMessage, serializedError);
    } else {
      console.error(formattedMessage);
    }
  }
  
  // Send to Sentry in production
  if (!isDevelopment && !isTest) {
    if (err) {
      const errorContext: ErrorContext = {
        component: context?.component,
        action: context?.action,
        metadata: context?.data,
        userMessage: message,
      };
      captureError(err, errorContext);
    } else {
      Sentry.captureMessage(formattedMessage, {
        level: 'error',
        tags: {
          component: context?.component,
          action: context?.action,
        },
        extra: context?.data,
      });
    }
  }
}

// ============================================================================
// Scoped Logger Factory
// ============================================================================

/**
 * Create a logger scoped to a specific component
 * Useful for services and components that need consistent logging
 * 
 * @example
 * const log = createLogger('ToolsService');
 * log.info('Fetching tools');
 * log.error('Failed to fetch', error, { action: 'getAll' });
 */
export function createLogger(component: string) {
  return {
    debug: (message: string, data?: Record<string, unknown>) =>
      debug(message, { component, data }),
    
    info: (message: string, data?: Record<string, unknown>) =>
      info(message, { component, data }),
    
    warn: (message: string, data?: Record<string, unknown>) =>
      warn(message, { component, data }),
    
    error: (message: string, err?: unknown, context?: Omit<LogContext, 'component'>) =>
      error(message, err, { ...context, component }),
  };
}

// ============================================================================
// Default Logger Export
// ============================================================================

export const logger = {
  debug,
  info,
  warn,
  error,
  createLogger,
};

export default logger;
