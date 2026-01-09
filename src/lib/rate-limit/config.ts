/**
 * Rate Limit Configuration
 *
 * Defines rate limit tiers for different types of API routes.
 * Uses Upstash Redis for distributed rate limiting that works
 * correctly in serverless environments.
 *
 * @module rate-limit/config
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ============================================================================
// Redis Client
// ============================================================================

/**
 * Check if Upstash credentials are configured.
 * Rate limiting is optional - if not configured, requests pass through.
 */
export function isRateLimitingEnabled(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/**
 * Create Redis client from environment variables.
 * Returns null if not configured.
 */
function createRedisClient(): Redis | null {
  if (!isRateLimitingEnabled()) {
    return null;
  }

  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// Singleton Redis client
const redis = createRedisClient();

// ============================================================================
// Rate Limit Tiers
// ============================================================================

/**
 * Rate limit tier types:
 * - login: Strictest - prevents brute-force attacks (5 requests per 15 minutes)
 * - adminMutation: Strict - protects write operations (60 requests per minute)
 * - bulkOperation: Moderate - prevents mass operations abuse (10 requests per minute)
 * - adminRead: Lenient - allows fast browsing (300 requests per minute)
 * - public: Moderate - protects public endpoints (100 requests per minute)
 */
export type RateLimitType =
  | 'login'
  | 'adminMutation'
  | 'bulkOperation'
  | 'adminRead'
  | 'public';

/**
 * Rate limit configurations for different route types.
 * Returns null for each limiter if Redis is not configured.
 */
export const rateLimiters: Record<RateLimitType, Ratelimit | null> = redis
  ? {
      // Authentication - strictest limits (5 requests per 15 minutes)
      // Prevents brute-force login attacks
      login: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '15 m'),
        analytics: true,
        prefix: 'ratelimit:login',
      }),

      // Admin mutations - strict but usable (60 requests per minute)
      // Allows legitimate admin work while preventing abuse
      adminMutation: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, '1 m'),
        analytics: true,
        prefix: 'ratelimit:admin-mutation',
      }),

      // Bulk operations - moderate (10 requests per minute)
      // Prevents accidental mass deletions
      bulkOperation: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        analytics: true,
        prefix: 'ratelimit:bulk',
      }),

      // Admin reads - lenient (300 requests per minute)
      // Allows fast browsing while preventing scraping
      adminRead: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(300, '1 m'),
        analytics: true,
        prefix: 'ratelimit:admin-read',
      }),

      // Public endpoints - moderate (100 requests per minute)
      // Allows legitimate traffic, prevents scraping
      public: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'),
        analytics: true,
        prefix: 'ratelimit:public',
      }),
    }
  : {
      login: null,
      adminMutation: null,
      bulkOperation: null,
      adminRead: null,
      public: null,
    };
