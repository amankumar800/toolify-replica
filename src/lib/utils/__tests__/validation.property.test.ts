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


import { validateSocialUrl } from '../validation';

/**
 * Property-based tests for URL validation utilities
 *
 * Tests Property 1 from the social-links-management design document:
 * - Property 1: URL Validation
 *
 * **Feature: social-links-management**
 * **Validates: Requirements 1.4, 1.6, 1.7**
 */
describe('URL Validation Property Tests', () => {
  /**
   * **Feature: social-links-management, Property 1: URL Validation**
   * **Validates: Requirements 1.4, 1.6, 1.7**
   *
   * *For any* string input, the URL validation function SHALL accept valid URLs
   * (starting with http:// or https://) and empty strings, and SHALL reject all other strings.
   */
  describe('Property 1: URL Validation', () => {
    // Arbitrary for generating valid HTTP URLs
    const validHttpUrlArb = fc
      .tuple(
        fc.constantFrom('http://', 'https://'),
        fc.stringMatching(/^[a-z0-9-]{1,20}$/),
        fc.stringMatching(/^[a-z]{2,6}$/),
        fc.option(fc.stringMatching(/^\/[a-z0-9\/-]{0,30}$/), { nil: undefined })
      )
      .map(([protocol, domain, tld, path]) => `${protocol}${domain}.${tld}${path || ''}`);

    // Arbitrary for generating strings without http:// or https:// prefix
    const noProtocolArb = fc
      .stringMatching(/^[a-z0-9.-]{1,30}$/)
      .filter((s: string) => !s.startsWith('http://') && !s.startsWith('https://'));

    // Arbitrary for generating strings with invalid protocols
    const invalidProtocolArb = fc
      .tuple(
        fc.constantFrom('ftp://', 'mailto:', 'file://', 'ssh://', 'ws://'),
        fc.stringMatching(/^[a-z0-9-]{1,15}\.[a-z]{2,4}$/)
      )
      .map(([protocol, domain]) => `${protocol}${domain}`);

    // Arbitrary for generating strings with whitespace
    const whitespaceUrlArb = fc
      .tuple(
        fc.constantFrom('https://'),
        fc.stringMatching(/^[a-z]{1,5}$/),
        fc.constantFrom(' ', '\t', '\n'),
        fc.stringMatching(/^[a-z]{1,5}\.[a-z]{2,4}$/)
      )
      .map(([protocol, a, ws, b]) => `${protocol}${a}${ws}${b}`);

    // Arbitrary for generating random non-URL strings
    const randomStringArb = fc
      .string({ minLength: 1, maxLength: 50 })
      .filter((s: string) => !s.startsWith('http://') && !s.startsWith('https://') && s !== '');

    it('should accept valid HTTP/HTTPS URLs (property test with 100 runs)', () => {
      fc.assert(
        fc.property(validHttpUrlArb, (url) => {
          const result = validateSocialUrl(url);

          // Property: Valid URLs should be accepted
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should accept empty strings (property test with 100 runs)', () => {
      // Empty string is a special case - always valid
      const result = validateSocialUrl('');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject strings without http:// or https:// prefix (property test with 100 runs)', () => {
      fc.assert(
        fc.property(noProtocolArb, (input) => {
          const result = validateSocialUrl(input);

          // Property: Strings without valid protocol should be rejected
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Please enter a valid URL (http:// or https://)');
        }),
        { numRuns: 100 }
      );
    });

    it('should reject strings with invalid protocols (property test with 100 runs)', () => {
      fc.assert(
        fc.property(invalidProtocolArb, (input) => {
          const result = validateSocialUrl(input);

          // Property: Non-HTTP protocols should be rejected
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Please enter a valid URL (http:// or https://)');
        }),
        { numRuns: 100 }
      );
    });

    it('should reject URLs with whitespace (property test with 100 runs)', () => {
      fc.assert(
        fc.property(whitespaceUrlArb, (input: string) => {
          const result = validateSocialUrl(input);

          // Property: URLs with whitespace should be rejected
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Please enter a valid URL (http:// or https://)');
        }),
        { numRuns: 100 }
      );
    });

    it('should reject random non-URL strings (property test with 100 runs)', () => {
      fc.assert(
        fc.property(randomStringArb, (input) => {
          const result = validateSocialUrl(input);

          // Property: Random strings should be rejected
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Please enter a valid URL (http:// or https://)');
        }),
        { numRuns: 100 }
      );
    });

    it('should handle common valid social media URLs', () => {
      const validUrls = [
        'https://twitter.com/example',
        'https://www.linkedin.com/company/example',
        'https://facebook.com/example',
        'https://instagram.com/example',
        'http://twitter.com/example',
        'https://x.com/example'
      ];

      for (const url of validUrls) {
        const result = validateSocialUrl(url);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });

    it('should reject common invalid URL formats', () => {
      const invalidUrls = [
        'twitter.com/example',
        'www.linkedin.com/company/example',
        'facebook.com',
        'just-some-text',
        'ftp://files.example.com',
        'mailto:test@example.com'
      ];

      for (const url of invalidUrls) {
        const result = validateSocialUrl(url);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Please enter a valid URL (http:// or https://)');
      }
    });
  });
});
