/**
 * Admin Authentication Service
 * 
 * Handles all admin authentication operations including login, logout,
 * session verification, and protected route helpers.
 * 
 * This service is completely independent from Supabase Auth and uses:
 * - JWT tokens for session management
 * - bcrypt for password verification
 * - httpOnly cookies for secure token storage
 * 
 * @module admin-auth.service
 */

import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAdminsRepository, isAccountLocked, MAX_FAILED_ATTEMPTS } from '@/lib/db/repositories/admins.repository';
import { verifyPassword } from '@/lib/utils/password';
import { signToken, verifyToken } from '@/lib/utils/jwt';
import { validateEmail } from '@/lib/utils/validation';

// ============================================================================
// Types
// ============================================================================

/**
 * Represents an authenticated admin user
 */
export interface AdminUser {
  /** Admin UUID */
  id: string;
  /** Admin email address */
  email: string;
  /** Whether the admin account is active */
  isActive: boolean;
}

/**
 * Represents an admin session with expiry information
 */
export interface AdminSession {
  /** The authenticated admin */
  admin: AdminUser;
  /** Session expiry timestamp (Unix seconds) */
  expiresAt: number;
}

/**
 * Result of a login attempt
 */
export interface LoginResult {
  /** Whether login was successful */
  success: boolean;
  /** JWT token on success */
  token?: string;
  /** Error message on failure */
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Cookie name for admin session */
export const COOKIE_NAME = 'admin_session';

/** Cookie max age in seconds (8 hours) */
export const COOKIE_MAX_AGE = 8 * 60 * 60;

/** Cookie path - sent to all routes (needed for both /admin and /api/admin) */
export const COOKIE_PATH = '/';

/** Generic error message for invalid credentials (prevents info leakage) */
export const ERROR_INVALID_CREDENTIALS = 'Invalid email or password';

/** Error message for locked accounts */
export const ERROR_ACCOUNT_LOCKED = 'Account temporarily locked. Try again later.';

/** Error message for unauthorized access */
export const ERROR_UNAUTHORIZED = 'Unauthorized';

// ============================================================================
// Custom Errors
// ============================================================================

/**
 * Error thrown when admin authentication fails
 */
export class UnauthorizedError extends Error {
  constructor(message: string = ERROR_UNAUTHORIZED) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}


// ============================================================================
// Core Functions
// ============================================================================

/**
 * Authenticate an admin with email and password.
 * 
 * Flow:
 * 1. Validate email format
 * 2. Find admin by email
 * 3. Check if account is locked
 * 4. Check if account is active
 * 5. Verify password
 * 6. Handle failed attempts and lockout
 * 7. On success: update login tracking, create token
 * 
 * @param email - Admin email address
 * @param password - Admin password
 * @returns LoginResult with token on success, error on failure
 * 
 * @example
 * const result = await loginAdmin('admin@example.com', 'SecureP4ss');
 * if (result.success) {
 *   // Set cookie with result.token
 * } else {
 *   // Display result.error
 * }
 */
export async function loginAdmin(email: string, password: string): Promise<LoginResult> {
  // Validate email format first (Req 8.1)
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return { success: false, error: ERROR_INVALID_CREDENTIALS };
  }

  try {
    const supabase = createAdminClient();
    const adminsRepo = createAdminsRepository(supabase);

    // Find admin by email
    const admin = await adminsRepo.findByEmail(email);

    // Admin not found - return generic error (Req 8.4)
    if (!admin) {
      return { success: false, error: ERROR_INVALID_CREDENTIALS };
    }

    // Check if account is locked (Req 5.3)
    if (isAccountLocked(admin)) {
      return { success: false, error: ERROR_ACCOUNT_LOCKED };
    }

    // Check if account is active
    if (admin.is_active === false) {
      return { success: false, error: ERROR_INVALID_CREDENTIALS };
    }

    // Verify password
    const passwordValid = await verifyPassword(password, admin.password_hash);

    if (!passwordValid) {
      // Record failed login attempt (Req 5.1)
      const failedAttempts = await adminsRepo.recordFailedLogin(admin.id);

      // Lock account if max attempts reached (Req 5.2)
      if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        await adminsRepo.lockAccount(admin.id);
      }

      return { success: false, error: ERROR_INVALID_CREDENTIALS };
    }

