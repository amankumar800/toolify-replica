/**
 * Property-based tests for admins repository
 *
 * Tests Properties from the design document:
 * - Property 1: Email Uniqueness Constraint
 * - Property 15: Admin Upsert Idempotence
 *
 * **Feature: admin-auth-separation**
 * **Validates: Requirements 1.3, 6.2, 6.3**
 *
 * To run these tests, you need to set SUPABASE_SERVICE_ROLE_KEY in your environment.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  createAdminsRepository,
  isAccountLocked,
  type AdminsRepository,
  type AdminRecord,
} from '../admins.repository';
import type { Database } from '@/lib/supabase/types';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_KEY;

// Helper to generate unique test emails
function generateTestEmail(base: string): string {
  return `test-${base}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.example.com`;
}

// Helper to generate a valid bcrypt-like hash for testing
function generateTestPasswordHash(): string {
  // Generate a fake bcrypt hash format for testing (not a real hash)
  return `$2b$12$${Math.random().toString(36).slice(2, 24).padEnd(22, 'a')}${Math.random().toString(36).slice(2, 33).padEnd(31, 'b')}`;
}

describe.skipIf(shouldSkip)('Admins Repository Property Tests', { timeout: 120000 }, () => {
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
   * **Feature: admin-auth-separation, Property 1: Email Uniqueness Constraint**
   * **Validates: Requirements 1.3**
   *
   * *For any* two admin records with the same email address, the database SHALL reject
   * the second insert with a unique constraint violation.
   */
  describe('Property 1: Email Uniqueness Constraint', () => {
    it('should reject duplicate email addresses (property test with 10 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid email addresses
          fc.emailAddress(),
          async (emailBase) => {
            // Use a unique email for each test run to avoid conflicts with other tests
            const email = generateTestEmail(emailBase.split('@')[0]);
            const passwordHash1 = generateTestPasswordHash();
            const passwordHash2 = generateTestPasswordHash();

            // Create first admin with this email
            const admin1 = await adminsRepo.upsertAdmin(email, passwordHash1);
            testAdminIds.push(admin1.id);

            // Attempt to insert a second admin with the same email directly
            // (bypassing upsert to test the constraint)
            const { error } = await supabase
              .from('admins')
              .insert({
                email,
                password_hash: passwordHash2,
              });

            // Property: The database should reject duplicate emails
            expect(error).not.toBeNull();
            expect(error?.code).toBe('23505'); // PostgreSQL unique violation code
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should allow different email addresses', async () => {
      const email1 = generateTestEmail('unique-test-1');
      const email2 = generateTestEmail('unique-test-2');
      const passwordHash = generateTestPasswordHash();

      // Create two admins with different emails
      const admin1 = await adminsRepo.upsertAdmin(email1, passwordHash);
      testAdminIds.push(admin1.id);

      const admin2 = await adminsRepo.upsertAdmin(email2, passwordHash);
      testAdminIds.push(admin2.id);

      // Property: Both admins should be created successfully with different IDs
      expect(admin1.id).not.toBe(admin2.id);
      expect(admin1.email).toBe(email1);
      expect(admin2.email).toBe(email2);
    });
  });

  /**
   * **Feature: admin-auth-separation, Property 15: Admin Upsert Idempotence**
   * **Validates: Requirements 6.2, 6.3**
   *
   * *For any* email and password combination, running the setup script SHALL:
   * - Create a new admin if no admin with that email exists
   * - Update the password hash if an admin with that email already exists
   * - Result in exactly one admin record with that email
   */
  describe('Property 15: Admin Upsert Idempotence', () => {
    it('should create new admin when email does not exist (property test with 10 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (emailBase) => {
            const email = generateTestEmail(emailBase.split('@')[0]);
            const passwordHash = generateTestPasswordHash();

            // Verify admin doesn't exist
            const existingAdmin = await adminsRepo.findByEmail(email);
            expect(existingAdmin).toBeNull();

            // Create admin via upsert
            const admin = await adminsRepo.upsertAdmin(email, passwordHash);
            testAdminIds.push(admin.id);

            // Property: Admin should be created with correct data
            expect(admin.email).toBe(email);
            expect(admin.password_hash).toBe(passwordHash);
            expect(admin.is_active).toBe(true);
            expect(admin.failed_login_attempts).toBe(0);
            expect(admin.locked_until).toBeNull();

            // Verify only one admin with this email exists
            const foundAdmin = await adminsRepo.findByEmail(email);
            expect(foundAdmin).not.toBeNull();
            expect(foundAdmin!.id).toBe(admin.id);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should update password hash when admin already exists (property test with 10 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (emailBase) => {
            const email = generateTestEmail(emailBase.split('@')[0]);
            const passwordHash1 = generateTestPasswordHash();
            const passwordHash2 = generateTestPasswordHash();

            // Ensure different hashes
            fc.pre(passwordHash1 !== passwordHash2);

            // Create initial admin
            const admin1 = await adminsRepo.upsertAdmin(email, passwordHash1);
            testAdminIds.push(admin1.id);

            // Upsert with new password hash
            const admin2 = await adminsRepo.upsertAdmin(email, passwordHash2);

            // Property: Should be the same admin record (same ID)
            expect(admin2.id).toBe(admin1.id);

            // Property: Password hash should be updated
            expect(admin2.password_hash).toBe(passwordHash2);

            // Property: Email should remain the same
            expect(admin2.email).toBe(email);

            // Property: Only one admin with this email should exist
            const { count, error } = await supabase
              .from('admins')
              .select('*', { count: 'exact', head: true })
              .eq('email', email);

            expect(error).toBeNull();
            expect(count).toBe(1);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should be idempotent - multiple upserts with same data produce same result', async () => {
      const email = generateTestEmail('idempotent-test');
      const passwordHash = generateTestPasswordHash();

      // First upsert
      const admin1 = await adminsRepo.upsertAdmin(email, passwordHash);
      testAdminIds.push(admin1.id);

      // Second upsert with same data
      const admin2 = await adminsRepo.upsertAdmin(email, passwordHash);

      // Third upsert with same data
      const admin3 = await adminsRepo.upsertAdmin(email, passwordHash);

      // Property: All upserts should return the same admin record
      expect(admin1.id).toBe(admin2.id);
      expect(admin2.id).toBe(admin3.id);
      expect(admin1.email).toBe(admin2.email);
      expect(admin2.email).toBe(admin3.email);
      expect(admin1.password_hash).toBe(admin2.password_hash);
      expect(admin2.password_hash).toBe(admin3.password_hash);

      // Property: Only one admin with this email should exist
      const { count, error } = await supabase
        .from('admins')
        .select('*', { count: 'exact', head: true })
        .eq('email', email);

      expect(error).toBeNull();
      expect(count).toBe(1);
    });
  });

  /**
   * Additional tests for isAccountLocked helper function
   */
  describe('isAccountLocked helper function', () => {
    it('should return false when locked_until is null', () => {
      const admin: AdminRecord = {
        id: 'test-id',
        email: 'test@example.com',
        password_hash: 'hash',
        is_active: true,
        last_login_at: null,
        failed_login_attempts: 0,
        locked_until: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(isAccountLocked(admin)).toBe(false);
    });

    it('should return false when locked_until is in the past', () => {
      const pastDate = new Date(Date.now() - 60000).toISOString(); // 1 minute ago
      const admin: AdminRecord = {
        id: 'test-id',
        email: 'test@example.com',
        password_hash: 'hash',
        is_active: true,
        last_login_at: null,
        failed_login_attempts: 5,
        locked_until: pastDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(isAccountLocked(admin)).toBe(false);
    });

    it('should return true when locked_until is in the future', () => {
      const futureDate = new Date(Date.now() + 60000).toISOString(); // 1 minute from now
      const admin: AdminRecord = {
        id: 'test-id',
        email: 'test@example.com',
        password_hash: 'hash',
        is_active: true,
        last_login_at: null,
        failed_login_attempts: 5,
        locked_until: futureDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(isAccountLocked(admin)).toBe(true);
    });

    it('should handle edge case at exact lockout time (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate time offsets in milliseconds (-1 hour to +1 hour)
          fc.integer({ min: -3600000, max: 3600000 }),
          async (offsetMs) => {
            const lockedUntil = new Date(Date.now() + offsetMs).toISOString();
            const admin: AdminRecord = {
              id: 'test-id',
              email: 'test@example.com',
              password_hash: 'hash',
              is_active: true,
              last_login_at: null,
              failed_login_attempts: 5,
              locked_until: lockedUntil,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const isLocked = isAccountLocked(admin);

            // Property: Account is locked if and only if locked_until > now
            if (offsetMs > 0) {
              expect(isLocked).toBe(true);
            } else {
              expect(isLocked).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
