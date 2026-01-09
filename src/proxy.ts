import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { verifyToken } from '@/lib/utils/jwt';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createLogger } from '@/lib/logger';

const log = createLogger('Proxy');

// ============================================================================
// Constants
// ============================================================================

/** Cookie name for admin session */
const ADMIN_COOKIE_NAME = 'admin_session';

/** Admin login page path */
const ADMIN_LOGIN_PATH = '/admin/login';

/** Admin dashboard path */
const ADMIN_DASHBOARD_PATH = '/admin/dashboard';

/**
 * Protected route patterns that require Supabase authentication
 * Note: Admin routes are handled separately with dedicated admin auth
 */
const SUPABASE_PROTECTED_ROUTES: string[] = [];

// ============================================================================
// Global Rate Limiter (from middleware.ts)
// ============================================================================

/**
 * Create global rate limiter for proxy-level protection.
 * This provides a first line of defense against DDoS and abuse.
 */
function createGlobalRateLimiter(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  return new Ratelimit({
    redis,
    // Global limit: 200 requests per 10 seconds per IP
    limiter: Ratelimit.slidingWindow(200, '10 s'),
    analytics: true,
    prefix: 'ratelimit:global',
  });
}

const globalRateLimiter = createGlobalRateLimiter();

/**
 * Get client IP from request headers (Vercel-compatible)
 */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return 'unknown';
}

/**
 * Check if the request path is an API route that needs rate limiting
 */
function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

// ============================================================================
// Admin Auth Helpers
// ============================================================================

/**
 * Get admin session from request cookie and verify JWT.
 * Does NOT check is_active status - that requires a database call.
 * 
 * @param request - Next.js request object
 * @returns Admin payload if valid session, null otherwise
 */
async function getAdminSessionFromCookie(
  request: NextRequest
): Promise<{ sub: string; email: string } | null> {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
  
  if (!cookie?.value) {
    return null;
  }

  const payload = await verifyToken(cookie.value);
  
  if (!payload) {
    return null;
  }

  return {
    sub: payload.sub,
    email: payload.email,
  };
}

/**
 * Check if an admin account is active in the database.
 * Uses service role client to bypass RLS.
 * 
 * @param adminId - Admin UUID to check
 * @returns true if admin exists and is_active is true, false otherwise
 */
async function checkAdminIsActive(adminId: string): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      log.error('Missing Supabase credentials', undefined, { action: 'checkAdminIsActive' });
      return false;
    }

    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase
      .from('admins')
      .select('is_active')
      .eq('id', adminId)
      .maybeSingle();

    if (error) {
      log.error('Database error checking is_active', error, { action: 'checkAdminIsActive', data: { adminId } });
      return false;
    }

    if (!data) {
      return false;
    }

    return data.is_active === true;
  } catch (error) {
    log.error('Error checking admin status', error, { action: 'checkAdminIsActive' });
    return false;
  }
}

/**
 * Log unauthorized access attempt for security monitoring.
 * 
 * @param request - Next.js request object
 * @param reason - Reason for denial
 */
function logUnauthorizedAccess(request: NextRequest, reason: string): void {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const pathname = request.nextUrl.pathname;
  
  log.warn('Unauthorized access attempt', { data: { pathname, reason, ip } });
}

// ============================================================================
// Route Detection
// ============================================================================

/**
 * Check if a pathname is an admin route
 */
function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

/**
 * Check if a pathname is the admin login page
 */
function isAdminLoginPage(pathname: string): boolean {
  return pathname === ADMIN_LOGIN_PATH;
}

/**
 * Check if a pathname matches any Supabase protected route pattern
 */
function isSupabaseProtectedRoute(pathname: string): boolean {
  return SUPABASE_PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

// ============================================================================
// Proxy
// ============================================================================

/**
 * Proxy that handles:
 * 1. Admin route protection with dedicated admin auth (JWT + httpOnly cookies)
 * 2. Supabase Auth session refresh for non-admin routes
 * 3. Protected route redirection for unauthenticated users
 * 
 * Admin Auth Requirements:
 * - 2.4: Redirect authenticated admins from /admin/login to /admin/dashboard
 * - 4.1: Redirect unauthenticated users from /admin/* to /admin/login
 * - 4.2: Allow access when valid Admin_Session exists
 * - 4.3: Redirect to /admin/login on expired/invalid session
 * - 4.4: Validate Admin_Session via middleware
 * - 4.5: Deny access if is_active is false
 * - 11.4: Log unauthorized access attempts
 * 
 * Supabase Auth Requirements (for non-admin routes):
 * - 2.1: Refresh Supabase_Auth session using cookies on every request
 * - 2.2: Update both request and response cookies with refreshed session
 * - 2.3: Redirect unauthenticated users from protected routes to /login
 * - 2.4: Use getUser() to validate sessions securely
 * - 2.5: Clear invalid cookies if session refresh fails
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ========================================================================
  // Global Rate Limiting for API Routes
  // ========================================================================
  if (isApiRoute(pathname) && globalRateLimiter) {
    try {
      const ip = getClientIp(request);
      const { success, limit, remaining, reset } = await globalRateLimiter.limit(`global:${ip}`);

      if (!success) {
        log.warn('Global rate limit exceeded', { data: { ip, pathname } });
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        
        return new NextResponse(
          JSON.stringify({
            error: 'Too Many Requests',
            message: 'You have exceeded the global rate limit. Please slow down.',
            retryAfter,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': new Date(reset).toISOString(),
              'Retry-After': retryAfter.toString(),
            },
          }
        );
      }
    } catch (error) {
      // Fail open: if rate limiting fails, allow the request
      log.error('Global rate limit error', error, { action: 'proxy' });
    }
  }

  // ========================================================================
  // Admin Route Handling (Dedicated Admin Auth)
  // ========================================================================
  if (isAdminRoute(pathname)) {
    // Handle admin login page
    if (isAdminLoginPage(pathname)) {
      // Check if already authenticated - redirect to dashboard (Req 2.4)
      const adminSession = await getAdminSessionFromCookie(request);
      
      if (adminSession) {
        // Verify admin is still active before redirecting
        const isActive = await checkAdminIsActive(adminSession.sub);
        
        if (isActive) {
          return NextResponse.redirect(new URL(ADMIN_DASHBOARD_PATH, request.url));
        }
        // If not active, allow access to login page (they need to re-authenticate)
      }
      
      // No valid session or inactive - allow access to login page
      return NextResponse.next();
    }

    // Protected admin routes (everything except /admin/login)
    const adminSession = await getAdminSessionFromCookie(request);

    // No session - redirect to login (Req 4.1)
    if (!adminSession) {
      logUnauthorizedAccess(request, 'No admin session');
      return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
    }

    // Check if admin account is active (Req 4.5)
    const isActive = await checkAdminIsActive(adminSession.sub);

    if (!isActive) {
      logUnauthorizedAccess(request, 'Admin account inactive or not found');
      return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
    }

    // Valid session and active account - allow access (Req 4.2)
    return NextResponse.next();
  }

  // ========================================================================
  // Non-Admin Route Handling (Supabase Auth)
  // ========================================================================
  
  // Refresh Supabase session and get user
  const { response, user, error } = await updateSession(request);

  // Log session refresh errors for debugging
  if (error) {
    console.debug('[Proxy] Session refresh error:', error);
  }

  // Protected route check for Supabase auth
  if (isSupabaseProtectedRoute(pathname)) {
    // Redirect unauthenticated users to login
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Return response with updated cookies
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     * 
     * This ensures session refresh happens on all page navigations
     * while excluding static assets that don't need auth.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
