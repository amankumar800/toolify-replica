/**
 * Centralized Error Tracking Utility
 * 
 * This module provides a unified interface for error tracking and logging.
 * It wraps Sentry's API and provides additional context and categorization.
 * 
 * Usage:
 * - captureError(error) - Capture any error with automatic context
 * - captureMessage(message, level) - Log messages with severity levels
 * - setUserContext(user) - Set user context for error tracking
 * - addBreadcrumb(breadcrumb) - Add navigation/action breadcrumbs
 * 
 * @module error-tracking
 */

import * as Sentry from '@sentry/nextjs';

// ============================================================================
// Types
// ============================================================================

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface ErrorContext {
  /** Component or module where error occurred */
  component?: string;
  /** Action being performed when error occurred */
  action?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** User-facing error message (sanitized) */
  userMessage?: string;
  /** Error category for grouping */
  category?: ErrorCategory;
}

export type ErrorCategory =
  | 'authentication'
  | 'authorization'
  | 'database'
  | 'network'
  | 'validation'
  | 'business_logic'
  | 'external_service'
  | 'unknown';

export interface UserContext {
  id: string;
  email?: string;
  role?: string;
}

export interface Breadcrumb {
  category: string;
  message: string;
  level?: ErrorSeverity;
  data?: Record<string, unknown>;
}

// ============================================================================
// Error Capture Functions
// ============================================================================

/**
 * Capture an error with full context
 * 
 * @param error - The error to capture
 * @param context - Additional context about the error
 * @returns The Sentry event ID for reference
 * 
 * @example
 * try {
 *   await saveUser(data);
 * } catch (error) {
 *   captureError(error, {
 *     component: 'UserService',
 *     action: 'saveUser',
 *     category: 'database',
 *     metadata: { userId: data.id }
 *   });
 * }
 */
export function captureError(
  error: unknown,
  context?: ErrorContext
): string | undefined {
  // Ensure we have an Error object
  const errorObj = error instanceof Error ? error : new Error(String(error));

  // Determine error category if not provided
  const category = context?.category ?? categorizeError(errorObj);

  // Capture with Sentry
  const eventId = Sentry.captureException(errorObj, {
    tags: {
      category,
      component: context?.component,
      action: context?.action,
    },
    extra: {
      ...context?.metadata,
      userMessage: context?.userMessage,
    },
    level: categoryToSeverity(category),
  });

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${category}] ${context?.component ?? 'Unknown'}:`, errorObj);
  }

  return eventId;
}

/**
 * Capture a message (non-error) with severity level
 * 
 * @param message - The message to capture
 * @param level - Severity level
 * @param context - Additional context
 * 
 * @example
 * captureMessage('User exceeded rate limit', 'warning', {
 *   component: 'RateLimiter',
 *   metadata: { userId: '123', endpoint: '/api/tools' }
 * });
 */
export function captureMessage(
  message: string,
  level: ErrorSeverity = 'info',
  context?: Omit<ErrorContext, 'category'>
): string | undefined {
  const eventId = Sentry.captureMessage(message, {
    level: level as Sentry.SeverityLevel,
    tags: {
      component: context?.component,
      action: context?.action,
    },
    extra: context?.metadata,
  });

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    const logFn = level === 'error' || level === 'fatal' ? console.error : console.log;
    logFn(`[${level}] ${context?.component ?? 'App'}:`, message);
  }

  return eventId;
}

// ============================================================================
// Context Functions
// ============================================================================

/**
 * Set user context for error tracking
 * All subsequent errors will be associated with this user
 * 
 * @param user - User information (or null to clear)
 * 
 * @example
 * // On login
 * setUserContext({ id: user.id, email: user.email, role: 'admin' });
 * 
 * // On logout
 * setUserContext(null);
 */
export function setUserContext(user: UserContext | null): void {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      // Custom data
      role: user.role,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add a breadcrumb for debugging
 * Breadcrumbs help trace the user's path before an error
 * 
 * @param breadcrumb - Breadcrumb data
 * 
 * @example
 * addBreadcrumb({
 *   category: 'navigation',
 *   message: 'User navigated to /tools/chatgpt',
 *   level: 'info'
 * });
 */
export function addBreadcrumb(breadcrumb: Breadcrumb): void {
  Sentry.addBreadcrumb({
    category: breadcrumb.category,
    message: breadcrumb.message,
    level: (breadcrumb.level ?? 'info') as Sentry.SeverityLevel,
    data: breadcrumb.data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Set a tag that will be attached to all subsequent events
 * 
 * @param key - Tag key
 * @param value - Tag value
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * Set extra context data
 * 
 * @param key - Context key
 * @param value - Context value
 */
export function setExtra(key: string, value: unknown): void {
  Sentry.setExtra(key, value);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Wrap an async function with error tracking
 * 
 * @param fn - The async function to wrap
 * @param context - Error context if the function throws
 * @returns The wrapped function
 * 
 * @example
 * const safeGetUser = withErrorTracking(
 *   async (id: string) => await db.users.findById(id),
 *   { component: 'UserService', action: 'getUser', category: 'database' }
 * );
 */
export function withErrorTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context: ErrorContext
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureError(error, {
        ...context,
        metadata: {
          ...context.metadata,
          args: args.map((arg) =>
            typeof arg === 'object' ? '[Object]' : String(arg)
          ),
        },
      });
      throw error;
    }
  }) as T;
}

/**
 * Create a scoped error tracker for a specific component
 * 
 * @param component - Component name
 * @returns Scoped error tracking functions
 * 
 * @example
 * const tracker = createScopedTracker('AdminDashboard');
 * tracker.error(error, { action: 'loadStats' });
 * tracker.info('Dashboard loaded successfully');
 */
export function createScopedTracker(component: string) {
  return {
    error: (error: unknown, context?: Omit<ErrorContext, 'component'>) =>
      captureError(error, { ...context, component }),
    
    message: (message: string, level?: ErrorSeverity, context?: Omit<ErrorContext, 'component'>) =>
      captureMessage(message, level, { ...context, component }),
    
    breadcrumb: (message: string, data?: Record<string, unknown>) =>
      addBreadcrumb({ category: component, message, data }),
  };
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Automatically categorize an error based on its message/type
 */
function categorizeError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  if (message.includes('unauthorized') || message.includes('unauthenticated')) {
    return 'authentication';
  }
  if (message.includes('forbidden') || message.includes('permission')) {
    return 'authorization';
  }
  if (message.includes('database') || message.includes('prisma') || message.includes('supabase')) {
    return 'database';
  }
  if (message.includes('network') || message.includes('fetch') || name.includes('network')) {
    return 'network';
  }
  if (message.includes('validation') || message.includes('invalid') || name.includes('validation')) {
    return 'validation';
  }
  if (message.includes('timeout') || message.includes('external')) {
    return 'external_service';
  }

  return 'unknown';
}

/**
 * Map error category to Sentry severity level
 */
function categoryToSeverity(category: ErrorCategory): Sentry.SeverityLevel {
  switch (category) {
    case 'authentication':
    case 'authorization':
      return 'warning';
    case 'database':
    case 'external_service':
      return 'error';
    case 'validation':
      return 'info';
    case 'network':
      return 'warning';
    case 'business_logic':
      return 'error';
    default:
      return 'error';
  }
}
