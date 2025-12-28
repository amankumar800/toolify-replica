import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Protected route patterns that require authentication
 */
const PROTECTED_ROUTES = ['/admin'];

/**
 * Check if a pathname matches any protected route pattern
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Middleware that handles:
 * 1. Supabase Auth session refresh on every request
 * 2. Protected route redirection for unauthenticated users
 * 3. Role-based access control for admin routes
 * 
 * Requirements:
 * - 2.1: Refresh Supabase_Auth session using cookies on every request
 * - 2.2: Update both request and response cookies with refreshed session
 * - 2.3: Redirect unauthenticated users from /admin routes to /login
 * - 2.4: Use getUser() to validate sessions securely
 * - 2.5: Clear invalid cookies if session refresh fails
 * - 2.6: Enforce RBAC - only admin users can access /admin routes
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Refresh Supabase session and get user
  // This handles Requirements 2.1, 2.2, 2.4, 2.5
  const { response, user, error } = await updateSession(request);

  // Log session refresh errors for debugging (optional)
  if (error) {
    console.debug('[Middleware] Session refresh error:', error);
  }

  // 2. Protected route check
  if (isProtectedRoute(pathname)) {
    // 2a. Redirect unauthenticated users to login (Requirement 2.3)
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // 2b. RBAC check - only admins can access admin routes (Requirement 2.6)
    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
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
