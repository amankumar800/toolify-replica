/**
 * Property-based tests for password utilities
 *
 * Tests Properties 2 and 4 from the design document:
 * - Property 2: Password Hashing Format
 * - Property 4: Password Strength Validation
 *
 * **Feature: admin-auth-separation**
 * **Validates: Requirements 1.4, 6.4**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from '../password';

describe('Password Utilities Property Tests', () => {
  /**
   * **Feature: admin-auth-separation, Property 2: Password Hashing Format**
   * **Validates: Requirements 1.4**
   *
   * *For any* password string, when hashed by the Admin_System, the resulting hash
   * SHALL be a valid bcrypt hash with cost factor of at least 12.
   */
  describe('Property 2: Password Hashing Format', () => {
    // Bcrypt hash format: $2a$12$... or $2b$12$... (22 char salt + 31 char hash)
    // Total length is 60 characters
    const BCRYPT_HASH_REGEX = /^\$2[aby]?\$(\d{2})\$.{53}$/;
    const MIN_COST_FACTOR = 12;

    // Arbitrary for generating non-empty password strings (short for faster hashing)
    const passwordArb = fc.string({ minLength: 1, maxLength: 20 });

    it('should produce valid bcrypt hash format for any non-empty password (property test with 5 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(passwordArb, async (password) => {
          const hash = await hashPassword(password);

          // Property: Hash should match bcrypt format
          expect(hash).toMatch(BCRYPT_HASH_REGEX);

          // Property: Hash should be exactly 60 characters
          expect(hash.length).toBe(60);
        }),
        { numRuns: 5 }
      );
    }, 30000); // 30 second timeout for bcrypt operations

    it('should use cost factor of at least 12 for any password (property test with 5 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(passwordArb, async (password) => {
          const hash = await hashPassword(password);

          // Extract cost factor from hash (e.g., $2a$12$... -> 12)
          const match = hash.match(BCRYPT_HASH_REGEX);
          expect(match).not.toBeNull();

          const costFactor = parseInt(match![1], 10);

          // Property: Cost factor should be at least 12
          expect(costFactor).toBeGreaterThanOrEqual(MIN_COST_FACTOR);
        }),
        { numRuns: 5 }
      );
    }, 30000); // 30 second timeout for bcrypt operations

    it('should produce different hashes for the same password (salt uniqueness)', async () => {
      const password = 'TestPassword123';

      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Property: Same password should produce different hashes due to unique salts
      expect(hash1).not.toBe(hash2);

      // But both should verify correctly
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    }, 15000); // 15 second timeout

    it('should verify correct password against its hash (round-trip property with 5 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(passwordArb, async (password) => {
          const hash = await hashPassword(password);

          // Property: Original password should verify against its hash
          const isValid = await verifyPassword(password, hash);
          expect(isValid).toBe(true);
        }),
        { numRuns: 5 }
      );
    }, 30000); // 30 second timeout for bcrypt operations

    it('should reject incorrect passwords (property test with 5 runs)', async () => {
      // Generate pairs of different passwords
      const differentPasswordsArb = fc
        .tuple(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 })
        )
        .filter(([p1, p2]) => p1 !== p2);

      await fc.assert(
        fc.asyncProperty(differentPasswordsArb, async ([password1, password2]) => {
          const hash = await hashPassword(password1);

          // Property: Different password should not verify against hash
          const isValid = await verifyPassword(password2, hash);
          expect(isValid).toBe(false);
        }),
        { numRuns: 5 }
      );
    }, 30000); // 30 second timeout for bcrypt operations
  });

  /**
   * **Feature: admin-auth-separation, Property 4: Password Strength Validation**
   * **Validates: Requirements 6.4**
   *
   * *For any* password string, the Admin_System SHALL accept only passwords with
   * at least 8 characters, at least 1 uppercase letter, and at least 1 number,
   * rejecting all others with a descriptive error.
   */
  describe('Property 4: Password Strength Validation', () => {
    // Arbitrary for generating valid passwords (8+ chars, 1 uppercase, 1 number)
    // Ensure minimum 8 characters by using larger minimum lengths
    const validPasswordArb = fc
      .tuple(
        fc.stringMatching(/^[A-Z]{1,2}$/),
        fc.stringMatching(/^[0-9]{1,2}$/),
        fc.stringMatching(/^[a-z]{6,15}$/)  // At least 6 lowercase to ensure 8+ total
      )
      .map(([upper, num, lower]: [string, string, string]) => {
        // Combine components (guaranteed 8+ chars: 1+ upper + 1+ num + 6+ lower)
        const chars = (upper + num + lower).split('');
        // Simple shuffle
        for (let i = chars.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [chars[i], chars[j]] = [chars[j], chars[i]];
        }
        return chars.join('');
      });

    // Arbitrary for generating passwords that are too short (1-7 chars)
    const shortPasswordArb = fc.string({ minLength: 1, maxLength: 7 });

    // Arbitrary for generating passwords without uppercase (lowercase + numbers, 8+ chars)
    const noUppercaseArb = fc
      .stringMatching(/^[a-z0-9]{8,20}$/)
      .filter((s: string) => /[0-9]/.test(s)); // Ensure at least one number

    // Arbitrary for generating passwords without numbers (letters only, 8+ chars)
    const noNumberArb = fc
      .stringMatching(/^[a-zA-Z]{8,20}$/)
      .filter((s: string) => /[A-Z]/.test(s)); // Ensure at least one uppercase

    it('should accept valid passwords with 8+ chars, uppercase, and number (property test with 20 runs)', () => {
      fc.assert(
        fc.property(validPasswordArb, (password) => {
          const result = validatePasswordStrength(password);

          // Property: Valid passwords should be accepted
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }),
        { numRuns: 20 }
      );
    });

    it('should reject passwords shorter than 8 characters (property test with 20 runs)', () => {
      fc.assert(
        fc.property(shortPasswordArb, (password) => {
          const result = validatePasswordStrength(password);

          // Property: Short passwords should be rejected
          expect(result.valid).toBe(false);
          expect(result.error).toContain('8 characters');
        }),
        { numRuns: 20 }
      );
    });

    it('should reject passwords without uppercase letters (property test with 20 runs)', () => {
      fc.assert(
        fc.property(noUppercaseArb, (password: string) => {
          const result = validatePasswordStrength(password);

          // Property: Passwords without uppercase should be rejected
          expect(result.valid).toBe(false);
          expect(result.error).toContain('uppercase');
        }),
        { numRuns: 20 }
      );
    });

    it('should reject passwords without numbers (property test with 20 runs)', () => {
      fc.assert(
        fc.property(noNumberArb, (password: string) => {
          const result = validatePasswordStrength(password);

          // Property: Passwords without numbers should be rejected
          expect(result.valid).toBe(false);
          expect(result.error).toContain('number');
        }),
        { numRuns: 20 }
      );
    });

    it('should reject empty passwords', () => {
      const result = validatePasswordStrength('');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should provide descriptive error messages for each validation failure', () => {
      // Test each failure case has a descriptive message
      const shortResult = validatePasswordStrength('Ab1');
      expect(shortResult.error).toBe('Password must be at least 8 characters');

      const noUpperResult = validatePasswordStrength('abcdefgh1');
      expect(noUpperResult.error).toBe('Password must contain at least 1 uppercase letter');

      const noNumberResult = validatePasswordStrength('Abcdefgh');
      expect(noNumberResult.error).toBe('Password must contain at least 1 number');
    });

    it('should validate in correct order: length -> uppercase -> number', () => {
      // A password that fails all three should report length error first
      const result = validatePasswordStrength('abc');
      expect(result.error).toContain('8 characters');
    });
  });

  /**
   * Additional edge case tests for verifyPassword
   */
  describe('verifyPassword edge cases', () => {
    it('should return false for empty password', async () => {
      const hash = await hashPassword('ValidPassword1');
      const result = await verifyPassword('', hash);
      expect(result).toBe(false);
    }, 10000);

    it('should return false for empty hash', async () => {
      const result = await verifyPassword('ValidPassword1', '');
      expect(result).toBe(false);
    });

    it('should return false for invalid hash format', async () => {
      const result = await verifyPassword('ValidPassword1', 'not-a-valid-hash');
      expect(result).toBe(false);
    });
  });

  /**
   * Additional edge case tests for hashPassword
   */
  describe('hashPassword edge cases', () => {
    it('should throw error for empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password cannot be empty');
    });

    it('should handle passwords with special characters', async () => {
      // Test just 2 examples to keep test fast
      const specialPasswords = ['Test@123!', 'Pass#word$1'];

      for (const password of specialPasswords) {
        const hash = await hashPassword(password);
        expect(hash).toMatch(/^\$2[aby]?\$\d{2}\$.{53}$/);
        expect(await verifyPassword(password, hash)).toBe(true);
      }
    }, 15000);

    it('should handle unicode passwords', async () => {
      // Test just 1 example to keep test fast
      const password = 'Tëst123Pàss';
      const hash = await hashPassword(password);
      expect(hash).toMatch(/^\$2[aby]?\$\d{2}\$.{53}$/);
      expect(await verifyPassword(password, hash)).toBe(true);
    }, 10000);
  });
});
