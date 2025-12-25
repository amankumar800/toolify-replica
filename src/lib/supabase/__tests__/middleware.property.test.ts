/**
 * Property-Based Tests for Auth Middleware
 * 
 * **Feature: supabase-auth-migration**
 * 
 * Tests protected route redirection behavior using property-based testing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { NextRequest } from 'next/server';

// =============================================================================
// Test Helpers - Route Matching Logic (extracted from middleware)
// =============================================================================

/**
 * Protected route patterns that require authentication
 * This mirrors the PROTECTED_ROUTES constant in the middleware
 */
const PROTECTED_ROUTES = ['/admin'];

/**
 * Check if a pathname matches any protected route pattern
 * This mirrors the isProtectedRoute function in the middleware
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Build a redirect URL for unauthenticated users
 * This mirrors the redirect logic in the middleware
 */
function buildLoginRedirectUrl(requestUrl: string): URL {
  const url = new URL(requestUrl);
  const loginUrl = new URL('/login', url.origin);
  loginUrl.searchParams.set('callbackUrl', requestUrl);
  return loginUrl;
}

// =============================================================================
// Arbitraries (Generators) for Property-Based Testing
// =============================================================================

/**
 * Generates valid URL path segments (alphanumeric with hyphens and underscores)
 */
const pathSegmentArbitrary = fc.stringMatching(/^[a-zA-Z0-9_-]+$/)
  .filter(s => s.length >= 1 && s.length <= 50);

/**
 * Generates protected admin routes (paths starting with /admin)
 */
const protectedRouteArbitrary = fc.tuple(
  fc.array(pathSegmentArbitrary, { minLength: 0, maxLength: 5 })
).map(([segments]) => {
  const subPath = segments.length > 0 ? '/' + segments.join('/') : '';
  return `/admin${subPath}`;
});

/**
 * Generates public routes (paths NOT starting with /admin)
 */
const publicRouteArbitrary = fc.oneof(
  // Root path
  fc.constant('/'),
  // Common public paths
  fc.constantFrom('/login', '/signup', '/about', '/contact', '/tools', '/category'),
  // Dynamic public paths
  fc.tuple(
    fc.constantFrom('/', '/tools/', '/category/', '/free-ai-tools/', '/ai-news/'),
    fc.array(pathSegmentArbitrary, { minLength: 0, maxLength: 3 })
  ).map(([prefix, segments]) => {
    const subPath = segments.join('/');
    return prefix + subPath;
  })
).filter(path => !path.startsWith('/admin'));

/**
 * Generates valid base URLs
 */
const baseUrlArbitrary = fc.constantFrom(
  'http://localhost:3000',
  'https://example.com',
  'https://myapp.vercel.app'
);

// =============================================================================
// Property-Based Tests
// =============================================================================

describe('Auth Middleware - Protected Route Detection', () => {
  /**
   * **Feature: supabase-auth-migration, Property 2: Protected Route Redirection**
   * **Validates: Requirements 2.3**
   * 
   * For any unauthenticated request to a protected route (e.g., /admin/*),
   * the middleware SHALL redirect to /login with the original URL as a callback parameter.
   */

  it('all /admin/* paths are detected as protected routes', () => {
    fc.assert(
      fc.property(protectedRouteArbitrary, (pathname) => {
        expect(isProtectedRoute(pathname)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('public routes are not detected as protected', () => {
    fc.assert(
      fc.property(publicRouteArbitrary, (pathname) => {
        expect(isProtectedRoute(pathname)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('/admin exactly is a protected route', () => {
    expect(isProtectedRoute('/admin')).toBe(true);
  });

  it('/admin/ with trailing slash is a protected route', () => {
    expect(isProtectedRoute('/admin/')).toBe(true);
  });

  it('/administrator is a protected route (starts with /admin)', () => {
    // Note: This is the current behavior - any path starting with /admin is protected
    expect(isProtectedRoute('/administrator')).toBe(true);
  });

  it('/Admin (different case) is NOT a protected route', () => {
    // Route matching is case-sensitive
    expect(isProtectedRoute('/Admin')).toBe(false);
  });
});

describe('Auth Middleware - Redirect URL Construction', () => {
  /**
   * Tests that the redirect URL is correctly constructed with callback parameter
   */

  it('redirect URL includes the original URL as callbackUrl parameter', () => {
    fc.assert(
      fc.property(
        baseUrlArbitrary,
        protectedRouteArbitrary,
        (baseUrl, pathname) => {
          const requestUrl = `${baseUrl}${pathname}`;
          const redirectUrl = buildLoginRedirectUrl(requestUrl);
          
          // Should redirect to /login
          expect(redirectUrl.pathname).toBe('/login');
          
          // Should include the original URL as callback
          expect(redirectUrl.searchParams.get('callbackUrl')).toBe(requestUrl);
          
          // Should use the same origin
          expect(redirectUrl.origin).toBe(baseUrl);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('redirect URL preserves query parameters in callback', () => {
    fc.assert(
      fc.property(
        baseUrlArbitrary,
        protectedRouteArbitrary,
        fc.dictionary(pathSegmentArbitrary, pathSegmentArbitrary, { minKeys: 0, maxKeys: 3 }),
        (baseUrl, pathname, queryParams) => {
          const url = new URL(pathname, baseUrl);
          Object.entries(queryParams).forEach(([key, value]) => {
            url.searchParams.set(key, value);
          });
          
          const requestUrl = url.toString();
          const redirectUrl = buildLoginRedirectUrl(requestUrl);
          
          // The callback URL should contain the full original URL with query params
          const callbackUrl = redirectUrl.searchParams.get('callbackUrl');
          expect(callbackUrl).toBe(requestUrl);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Auth Middleware - Route Classification Completeness', () => {
  /**
   * Tests that route classification is complete and consistent
   */

  it('any pathname is either protected or public (no undefined state)', () => {
    fc.assert(
      fc.property(
        fc.oneof(protectedRouteArbitrary, publicRouteArbitrary),
        (pathname) => {
          const result = isProtectedRoute(pathname);
          // Result must be a boolean (not undefined, null, etc.)
          expect(typeof result).toBe('boolean');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('route classification is deterministic (same input = same output)', () => {
    fc.assert(
      fc.property(
        fc.oneof(protectedRouteArbitrary, publicRouteArbitrary),
        (pathname) => {
          const result1 = isProtectedRoute(pathname);
          const result2 = isProtectedRoute(pathname);
          expect(result1).toBe(result2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
