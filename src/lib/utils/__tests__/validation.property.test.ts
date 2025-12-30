/**
 * Property-based tests for email validation utilities
 *
 * Tests Property 3 from the design document:
 * - Property 3: Email Format Validation
 *
 * **Feature: admin-auth-separation**
 * **Validates: Requirements 2.6, 8.1**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateEmail } from '../validation';

describe('Email Validation Property Tests', () => {
  /**
   * **Feature: admin-auth-separation, Property 3: Email Format Validation**
   * **Validates: Requirements 2.6, 8.1**
   *
   * *For any* string input to the email field, the Admin_System SHALL accept only
   * strings matching the standard email regex pattern `^[^\s@]+@[^\s@]+\.[^\s@]+$`
   * and reject all others before making database queries.
   */
  describe('Property 3: Email Format Validation', () => {
    // Arbitrary for generating valid email addresses
    // Format: local-part@domain.tld
    const validEmailArb = fc
      .tuple(
        fc.stringMatching(/^[a-z0-9._-]{1,20}$/),
        fc.stringMatching(/^[a-z0-9-]{1,15}$/),
        fc.stringMatching(/^[a-z]{2,6}$/)
      )
      .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

    // Arbitrary for generating strings without @ symbol
    const noAtSymbolArb = fc
      .stringMatching(/^[a-z0-9.]{1,30}$/)
      .filter((s: string) => !s.includes('@'));

    // Arbitrary for generating strings with multiple @ symbols
    const multipleAtArb = fc
      .tuple(
        fc.stringMatching(/^[a-z]{1,10}$/),
        fc.stringMatching(/^[a-z]{1,10}$/),
        fc.stringMatching(/^[a-z]{1,10}$/)
      )
      .map(([a, b, c]) => `${a}@${b}@${c}.com`);

    // Arbitrary for generating strings with whitespace
    const whitespaceEmailArb = fc
      .tuple(
        fc.stringMatching(/^[a-z]{1,5}$/),
        fc.constantFrom(' ', '\t', '\n'),
        fc.stringMatching(/^[a-z]{1,5}$/)
      )
      .map(([a, ws, b]) => `${a}${ws}${b}@domain.com`);

    // Arbitrary for generating emails without domain part (no dot after @)
    const noDomainDotArb = fc
      .tuple(
        fc.stringMatching(/^[a-z]{1,10}$/),
        fc.stringMatching(/^[a-z]{1,10}$/)
      )
      .map(([local, domain]) => `${local}@${domain}`);

    it('should accept valid email addresses (property test with 100 runs)', () => {
      fc.assert(
        fc.property(validEmailArb, (email) => {
          const result = validateEmail(email);

          // Property: Valid emails should be accepted
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should reject strings without @ symbol (property test with 100 runs)', () => {
      fc.assert(
        fc.property(noAtSymbolArb, (input) => {
          const result = validateEmail(input);

          // Property: Strings without @ should be rejected
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Please enter a valid email address');
        }),
        { numRuns: 100 }
      );
    });

    it('should reject strings with multiple @ symbols (property test with 100 runs)', () => {
      fc.assert(
        fc.property(multipleAtArb, (input) => {
          const result = validateEmail(input);

          // Property: Strings with multiple @ should be rejected
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Please enter a valid email address');
        }),
        { numRuns: 100 }
      );
    });

    it('should reject emails with whitespace in local part (property test with 100 runs)', () => {
      fc.assert(
        fc.property(whitespaceEmailArb, (input: string) => {
          const result = validateEmail(input);

          // Property: Emails with whitespace should be rejected
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Please enter a valid email address');
        }),
        { numRuns: 100 }
      );
    });

    it('should reject emails without domain dot (property test with 100 runs)', () => {
      fc.assert(
        fc.property(noDomainDotArb, (input) => {
          const result = validateEmail(input);

          // Property: Emails without domain.tld format should be rejected
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Please enter a valid email address');
        }),
        { numRuns: 100 }
      );
    });

    it('should reject empty strings', () => {
      const result = validateEmail('');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should handle common valid email formats', () => {
      const validEmails = [
        'admin@example.com',
        'user.name@domain.org',
        'test123@sub.domain.co.uk',
        'a@b.co',
        'user_name@domain.net',
        'user-name@domain.io'
      ];

      for (const email of validEmails) {
        const result = validateEmail(email);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });

    it('should reject common invalid email formats', () => {
      const invalidEmails = [
        'plainaddress',
        '@missinglocal.com',
        'missing@domain',
        'missing.domain@',
        'spaces in@email.com',
        'email@domain@domain.com'
      ];

      for (const email of invalidEmails) {
        const result = validateEmail(email);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Please enter a valid email address');
      }
    });

    it('should trim whitespace before validation', () => {
      // Leading/trailing whitespace should be trimmed
      const result = validateEmail('  admin@example.com  ');
      expect(result.valid).toBe(true);
    });
  });
});
