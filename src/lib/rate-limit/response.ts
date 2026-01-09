/**
 * Rate Limit Response Utilities
 *
 * Provides standardized rate limit response handling with proper
 * HTTP headers and error messages.
 *
 * @module rate-limit/response
 */

import { NextResponse } from 'next/server';

/**
 * Rate limit information from Upstash
 */
export interface RateLimitInfo {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Remaining requests in the current window */
  remaining: number;
  /** Timestamp when the limit resets (milliseconds) */
  reset: number;
}

/**
 * Create a 429 Too Many Requests response with standard headers.
 *
 * @param info - Rate limit information
 * @returns NextResponse with 429 status and rate limit headers
 */
export function createRateLimitResponse(info: RateLimitInfo): NextResponse {
  const retryAfterSeconds = Math.ceil((info.reset - Date.now()) / 1000);

  const response = NextResponse.json(
    {
      error: 'Too Many Requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: retryAfterSeconds,
    },
    { status: 429 }
  );

  // Add standard rate limit headers (RFC 6585, draft-ietf-httpapi-ratelimit-headers)
  response.headers.set('X-RateLimit-Limit', info.limit.toString());
  response.headers.set('X-RateLimit-Remaining', info.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(info.reset).toISOString());
  response.headers.set('Retry-After', retryAfterSeconds.toString());

  return response;
}

/**
 * Add rate limit headers to a successful response.
 *
 * Allows clients to monitor their rate limit usage proactively.
 *
 * @param response - The response to add headers to
 * @param info - Rate limit information
 * @returns The response with added headers
 */
export function addRateLimitHeaders(
  response: NextResponse,
  info: RateLimitInfo
): NextResponse {
  response.headers.set('X-RateLimit-Limit', info.limit.toString());
  response.headers.set('X-RateLimit-Remaining', info.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(info.reset).toISOString());

  return response;
}
