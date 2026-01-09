/**
 * Next.js Middleware for Route Protection
 * 
 * This middleware provides:
 * 1. Session refresh for Supabase Auth (regular users)
 * 2. Route-level protection for /admin/* routes
 * 3. JWT verification for admin authentication
 * 
 * Runs on the Edge runtime before any page code executes.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { jwtVerify } from 'jose'
import { createLogger } from '@/lib/logger'

const log = createLogger('Middleware')

// Admin session cookie name (must match admin-auth.service.ts)
const ADMIN_COOKIE_NAME = 'admin_session'

// Routes that don't require admin authentication
const PUBLIC_ADMIN_ROUTES = ['/admin/login']

// Environment variable for JWT secret
const JWT_SECRET_ENV = 'ADMIN_JWT_SECRET'

/**
 * Verify admin JWT token in Edge runtime
 * Uses jose library which is Edge-compatible
 */
async function verifyAdminToken(token: string): Promise<boolean> {
  if (!token) return false
  
  const secret = process.env[JWT_SECRET_ENV]
  if (!secret) {
    log.error('ADMIN_JWT_SECRET environment variable is not set', undefined, { action: 'verifyAdminToken' })
    return false
  }
  
  try {
    const secretKey = new TextEncoder().encode(secret)
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256']
    })
    
    // Validate required claims
    if (!payload.sub || !payload.email || !payload.exp) {
      return false
    }
    
    return true
  } catch {
    // Token invalid, expired, or malformed
    return false
  }
}

/**
 * Check if the request path is a protected admin route
 */
function isProtectedAdminRoute(pathname: string): boolean {
  // Check if it's an admin route
  if (!pathname.startsWith('/admin')) {
    return false
  }
  
  // Check if it's a public admin route (like login)
  for (const route of PUBLIC_ADMIN_ROUTES) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return false
    }
  }
  
  return true
}

/**
 * Check if the request path is the admin login route
 */
function isAdminLoginRoute(pathname: string): boolean {
  return pathname === '/admin/login' || pathname.startsWith('/admin/login/')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 1. Always refresh Supabase session for all routes
  // This keeps user sessions fresh and handles token refresh
  const { response, user, error } = await updateSession(request)
  
  // Log session refresh errors (but don't block the request)
  if (error) {
    log.warn('Supabase session refresh warning', { data: { error } })
  }
  
  // 2. Handle admin route protection
  if (isProtectedAdminRoute(pathname)) {
    // Get admin session cookie
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value
    
    // Verify admin JWT token
    const isValidAdmin = adminToken ? await verifyAdminToken(adminToken) : false
    
    if (!isValidAdmin) {
      // Redirect to admin login with return URL
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('returnTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  // 3. Redirect authenticated admins away from login page
  if (isAdminLoginRoute(pathname)) {
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value
    const isValidAdmin = adminToken ? await verifyAdminToken(adminToken) : false
    
    if (isValidAdmin) {
      // Already logged in, redirect to dashboard
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }
  
  // 4. Return the response with refreshed session cookies
  return response
}

/**
 * Middleware matcher configuration
 * 
 * Matches all routes except:
 * - _next/static (static files)
 * - _next/image (image optimization files)
 * - favicon.ico (favicon file)
 * - Public assets (images, svgs, etc.)
 * - API routes that handle their own auth (optional, can be removed if API routes need middleware)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
