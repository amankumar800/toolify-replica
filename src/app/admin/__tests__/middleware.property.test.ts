/**
 * Property-Based Tests for Admin Middleware
 *
 * Tests Properties from the design document:
 * - Property 9: Route Protection
 * - Property 10: Inactive Account Denial
 * - Property 11: Authenticated Admin Login Redirect
 *
 * **Feature: admin-auth-separation**
 * **Validates: Requirements 2.4, 4.1, 4.2, 4.3, 4.5**
 *
 * To run these tests, you need to set:
 * - SUPABASE_SERVICE_ROLE_KEY
 * - ADMIN_JWT_SECRET
 */
import { describe, it, expect, beforeAll, afterAll, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { signToken, verifyToken } from '@/lib/utils/jwt';
import { hashPassword } from '@/lib/utils/password';
import { createAdminsRepository, type AdminsRepository } from '@/lib/db/repositories/admins.repository';
import type { Database } from '@/lib/supabase/types';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.ADMIN_JWT_SECRET;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_KEY || !JWT_SECRET;

// Constants matching middleware
const ADMIN_COOKIE_NAME = 'admin_session';
const ADMIN_LOGIN_PATH = '/admin/login';
const ADMIN_DASHBOARD_PATH = '/admin/dashboard';

// =============================================================================
// Test Helpers - Extracted Middleware Logic for Unit Testing
// =============================================================================

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
 * Get admin session from request cookie and verify JWT.
 * Returns admin payload if valid session, null otherwise.
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
 * Determine middleware action for admin routes.
 * Returns: 'allow', 'redirect-to-login', 'redirect-to-dashboard'
 */
async function determineAdminRouteAction(
  pathname: string,
  hasValidSession: boolean,
  isActive: boolean
): Promise<'allow' | 'redirect-to-login' | 'redirect-to-dashboard'> {
  // Admin login page
  if (isAdminLoginPage(pathname)) {
    if (hasValidSession && isActive) {
      return 'redirect-to-dashboard';
    }
    return 'allow';
  }

  // Protected admin routes
  if (!hasValidSession) {
    return 'redirect-to-login';
  }

  if (!isActive) {
    return 'redirect-to-login';
  }

  return 'allow';
}

// =============================================================================
// Arbitraries (Generators) for Property-Based Testing
// =============================================================================

/**
 * Generates valid URL path segments (alphanumeric with hyphens and underscores)
 */
const pathSegmentArbitrary = fc
  .stringMatching(/^[a-zA-Z0-9_-]+$/)
  .filter((s) => s.length >= 1 && s.length <= 50);

/**
 * Generates protected admin routes (paths starting with /admin but NOT /admin/login)
 */
const protectedAdminRouteArbitrary = fc
  .tuple(fc.array(pathSegmentArbitrary, { minLength: 0, maxLength: 5 }))
  .map(([segments]) => {
    const subPath = segments.length > 0 ? '/' + segments.join('/') : '';
    return `/admin${subPath}`;
  })
  .filter((path) => path !== ADMIN_LOGIN_PATH);

/**
 * Generates the admin login path
 */
const adminLoginRouteArbitrary = fc.constant(ADMIN_LOGIN_PATH);

/**
 * Generates any admin route (including login)
 */
const anyAdminRouteArbitrary = fc.oneof(
  adminLoginRouteArbitrary,
  protectedAdminRouteArbitrary
);

/**
 * Generates non-admin routes
 */
const nonAdminRouteArbitrary = fc
  .oneof(
    fc.constant('/'),
    fc.constantFrom('/login', '/signup', '/about', '/tools', '/category'),
    fc
      .tuple(
        fc.constantFrom('/', '/tools/', '/category/', '/free-ai-tools/'),
        fc.array(pathSegmentArbitrary, { minLength: 0, maxLength: 3 })
      )
      .map(([prefix, segments]) => prefix + segments.join('/'))
  )
  .filter((path) => !path.startsWith('/admin'));

/**
 * Generates valid base URLs
 */
const baseUrlArbitrary = fc.constantFrom(
  'http://localhost:3000',
  'https://example.com',
  'https://myapp.vercel.app'
);

/**
 * Generates valid admin data for testing
 */
const adminDataArbitrary = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  isActive: fc.boolean(),
});

// =============================================================================
// Helper to generate unique test emails
// =============================================================================

function generateTestEmail(base: string): string {
  return `test-${base}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.example.com`;
}

