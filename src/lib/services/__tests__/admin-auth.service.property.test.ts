/**
 * Property-based tests for Admin Auth Service
 *
 * Tests Properties from the design document:
 * - Property 5: Successful Login Flow
 * - Property 6: Failed Login Error Handling
 * - Property 7: Account Lockout Mechanism
 *
 * **Feature: admin-auth-separation**
 * **Validates: Requirements 2.2, 2.3, 2.7, 5.1, 5.2, 5.3, 5.4**
 *
 * To run these tests, you need to set:
 * - SUPABASE_SERVICE_ROLE_KEY
 * - ADMIN_JWT_SECRET
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  loginAdmin,
  verifyAdminSession,
  createAdminToken,
  ERROR_INVALID_CREDENTIALS,
  ERROR_ACCOUNT_LOCKED,
} from '../admin-auth.service';
import { hashPassword } from '@/lib/utils/password';
import { verifyToken } from '@/lib/utils/jwt';
import {
  createAdminsRepository,
  MAX_FAILED_ATTEMPTS,
  type AdminsRepository,
} from '@/lib/db/repositories/admins.repository';
import type { Database } from '@/lib/supabase/types';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.ADMIN_JWT_SECRET;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_KEY || !JWT_SECRET;

// Helper to generate unique test emails
function generateTestEmail(base: string): string {
  return `test-${base}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.example.com`;
}

// Valid password generator (meets strength requirements: 8+ chars, 1 uppercase, 1 number)
const validPasswordArbitrary = fc
  .tuple(
    fc.string({ minLength: 1, maxLength: 3 }).map(s => s.toUpperCase().replace(/[^A-Z]/g, 'A') || 'A'),
    fc.string({ minLength: 1, maxLength: 3 }).map(s => s.replace(/[^0-9]/g, '1') || '1'),
    fc.string({ minLength: 4, maxLength: 10 }).map(s => s.toLowerCase().replace(/[^a-z]/g, 'a') || 'aaaa')
  )
  .map(([upper, num, lower]) => upper + num + lower);

describe.skipIf(shouldSkip)('Admin Auth Service Property Tests', { timeout: 120000 }, () => {
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
   * **Feature: admin-auth-separation, Property 5: Successful Login Flow**
   * **Validates: Requirements 2.2, 2.7, 3.1, 3.2, 3.3, 3.4**
   *
   * *For any* valid admin credentials (correct email and password for an active, non-locked account),
   * the Admin_System SHALL:
   * - Create a JWT token containing the admin's id and email
   * - Set the token expiry to exactly 8 hours from creation
   * - Update `last_login_at` to current timestamp
   * - Reset `failed_login_attempts` to 0
   */
  describe('Property 5: Successful Login Flow', () => {
    it('should create valid JWT token with correct claims on successful login', async () => {
      await fc.assert(
        fc.asyncProperty(
          validPasswordArbitrary,
          async (password) => {
            const email = generateTestEmail('success-login');
            const passwordHash = await hashPassword(password);

            // Create test admin
            const admin = await adminsRepo.upsertAdmin(email, passwordHash);
            testAdminIds.push(admin.id);

            // Perform login
            const result = await loginAdmin(email, password);

            // Property: Login should succeed
            expect(result.success).toBe(true);
            expect(result.token).toBeDefined();
            expect(result.error).toBeUndefined();

            // Property: Token should contain correct claims
            const payload = await verifyToken(result.token!);
            expect(payload).not.toBeNull();
            expect(payload!.sub).toBe(admin.id);
            expect(payload!.email).toBe(email);

            // Property: Token should expire in ~8 hours (with some tolerance)
            const now = Math.floor(Date.now() / 1000);
            const expectedExpiry = now + 8 * 60 * 60;
            expect(payload!.exp).toBeGreaterThan(now);
            expect(payload!.exp).toBeLessThanOrEqual(expectedExpiry + 60); // 60s tolerance
            expect(payload!.exp).toBeGreaterThanOrEqual(expectedExpiry - 60);
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should update last_login_at and reset failed_login_attempts on successful login', async () => {
      await fc.assert(
        fc.asyncProperty(
          validPasswordArbitrary,
          async (password) => {
            const email = generateTestEmail('login-tracking');
            const passwordHash = await hashPassword(password);

            // Create test admin with some failed attempts
            const admin = await adminsRepo.upsertAdmin(email, passwordHash);
            testAdminIds.push(admin.id);

            // Set some failed attempts
            await supabase
              .from('admins')
              .update({ failed_login_attempts: 3 })
              .eq('id', admin.id);

            const beforeLogin = new Date();

            // Perform login
            const result = await loginAdmin(email, password);
            expect(result.success).toBe(true);

            // Fetch updated admin record
            const updatedAdmin = await adminsRepo.findByEmail(email);

            // Property: last_login_at should be updated to around now
            expect(updatedAdmin!.last_login_at).not.toBeNull();
            const lastLoginAt = new Date(updatedAdmin!.last_login_at!);
            expect(lastLoginAt.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime() - 1000);
            expect(lastLoginAt.getTime()).toBeLessThanOrEqual(Date.now() + 1000);

            // Property: failed_login_attempts should be reset to 0
            expect(updatedAdmin!.failed_login_attempts).toBe(0);
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should allow login after lockout expires and reset counters', async () => {
      const password = 'ValidP4ss';
      const email = generateTestEmail('lockout-expired');
      const passwordHash = await hashPassword(password);

      // Create test admin with expired lockout
      const admin = await adminsRepo.upsertAdmin(email, passwordHash);
      testAdminIds.push(admin.id);

      // Set expired lockout (1 minute ago)
      const expiredLockout = new Date(Date.now() - 60000).toISOString();
      await supabase
        .from('admins')
        .update({
          failed_login_attempts: 5,
          locked_until: expiredLockout,
        })
        .eq('id', admin.id);

      // Perform login
      const result = await loginAdmin(email, password);

      // Property: Login should succeed after lockout expires
      expect(result.success).toBe(true);

      // Fetch updated admin record
      const updatedAdmin = await adminsRepo.findByEmail(email);

      // Property: failed_login_attempts should be reset (Req 5.4)
      expect(updatedAdmin!.failed_login_attempts).toBe(0);
    });
  });


  /**
   * **Feature: admin-auth-separation, Property 6: Failed Login Error Handling**
   * **Validates: Requirements 2.3, 5.1, 8.4**
   *
   * *For any* invalid credentials (wrong email or wrong password), the Admin_System SHALL:
   * - Return the generic error message "Invalid email or password"
   * - Increment `failed_login_attempts` by exactly 1 (if admin exists)
   * - Never reveal whether the email exists or the password was wrong
   */
  describe('Property 6: Failed Login Error Handling', () => {
    it('should return generic error for non-existent email', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          validPasswordArbitrary,
          async (emailBase, password) => {
            // Use a unique email that definitely doesn't exist
            const email = `nonexistent-${Date.now()}-${Math.random().toString(36).slice(2)}@test.example.com`;

            const result = await loginAdmin(email, password);

            // Property: Should return generic error (Req 8.4)
            expect(result.success).toBe(false);
            expect(result.error).toBe(ERROR_INVALID_CREDENTIALS);
            expect(result.token).toBeUndefined();
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should return generic error and increment failed attempts for wrong password', async () => {
      await fc.assert(
        fc.asyncProperty(
          validPasswordArbitrary,
          validPasswordArbitrary,
          async (correctPassword, wrongPassword) => {
            // Ensure passwords are different
            fc.pre(correctPassword !== wrongPassword);

            const email = generateTestEmail('wrong-password');
            const passwordHash = await hashPassword(correctPassword);

            // Create test admin
            const admin = await adminsRepo.upsertAdmin(email, passwordHash);
            testAdminIds.push(admin.id);

            // Reset failed attempts
            await supabase
              .from('admins')
              .update({ failed_login_attempts: 0 })
              .eq('id', admin.id);

            // Attempt login with wrong password
            const result = await loginAdmin(email, wrongPassword);

            // Property: Should return generic error (Req 2.3, 8.4)
            expect(result.success).toBe(false);
            expect(result.error).toBe(ERROR_INVALID_CREDENTIALS);

            // Property: failed_login_attempts should be incremented (Req 5.1)
            const updatedAdmin = await adminsRepo.findByEmail(email);
            expect(updatedAdmin!.failed_login_attempts).toBe(1);
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should return generic error for inactive account', async () => {
      const password = 'ValidP4ss';
      const email = generateTestEmail('inactive-account');
      const passwordHash = await hashPassword(password);

      // Create test admin and set inactive
      const admin = await adminsRepo.upsertAdmin(email, passwordHash);
      testAdminIds.push(admin.id);

      await supabase
        .from('admins')
        .update({ is_active: false })
        .eq('id', admin.id);

      // Attempt login
      const result = await loginAdmin(email, password);

      // Property: Should return generic error (doesn't reveal account status)
      expect(result.success).toBe(false);
      expect(result.error).toBe(ERROR_INVALID_CREDENTIALS);
    });

    it('should return generic error for invalid email format', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate invalid emails
          fc.oneof(
            fc.string().filter(s => !s.includes('@')),
            fc.constant(''),
            fc.constant('invalid'),
            fc.constant('@nodomain'),
            fc.constant('no@tld')
          ),
          validPasswordArbitrary,
          async (invalidEmail, password) => {
            const result = await loginAdmin(invalidEmail, password);

            // Property: Should return generic error for invalid email format
            expect(result.success).toBe(false);
            expect(result.error).toBe(ERROR_INVALID_CREDENTIALS);
          }
        ),
        { numRuns: 5 }
      );
    });
  });


  /**
   * **Feature: admin-auth-separation, Property 7: Account Lockout Mechanism**
   * **Validates: Requirements 5.2, 5.3, 5.4**
   *
   * *For any* admin account:
   * - When `failed_login_attempts` reaches exactly 5, `locked_until` SHALL be set to current time plus 15 minutes
   * - While `locked_until` > current time, all login attempts SHALL fail with "Account temporarily locked. Try again later."
   * - When `locked_until` expires and login succeeds, both `failed_login_attempts` and `locked_until` SHALL be reset
   */
  describe('Property 7: Account Lockout Mechanism', () => {
    it('should lock account after 5 failed attempts', async () => {
      const correctPassword = 'ValidP4ss';
      const wrongPassword = 'WrongP4ss';
      const email = generateTestEmail('lockout-test');
      const passwordHash = await hashPassword(correctPassword);

      // Create test admin
      const admin = await adminsRepo.upsertAdmin(email, passwordHash);
      testAdminIds.push(admin.id);

      // Reset failed attempts
      await supabase
        .from('admins')
        .update({ failed_login_attempts: 0, locked_until: null })
        .eq('id', admin.id);

      // Perform 5 failed login attempts
      for (let i = 1; i <= MAX_FAILED_ATTEMPTS; i++) {
        const result = await loginAdmin(email, wrongPassword);
        expect(result.success).toBe(false);
        expect(result.error).toBe(ERROR_INVALID_CREDENTIALS);

        const updatedAdmin = await adminsRepo.findByEmail(email);
        expect(updatedAdmin!.failed_login_attempts).toBe(i);
      }

      // Property: Account should be locked after 5 failed attempts (Req 5.2)
      const lockedAdmin = await adminsRepo.findByEmail(email);
      expect(lockedAdmin!.locked_until).not.toBeNull();

      // Verify lockout is ~15 minutes from now
      const lockedUntil = new Date(lockedAdmin!.locked_until!);
      const expectedLockout = Date.now() + 15 * 60 * 1000;
      expect(lockedUntil.getTime()).toBeGreaterThan(Date.now());
      expect(lockedUntil.getTime()).toBeLessThanOrEqual(expectedLockout + 5000); // 5s tolerance
    });

    it('should reject login attempts while account is locked', async () => {
      const password = 'ValidP4ss';
      const email = generateTestEmail('locked-account');
      const passwordHash = await hashPassword(password);

      // Create test admin with active lockout
      const admin = await adminsRepo.upsertAdmin(email, passwordHash);
      testAdminIds.push(admin.id);

      // Set lockout 10 minutes in the future
      const futureLockout = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await supabase
        .from('admins')
        .update({
          failed_login_attempts: 5,
          locked_until: futureLockout,
        })
        .eq('id', admin.id);

      // Attempt login with correct password
      const result = await loginAdmin(email, password);

      // Property: Should return lockout error (Req 5.3)
      expect(result.success).toBe(false);
      expect(result.error).toBe(ERROR_ACCOUNT_LOCKED);
    });

    it('should reset lockout counters on successful login after lockout expires', async () => {
      const password = 'ValidP4ss';
      const email = generateTestEmail('lockout-reset');
      const passwordHash = await hashPassword(password);

      // Create test admin with expired lockout
      const admin = await adminsRepo.upsertAdmin(email, passwordHash);
      testAdminIds.push(admin.id);

      // Set expired lockout (1 minute ago)
      const expiredLockout = new Date(Date.now() - 60000).toISOString();
      await supabase
        .from('admins')
        .update({
          failed_login_attempts: 5,
          locked_until: expiredLockout,
        })
        .eq('id', admin.id);

      // Perform successful login
      const result = await loginAdmin(email, password);

      // Property: Login should succeed after lockout expires
      expect(result.success).toBe(true);

      // Property: Counters should be reset (Req 5.4)
      const updatedAdmin = await adminsRepo.findByEmail(email);
      expect(updatedAdmin!.failed_login_attempts).toBe(0);
      // Note: locked_until is cleared by recordSuccessfulLogin
    });

    it('should increment failed attempts correctly up to lockout threshold', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: MAX_FAILED_ATTEMPTS - 1 }),
          async (initialAttempts) => {
            const correctPassword = 'ValidP4ss';
            const wrongPassword = 'WrongP4ss';
            const email = generateTestEmail(`attempts-${initialAttempts}`);
            const passwordHash = await hashPassword(correctPassword);

            // Create test admin with some failed attempts
            const admin = await adminsRepo.upsertAdmin(email, passwordHash);
            testAdminIds.push(admin.id);

            await supabase
              .from('admins')
              .update({ failed_login_attempts: initialAttempts, locked_until: null })
              .eq('id', admin.id);

            // Perform one more failed attempt
            const result = await loginAdmin(email, wrongPassword);
            expect(result.success).toBe(false);

            // Property: failed_login_attempts should be incremented by exactly 1
            const updatedAdmin = await adminsRepo.findByEmail(email);
            expect(updatedAdmin!.failed_login_attempts).toBe(initialAttempts + 1);

            // Property: Account should be locked only if we hit the threshold
            if (initialAttempts + 1 >= MAX_FAILED_ATTEMPTS) {
              expect(updatedAdmin!.locked_until).not.toBeNull();
            } else {
              expect(updatedAdmin!.locked_until).toBeNull();
            }
          }
        ),
        { numRuns: 4 }
      );
    });
  });


  /**
   * Additional tests for helper functions
   */
  describe('Helper Functions', () => {
    it('createAdminToken should create valid JWT with correct structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          async (id, email) => {
            const token = await createAdminToken({
              id,
              email,
              isActive: true,
            });

            // Property: Token should be a non-empty string
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);

            // Property: Token should be verifiable
            const payload = await verifyToken(token);
            expect(payload).not.toBeNull();
            expect(payload!.sub).toBe(id);
            expect(payload!.email).toBe(email);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('verifyAdminSession should return session for valid token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          async (id, email) => {
            const token = await createAdminToken({
              id,
              email,
              isActive: true,
            });

            const session = await verifyAdminSession(token);

            // Property: Session should be returned for valid token
            expect(session).not.toBeNull();
            expect(session!.admin.id).toBe(id);
            expect(session!.admin.email).toBe(email);
            expect(session!.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
          }
        ),
        { numRuns: 10 }
      );
    });

    it('verifyAdminSession should return null for invalid token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 100 }),
          async (invalidToken) => {
            const session = await verifyAdminSession(invalidToken);

            // Property: Should return null for invalid token
            expect(session).toBeNull();
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
