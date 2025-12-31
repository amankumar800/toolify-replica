/**
 * Property-based tests for admins service
 *
 * Tests Properties 18 and 19 from the design document:
 * - Property 18: Admin Status Badge
 * - Property 19: Password Hashing
 *
 * **Feature: admin-panel-crud**
 * **Validates: Requirements 11.2, 11.6**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateAdminStatus, type AdminStatus } from '../admins.service';
import type { AdminRecord } from '@/lib/db/repositories/admins.repository';
import { hashPassword, verifyPassword } from '@/lib/utils/password';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock admin record for testing
 */
function createMockAdminRecord(overrides: Partial<AdminRecord> = {}): AdminRecord {
  return {
    id: 'test-id',
    email: 'test@example.com',
    password_hash: '$2a$12$test',
    is_active: true,
    last_login_at: null,
    failed_login_attempts: 0,
    locked_until: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// Property 18: Admin Status Badge
// ============================================================================

describe('Property 18: Admin Status Badge', () => {
  /**
   * **Feature: admin-panel-crud, Property 18: Admin Status Badge**
   * **Validates: Requirements 11.2**
   *
   * *For any* admin user, the status badge SHALL display:
   * - green for active (is_active=true, locked_until=null or past)
   * - gray for inactive (is_active=false)
   * - red for locked (locked_until > now)
   */

  describe('Active status (green badge)', () => {
    it('should return "active" for admin with is_active=true and no locked_until', () => {
      const admin = createMockAdminRecord({
        is_active: true,
        locked_until: null,
      });

      const status = calculateAdminStatus(admin);
      expect(status).toBe('active');
    });

    it('should return "active" for admin with is_active=true and locked_until in the past', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hour ago
      const admin = createMockAdminRecord({
        is_active: true,
        locked_until: pastDate,
      });

      const status = calculateAdminStatus(admin);
      expect(status).toBe('active');
    });

    // Property test: For any past date, active admin should have "active" status
    it('should return "active" for any past locked_until date when is_active=true (property test with 100 runs)', () => {
      // Generate dates in the past (1 second to 1 year ago)
      const pastDateArb = fc.integer({ min: 1000, max: 365 * 24 * 60 * 60 * 1000 }).map(
        (msAgo) => new Date(Date.now() - msAgo).toISOString()
      );

      fc.assert(
        fc.property(pastDateArb, (pastDate) => {
          const admin = createMockAdminRecord({
            is_active: true,
            locked_until: pastDate,
          });

          const status = calculateAdminStatus(admin);
          expect(status).toBe('active');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Inactive status (gray badge)', () => {
    it('should return "inactive" for admin with is_active=false and no locked_until', () => {
      const admin = createMockAdminRecord({
        is_active: false,
        locked_until: null,
      });

      const status = calculateAdminStatus(admin);
      expect(status).toBe('inactive');
    });

    it('should return "inactive" for admin with is_active=false and locked_until in the past', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hour ago
      const admin = createMockAdminRecord({
        is_active: false,
        locked_until: pastDate,
      });

      const status = calculateAdminStatus(admin);
      expect(status).toBe('inactive');
    });
  });

  describe('Locked status (red badge)', () => {
    it('should return "locked" for admin with locked_until in the future', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour from now
      const admin = createMockAdminRecord({
        is_active: true,
        locked_until: futureDate,
      });

      const status = calculateAdminStatus(admin);
      expect(status).toBe('locked');
    });

    // Property test: For any future date, admin should have "locked" status
    it('should return "locked" for any future locked_until date (property test with 100 runs)', () => {
      // Generate dates in the future (1 second to 1 day from now)
      const futureDateArb = fc.integer({ min: 1000, max: 24 * 60 * 60 * 1000 }).map(
        (msFromNow) => new Date(Date.now() + msFromNow).toISOString()
      );

      fc.assert(
        fc.property(futureDateArb, (futureDate) => {
          const admin = createMockAdminRecord({
            is_active: true,
            locked_until: futureDate,
          });

          const status = calculateAdminStatus(admin);
          expect(status).toBe('locked');
        }),
        { numRuns: 100 }
      );
    });

    it('should return "locked" even if is_active=false when locked_until is in the future', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour from now
      const admin = createMockAdminRecord({
        is_active: false,
        locked_until: futureDate,
      });

      const status = calculateAdminStatus(admin);
      // Locked takes priority over inactive
      expect(status).toBe('locked');
    });
  });

  describe('Status priority', () => {
    // Property test: Locked status should always take priority
    it('should prioritize locked status over inactive status (property test with 100 runs)', () => {
      const futureDateArb = fc.integer({ min: 1000, max: 24 * 60 * 60 * 1000 }).map(
        (msFromNow) => new Date(Date.now() + msFromNow).toISOString()
      );
      const isActiveArb = fc.boolean();

      fc.assert(
        fc.property(futureDateArb, isActiveArb, (futureDate, isActive) => {
          const admin = createMockAdminRecord({
            is_active: isActive,
            locked_until: futureDate,
          });

          const status = calculateAdminStatus(admin);
          // Locked should always take priority when locked_until is in the future
          expect(status).toBe('locked');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Comprehensive status calculation', () => {
    // Property test: Status should be deterministic based on is_active and locked_until
    it('should calculate status deterministically for any admin state (property test with 100 runs)', () => {
      const adminStateArb = fc.record({
        is_active: fc.boolean(),
        locked_until: fc.option(
          fc.integer({ min: -365 * 24 * 60 * 60 * 1000, max: 365 * 24 * 60 * 60 * 1000 }).map(
            (offset) => new Date(Date.now() + offset).toISOString()
          ),
          { nil: undefined }
        ),
      });

      fc.assert(
        fc.property(adminStateArb, ({ is_active, locked_until }) => {
          const admin = createMockAdminRecord({
            is_active,
            locked_until: locked_until ?? null,
          });

          const status = calculateAdminStatus(admin);

          // Verify status is one of the valid values
          expect(['active', 'inactive', 'locked']).toContain(status);

          // Verify status follows the rules
          const now = new Date();
          const isLocked = locked_until && new Date(locked_until) > now;

          if (isLocked) {
            expect(status).toBe('locked');
          } else if (!is_active) {
            expect(status).toBe('inactive');
          } else {
            expect(status).toBe('active');
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});

// ============================================================================
// Property 19: Password Hashing
// ============================================================================

describe('Property 19: Password Hashing', () => {
  /**
   * **Feature: admin-panel-crud, Property 19: Password Hashing**
   * **Validates: Requirements 11.6**
   *
   * *For any* admin being created, the password SHALL be hashed using bcrypt
   * before storage, and the stored hash SHALL NOT equal the plaintext password.
   */

  // Bcrypt hash format regex
  const BCRYPT_HASH_REGEX = /^\$2[aby]?\$(\d{2})\$.{53}$/;

  describe('Hash format', () => {
    it('should produce valid bcrypt hash format', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toMatch(BCRYPT_HASH_REGEX);
      expect(hash.length).toBe(60);
    }, 10000);

    // Property test: Any valid password should produce a valid bcrypt hash
    it('should produce valid bcrypt hash for any password (property test with 5 runs)', async () => {
      // Generate passwords that meet requirements (8+ chars, uppercase, number, special)
      const validPasswordArb = fc
        .tuple(
          fc.stringMatching(/^[A-Z]{1,2}$/),
          fc.stringMatching(/^[0-9]{1,2}$/),
          fc.stringMatching(/^[!@#$%^&*]{1}$/),
          fc.stringMatching(/^[a-z]{5,10}$/)
        )
        .map(([upper, num, special, lower]) => upper + num + special + lower);

      await fc.assert(
        fc.asyncProperty(validPasswordArb, async (password) => {
          const hash = await hashPassword(password);

          // Property: Hash should be valid bcrypt format
          expect(hash).toMatch(BCRYPT_HASH_REGEX);
          expect(hash.length).toBe(60);
        }),
        { numRuns: 5 }
      );
    }, 30000);
  });

  describe('Hash uniqueness', () => {
    it('should produce different hashes for the same password (salt uniqueness)', async () => {
      const password = 'TestPassword123!';

      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Property: Same password should produce different hashes due to unique salts
      expect(hash1).not.toBe(hash2);
    }, 15000);
  });

  describe('Hash vs plaintext', () => {
    it('should never equal the plaintext password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      // Property: Hash should never equal plaintext
      expect(hash).not.toBe(password);
    }, 10000);

    // Property test: Hash should never equal plaintext for any password
    it('should never equal plaintext for any password (property test with 5 runs)', async () => {
      const passwordArb = fc.string({ minLength: 1, maxLength: 20 });

      await fc.assert(
        fc.asyncProperty(passwordArb, async (password) => {
          const hash = await hashPassword(password);

          // Property: Hash should never equal plaintext
          expect(hash).not.toBe(password);
        }),
        { numRuns: 5 }
      );
    }, 30000);
  });

  describe('Password verification', () => {
    it('should verify correct password against its hash', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    }, 10000);

    it('should reject incorrect password against hash', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    }, 10000);

    // Property test: Round-trip verification should always work
    it('should verify any password against its own hash (property test with 5 runs)', async () => {
      const passwordArb = fc.string({ minLength: 1, maxLength: 20 });

      await fc.assert(
        fc.asyncProperty(passwordArb, async (password) => {
          const hash = await hashPassword(password);

          // Property: Password should verify against its own hash
          const isValid = await verifyPassword(password, hash);
          expect(isValid).toBe(true);
        }),
        { numRuns: 5 }
      );
    }, 30000);

    // Property test: Different passwords should not verify against each other's hashes
    it('should reject different passwords against hash (property test with 5 runs)', async () => {
      const differentPasswordsArb = fc
        .tuple(
          fc.string({ minLength: 1, maxLength: 15 }),
          fc.string({ minLength: 1, maxLength: 15 })
        )
        .filter(([p1, p2]) => p1 !== p2);

      await fc.assert(
        fc.asyncProperty(differentPasswordsArb, async ([password1, password2]) => {
          const hash = await hashPassword(password1);

          // Property: Different password should not verify
          const isValid = await verifyPassword(password2, hash);
          expect(isValid).toBe(false);
        }),
        { numRuns: 5 }
      );
    }, 30000);
  });

  describe('Cost factor', () => {
    it('should use cost factor of at least 12', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const match = hash.match(BCRYPT_HASH_REGEX);
      expect(match).not.toBeNull();

      const costFactor = parseInt(match![1], 10);
      expect(costFactor).toBeGreaterThanOrEqual(12);
    }, 10000);
  });
});