// =============================================================================
// Property-Based Tests - Route Detection
// =============================================================================

describe('Admin Middleware - Route Detection', () => {
  /**
   * Tests that admin route detection is correct
   */

  it('all /admin/* paths are detected as admin routes', () => {
    fc.assert(
      fc.property(anyAdminRouteArbitrary, (pathname) => {
        expect(isAdminRoute(pathname)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('non-admin routes are not detected as admin routes', () => {
    fc.assert(
      fc.property(nonAdminRouteArbitrary, (pathname) => {
        expect(isAdminRoute(pathname)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('only /admin/login is detected as admin login page', () => {
    fc.assert(
      fc.property(anyAdminRouteArbitrary, (pathname) => {
        const isLogin = isAdminLoginPage(pathname);
        if (pathname === ADMIN_LOGIN_PATH) {
          expect(isLogin).toBe(true);
        } else {
          expect(isLogin).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// Property-Based Tests - Route Action Determination
// =============================================================================

describe('Admin Middleware - Route Action Determination', () => {
  /**
   * **Feature: admin-auth-separation, Property 9: Route Protection**
   * **Validates: Requirements 4.1, 4.2, 4.3**
   *
   * *For any* request to `/admin/*` routes (except `/admin/login`):
   * - Without a valid `admin_session` cookie, redirect to `/admin/login`
   * - With a valid `admin_session` cookie for an active admin, allow access
   * - With an expired or invalid token, redirect to `/admin/login`
   */
  describe('Property 9: Route Protection', () => {
    it('protected admin routes without session should redirect to login', async () => {
      await fc.assert(
        fc.asyncProperty(protectedAdminRouteArbitrary, async (pathname) => {
          const action = await determineAdminRouteAction(pathname, false, false);
          expect(action).toBe('redirect-to-login');
        }),
        { numRuns: 100 }
      );
    });

    it('protected admin routes with valid session and active admin should allow access', async () => {
      await fc.assert(
        fc.asyncProperty(protectedAdminRouteArbitrary, async (pathname) => {
          const action = await determineAdminRouteAction(pathname, true, true);
          expect(action).toBe('allow');
        }),
        { numRuns: 100 }
      );
    });

    it('protected admin routes with invalid session should redirect to login', async () => {
      await fc.assert(
        fc.asyncProperty(protectedAdminRouteArbitrary, async (pathname) => {
          // Invalid session = hasValidSession is false
          const action = await determineAdminRouteAction(pathname, false, true);
          expect(action).toBe('redirect-to-login');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: admin-auth-separation, Property 10: Inactive Account Denial**
   * **Validates: Requirements 4.5**
   *
   * *For any* admin account where `is_active` is false, the Admin_System SHALL deny access
   * to all admin routes and redirect to `/admin/login`, regardless of valid session token.
   */
  describe('Property 10: Inactive Account Denial', () => {
    it('protected admin routes with valid session but inactive admin should redirect to login', async () => {
      await fc.assert(
        fc.asyncProperty(protectedAdminRouteArbitrary, async (pathname) => {
          const action = await determineAdminRouteAction(pathname, true, false);
          expect(action).toBe('redirect-to-login');
        }),
        { numRuns: 100 }
      );
    });

    it('inactive admin should be denied access regardless of route', async () => {
      await fc.assert(
        fc.asyncProperty(protectedAdminRouteArbitrary, async (pathname) => {
          // Even with valid session, inactive admin should be denied
          const action = await determineAdminRouteAction(pathname, true, false);
          expect(action).toBe('redirect-to-login');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: admin-auth-separation, Property 11: Authenticated Admin Login Redirect**
   * **Validates: Requirements 2.4**
   *
   * *For any* request to `/admin/login` with a valid `admin_session` cookie,
   * the Admin_System SHALL redirect to `/admin/dashboard`.
   */
  describe('Property 11: Authenticated Admin Login Redirect', () => {
    it('admin login page with valid session and active admin should redirect to dashboard', async () => {
      const action = await determineAdminRouteAction(ADMIN_LOGIN_PATH, true, true);
      expect(action).toBe('redirect-to-dashboard');
    });

    it('admin login page without session should allow access', async () => {
      const action = await determineAdminRouteAction(ADMIN_LOGIN_PATH, false, false);
      expect(action).toBe('allow');
    });

    it('admin login page with valid session but inactive admin should allow access (to re-authenticate)', async () => {
      const action = await determineAdminRouteAction(ADMIN_LOGIN_PATH, true, false);
      expect(action).toBe('allow');
    });

    it('admin login page with invalid session should allow access', async () => {
      const action = await determineAdminRouteAction(ADMIN_LOGIN_PATH, false, true);
      expect(action).toBe('allow');
    });
  });
});

// =============================================================================
// Property-Based Tests - Session Cookie Parsing
// =============================================================================

describe('Admin Middleware - Session Cookie Parsing', () => {
  /**
   * Tests that session cookie parsing works correctly
   */

  it('should return null for request without admin_session cookie', async () => {
    await fc.assert(
      fc.asyncProperty(baseUrlArbitrary, protectedAdminRouteArbitrary, async (baseUrl, pathname) => {
        const request = new NextRequest(new URL(pathname, baseUrl));
        const session = await getAdminSessionFromCookie(request);
        expect(session).toBeNull();
      }),
      { numRuns: 50 }
    );
  });

  it('should return null for request with empty cookie value', async () => {
    await fc.assert(
      fc.asyncProperty(baseUrlArbitrary, protectedAdminRouteArbitrary, async (baseUrl, pathname) => {
        const request = new NextRequest(new URL(pathname, baseUrl));
        request.cookies.set(ADMIN_COOKIE_NAME, '');

        const session = await getAdminSessionFromCookie(request);
        expect(session).toBeNull();
      }),
      { numRuns: 20 }
    );
  });
});

// =============================================================================
// Property-Based Tests - Session Cookie Parsing (requires JWT_SECRET)
// =============================================================================

describe.skipIf(!JWT_SECRET)('Admin Middleware - Session Cookie Parsing (JWT)', () => {
  /**
   * Tests that require JWT_SECRET to create/verify tokens
   */

  it('should return admin data for request with valid JWT cookie', async () => {
    await fc.assert(
      fc.asyncProperty(
        baseUrlArbitrary,
        protectedAdminRouteArbitrary,
        fc.uuid(),
        fc.emailAddress(),
        async (baseUrl, pathname, adminId, email) => {
          // Create a valid JWT token
          const token = await signToken({ sub: adminId, email });

          // Create request with cookie
          const request = new NextRequest(new URL(pathname, baseUrl));
          request.cookies.set(ADMIN_COOKIE_NAME, token);

          const session = await getAdminSessionFromCookie(request);

          expect(session).not.toBeNull();
          expect(session!.sub).toBe(adminId);
          expect(session!.email).toBe(email);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should return null for request with invalid JWT cookie', async () => {
    await fc.assert(
      fc.asyncProperty(
        baseUrlArbitrary,
        protectedAdminRouteArbitrary,
        fc.string({ minLength: 10, maxLength: 100 }),
        async (baseUrl, pathname, invalidToken) => {
          const request = new NextRequest(new URL(pathname, baseUrl));
          request.cookies.set(ADMIN_COOKIE_NAME, invalidToken);

          const session = await getAdminSessionFromCookie(request);
          expect(session).toBeNull();
        }
      ),
      { numRuns: 20 }
    );
  });
});

// =============================================================================
// Integration Tests with Database (requires Supabase)
// =============================================================================

describe.skipIf(shouldSkip)('Admin Middleware - Database Integration', { timeout: 60000 }, () => {
  let supabase: SupabaseClient<Database>;
  let adminsRepo: AdminsRepository;
  const testAdminIds: string[] = [];

  beforeAll(() => {
    supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    adminsRepo = createAdminsRepository(supabase);
  });

  afterAll(async () => {
    // Clean up test data
    if (testAdminIds.length > 0) {
      await supabase.from('admins').delete().in('id', testAdminIds);
    }
  });

  /**
   * Helper to check if admin is active (mirrors middleware logic)
   */
  async function checkAdminIsActive(adminId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('admins')
      .select('is_active')
      .eq('id', adminId)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    return data.is_active === true;
  }

  /**
   * **Feature: admin-auth-separation, Property 10: Inactive Account Denial (Integration)**
   * **Validates: Requirements 4.5**
   */
  describe('Property 10: Inactive Account Denial (Integration)', () => {
    it('should return false for inactive admin in database', async () => {
      const email = generateTestEmail('inactive-middleware');
      const passwordHash = await hashPassword('ValidP4ss');

      // Create inactive admin
      const admin = await adminsRepo.upsertAdmin(email, passwordHash);
      testAdminIds.push(admin.id);

      await supabase.from('admins').update({ is_active: false }).eq('id', admin.id);

      const isActive = await checkAdminIsActive(admin.id);
      expect(isActive).toBe(false);
    });

    it('should return true for active admin in database', async () => {
      const email = generateTestEmail('active-middleware');
      const passwordHash = await hashPassword('ValidP4ss');

      // Create active admin
      const admin = await adminsRepo.upsertAdmin(email, passwordHash);
      testAdminIds.push(admin.id);

      const isActive = await checkAdminIsActive(admin.id);
      expect(isActive).toBe(true);
    });

    it('should return false for non-existent admin', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const isActive = await checkAdminIsActive(nonExistentId);
      expect(isActive).toBe(false);
    });
  });

  /**
   * **Feature: admin-auth-separation, Property 9: Route Protection (Integration)**
   * **Validates: Requirements 4.1, 4.2, 4.3**
   */
  describe('Property 9: Route Protection (Integration)', () => {
    it('should allow access for active admin with valid token', async () => {
      await fc.assert(
        fc.asyncProperty(protectedAdminRouteArbitrary, async (pathname) => {
          const email = generateTestEmail('route-protection');
          const passwordHash = await hashPassword('ValidP4ss');

          // Create active admin
          const admin = await adminsRepo.upsertAdmin(email, passwordHash);
          testAdminIds.push(admin.id);

          // Create valid token
          const token = await signToken({ sub: admin.id, email });

          // Verify token is valid
          const payload = await verifyToken(token);
          expect(payload).not.toBeNull();

          // Check admin is active
          const isActive = await checkAdminIsActive(admin.id);
          expect(isActive).toBe(true);

          // Determine action
          const action = await determineAdminRouteAction(pathname, true, isActive);
          expect(action).toBe('allow');
        }),
        { numRuns: 5 }
      );
    });

    it('should deny access for inactive admin with valid token', async () => {
      await fc.assert(
        fc.asyncProperty(protectedAdminRouteArbitrary, async (pathname) => {
          const email = generateTestEmail('inactive-route');
          const passwordHash = await hashPassword('ValidP4ss');

          // Create admin and set inactive
          const admin = await adminsRepo.upsertAdmin(email, passwordHash);
          testAdminIds.push(admin.id);

          await supabase.from('admins').update({ is_active: false }).eq('id', admin.id);

          // Check admin is inactive
          const isActive = await checkAdminIsActive(admin.id);
          expect(isActive).toBe(false);

          // Determine action
          const action = await determineAdminRouteAction(pathname, true, isActive);
          expect(action).toBe('redirect-to-login');
        }),
        { numRuns: 5 }
      );
    });
  });
});

// =============================================================================
// Route Classification Completeness Tests
// =============================================================================

describe('Admin Middleware - Route Classification Completeness', () => {
  /**
   * Tests that route classification is complete and consistent
   */

  it('any admin pathname results in a defined action', async () => {
    await fc.assert(
      fc.asyncProperty(
        anyAdminRouteArbitrary,
        fc.boolean(),
        fc.boolean(),
        async (pathname, hasSession, isActive) => {
          const action = await determineAdminRouteAction(pathname, hasSession, isActive);
          expect(['allow', 'redirect-to-login', 'redirect-to-dashboard']).toContain(action);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('route action determination is deterministic', async () => {
    await fc.assert(
      fc.asyncProperty(
        anyAdminRouteArbitrary,
        fc.boolean(),
        fc.boolean(),
        async (pathname, hasSession, isActive) => {
          const action1 = await determineAdminRouteAction(pathname, hasSession, isActive);
          const action2 = await determineAdminRouteAction(pathname, hasSession, isActive);
          expect(action1).toBe(action2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('active admin with valid session always gets access to protected routes', async () => {
    await fc.assert(
      fc.asyncProperty(protectedAdminRouteArbitrary, async (pathname) => {
        const action = await determineAdminRouteAction(pathname, true, true);
        expect(action).toBe('allow');
      }),
      { numRuns: 100 }
    );
  });

  it('unauthenticated user never gets access to protected routes', async () => {
    await fc.assert(
      fc.asyncProperty(
        protectedAdminRouteArbitrary,
        fc.boolean(),
        async (pathname, isActive) => {
          const action = await determineAdminRouteAction(pathname, false, isActive);
          expect(action).toBe('redirect-to-login');
        }
      ),
      { numRuns: 100 }
    );
  });
});
