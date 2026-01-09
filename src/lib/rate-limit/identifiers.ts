/**
 * Rate Limit Identifier Utilities
 *
 * Provides utilities for extracting client identifiers (IP, admin ID)
 * for rate limiting purposes.
 *
 * @module rate-limit/identifiers
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/utils/jwt';
import { COOKIE_NAME } from '@/lib/services/admin-auth.service';

/**
 * Get IP address from request headers.
 * Handles Vercel's x-forwarded-for and x-real-ip headers.
 *
 * @param request - The incoming request
 * @returns Client IP address or 'unknown'
 */
export function getClientIp(request: NextRequest): string {
  // Vercel sets x-forwarded-for with client IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs; first one is the client
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback to x-real-ip header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
}

/**
 * Get admin ID from session cookie if authenticated.
 * Does not throw errors - returns null on failure.
 *
 * @returns Admin ID or null
 */
async function getAdminIdFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const payload = await verifyToken(sessionCookie.value);
    if (!payload) {
      return null;
    }

    return payload.sub;
  } catch {
    return null;
  }
}

/**
 * Get identifier for rate limiting.
 *
 * Uses admin ID for authenticated requests to allow per-admin limits,
 * or falls back to IP address for anonymous requests.
 *
 * @param request - The incoming request
 * @param useAuth - Whether to attempt admin identification
 * @returns Rate limit identifier string
 */
export async function getRateLimitIdentifier(
  request: NextRequest,
  useAuth: boolean = false
): Promise<string> {
  if (useAuth) {
    const adminId = await getAdminIdFromCookie();
    if (adminId) {
      return `admin:${adminId}`;
    }
  }

  const ip = getClientIp(request);
  return `ip:${ip}`;
}
