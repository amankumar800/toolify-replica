/**
 * Rate Limiting Module
 *
 * Provides rate limiting functionality for API routes using Upstash Redis.
 * Designed to work correctly in serverless environments.
 *
 * Features:
 * - Multiple rate limit tiers for different route types
 * - IP-based and admin-based identification
 * - Graceful degradation if Redis is unavailable
 * - Standard rate limit headers
 *
 * @example
 * ```ts
 * // In an API route
 * import { checkRateLimit } from '@/lib/rate-limit';
 *
 * export async function POST(request: NextRequest) {
 *   const rateLimitResponse = await checkRateLimit(request, {
 *     type: 'adminMutation',
 *     useAuth: true,
 *   });
 *
 *   if (rateLimitResponse) {
 *     return rateLimitResponse;
 *   }
 *
 *   // Handle request...
 * }
 * ```
 *
 * @module rate-limit
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, isRateLimitingEnabled, type RateLimitType } from './config';
import { getRateLimitIdentifier, getClientIp } from './identifiers';
import { createRateLimitResponse } from './response';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for rate limit checking
 */
export interface RateLimitOptions {
  /** The type of rate limit to apply */
  type: RateLimitType;
  /** Whether to use authenticated admin ID (falls back to IP) */
  useAuth?: boolean;
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Check if a request should be rate limited.
 *
 * Returns a 429 response if rate limited, null if allowed.
 * If rate limiting is not configured, always returns null (allow).
 *
 * @param request - The incoming request
 * @param options - Rate limit options
 * @returns 429 response if rate limited, null if allowed
 *
 * @example
 * ```ts
 * const rateLimitResponse = await checkRateLimit(request, { type: 'login' });
 * if (rateLimitResponse) {
 *   return rateLimitResponse; // Return 429 response
 * }
 * // Continue with request handling
 * ```
 */
export async function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<NextResponse | null> {
  const { type, useAuth = false } = options;

  // Skip if rate limiting is not configured
  if (!isRateLimitingEnabled()) {
    return null;
  }

  const limiter = rateLimiters[type];
  if (!limiter) {
    return null;
  }

  try {
    const identifier = await getRateLimitIdentifier(request, useAuth);
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
      // Log rate limit exceeded for monitoring
      console.warn(`[Rate Limit] Exceeded: type=${type}, identifier=${identifier}`);
      return createRateLimitResponse({ limit, remaining, reset });
    }

    // Request allowed
    return null;
  } catch (error) {
    // Fail open: if rate limiting fails, allow the request
    // This prevents rate limiting from becoming a single point of failure
    console.error('[Rate Limit] Error:', error);
    return null;
  }
}

/**
 * Higher-order function to wrap API route handlers with rate limiting.
 *
 * Useful for cleaner route definitions.
 *
 * @param handler - The route handler to wrap
 * @param options - Rate limit options
 * @returns Wrapped handler with rate limiting
 *
 * @example
 * ```ts
 * export const POST = withRateLimit(
 *   async (request: NextRequest) => {
 *     // Handle request...
 *     return NextResponse.json({ success: true });
 *   },
 *   { type: 'adminMutation', useAuth: true }
 * );
 * ```
 */
export function withRateLimit(
  handler: (request: NextRequest, context?: unknown) => Promise<NextResponse>,
  options: RateLimitOptions
) {
  return async (request: NextRequest, context?: unknown): Promise<NextResponse> => {
    const rateLimitResponse = await checkRateLimit(request, options);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return handler(request, context);
  };
}

// ============================================================================
// Re-exports
// ============================================================================

export { isRateLimitingEnabled, type RateLimitType } from './config';
export { getClientIp, getRateLimitIdentifier } from './identifiers';
export { createRateLimitResponse, addRateLimitHeaders, type RateLimitInfo } from './response';