    // Password valid - record successful login (Req 2.7)
    // This resets failed_login_attempts and clears locked_until (Req 5.4)
    await adminsRepo.recordSuccessfulLogin(admin.id);

    // Create JWT token (Req 3.1)
    const token = await createAdminToken({
      id: admin.id,
      email: admin.email,
      isActive: admin.is_active ?? true,
    });

    return { success: true, token };
  } catch (error) {
    // Log error internally but return generic message (Req 8.4)
    console.error('Login error:', error);
    return { success: false, error: ERROR_INVALID_CREDENTIALS };
  }
}

/**
 * Create a JWT token for an admin user.
 * 
 * @param admin - Admin user to create token for
 * @returns JWT token string
 * 
 * @example
 * const token = await createAdminToken({ id: 'uuid', email: 'admin@example.com', isActive: true });
 */
export async function createAdminToken(admin: AdminUser): Promise<string> {
  return signToken({
    sub: admin.id,
    email: admin.email,
  });
}

/**
 * Verify an admin session token and return session info.
 * 
 * @param token - JWT token to verify
 * @returns AdminSession if valid, null if invalid/expired
 * 
 * @example
 * const session = await verifyAdminSession(token);
 * if (session) {
 *   console.log('Admin:', session.admin.email);
 *   console.log('Expires:', new Date(session.expiresAt * 1000));
 * }
 */
export async function verifyAdminSession(token: string): Promise<AdminSession | null> {
  const payload = await verifyToken(token);

  if (!payload) {
    return null;
  }

  return {
    admin: {
      id: payload.sub,
      email: payload.email,
      isActive: true, // If token is valid, we assume active (middleware checks DB)
    },
    expiresAt: payload.exp,
  };
}

/**
 * Get the current admin from request cookies.
 * 
 * Reads the admin_session cookie and verifies the JWT token.
 * 
 * @returns AdminUser if authenticated, null otherwise
 * 
 * @example
 * const admin = await getAdminFromRequest();
 * if (admin) {
 *   console.log('Logged in as:', admin.email);
 * }
 */
export async function getAdminFromRequest(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const session = await verifyAdminSession(sessionCookie.value);

    if (!session) {
      return null;
    }

    return session.admin;
  } catch (error) {
    console.error('Error reading admin session:', error);
    return null;
  }
}

/**
 * Require an authenticated admin for server actions.
 * 
 * Throws UnauthorizedError if no valid admin session exists.
 * Use this in server actions that require admin authentication.
 * 
 * @returns AdminUser if authenticated
 * @throws UnauthorizedError if not authenticated
 * 
 * @example
 * export async function protectedServerAction() {
 *   const admin = await requireAdmin();
 *   // admin is guaranteed to be authenticated here
 *   console.log('Action by:', admin.email);
 * }
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminFromRequest();

  if (!admin) {
    throw new UnauthorizedError();
  }

  return admin;
}

/**
 * Log out the current admin by clearing the session cookie.
 * 
 * This is a server action that clears the admin_session cookie.
 * Clears cookies at both current path and legacy /admin path for backwards compatibility.
 * 
 * @example
 * // In a server action or API route
 * await logoutAdmin();
 * // Redirect to /admin/login
 */
export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  // Delete at current path
  cookieStore.delete({ name: COOKIE_NAME, path: COOKIE_PATH });
  // Also delete at legacy /admin path for backwards compatibility
  if (COOKIE_PATH !== '/admin') {
    cookieStore.delete({ name: COOKIE_NAME, path: '/admin' });
  }
}

// ============================================================================
// Cookie Helpers
// ============================================================================

/**
 * Get cookie options for setting the admin session cookie.
 * 
 * Returns options for httpOnly, secure, sameSite=strict cookie.
 * Use this when setting the cookie in API routes.
 * 
 * @returns Cookie options object
 * 
 * @example
 * // In an API route
 * const response = NextResponse.json({ success: true });
 * response.cookies.set(COOKIE_NAME, token, getAdminCookieOptions());
 */
export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: COOKIE_PATH,
    maxAge: COOKIE_MAX_AGE,
  };
}
