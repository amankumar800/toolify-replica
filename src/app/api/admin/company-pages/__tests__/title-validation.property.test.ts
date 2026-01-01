/**
 * Property-based tests for company page title validation
 *
 * Tests Property 4 from the design document:
 * - Property 4: Title Validation
 *
 * **Feature: company-pages-management**
 * **Validates: Requirements 2.4, 2.6, 2.7**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateCompanyPageData } from '../[slug]/route';

describe('Company Page Title Validation Property Tests', () => {
  /**
   * **Feature: company-pages-management, Property 4: Title Validation**
   * **Validates: Requirements 2.4, 2.6, 2.7**
   *
   * *For any* title/content pair, validation SHALL pass if and only if the title
   * is non-empty (after trimming whitespace). Empty content SHALL always be accepted.
   */
  describe('Property 4: Title Validation', () => {
    // Arbitrary for generating non-empty titles (at least one non-whitespace char)
    const validTitleArb = fc
      .stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9 ]{0,99}$/)
      .filter((s: string) => s.trim().length > 0);

    // Arbitrary for generating whitespace-only strings
    const whitespaceOnlyArb = fc
      .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 20 })
      .map((arr) => arr.join(''));

    // Arbitrary for generating any content (including empty)
    const anyContentArb = fc.oneof(
      fc.constant(''),
      fc.string({ minLength: 0, maxLength: 500 })
    );

    // Arbitrary for generating valid titles with leading/trailing whitespace
    const titleWithWhitespaceArb = fc
      .tuple(
        fc.array(fc.constantFrom(' ', '\t'), { minLength: 0, maxLength: 5 }),
        fc.stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9 ]{0,50}$/),
        fc.array(fc.constantFrom(' ', '\t'), { minLength: 0, maxLength: 5 })
      )
      .map(([leading, title, trailing]) => leading.join('') + title + trailing.join(''))
      .filter((s: string) => s.trim().length > 0);

    it('should accept non-empty titles with any content (property test with 20 runs)', () => {
      fc.assert(
        fc.property(validTitleArb, anyContentArb, (title, content) => {
          const result = validateCompanyPageData({ title, content });

          // Property: Non-empty titles should be accepted
          expect(result.valid).toBe(true);
          expect(result.errors).toEqual({});
        }),
        { numRuns: 20 }
      );
    });

    it('should reject empty string titles (property test with 20 runs)', () => {
      fc.assert(
        fc.property(anyContentArb, (content) => {
          const result = validateCompanyPageData({ title: '', content });

          // Property: Empty titles should be rejected
          expect(result.valid).toBe(false);
          expect(result.errors.title).toBe('Title is required');
        }),
        { numRuns: 20 }
      );
    });

    it('should reject whitespace-only titles (property test with 20 runs)', () => {
      fc.assert(
        fc.property(whitespaceOnlyArb, anyContentArb, (title, content) => {
          const result = validateCompanyPageData({ title, content });

          // Property: Whitespace-only titles should be rejected
          expect(result.valid).toBe(false);
          expect(result.errors.title).toBe('Title is required');
        }),
        { numRuns: 20 }
      );
    });

    it('should accept titles with leading/trailing whitespace if non-empty after trim (property test with 20 runs)', () => {
      fc.assert(
        fc.property(titleWithWhitespaceArb, anyContentArb, (title, content) => {
          const result = validateCompanyPageData({ title, content });

          // Property: Titles with whitespace padding should be accepted if non-empty after trim
          expect(result.valid).toBe(true);
          expect(result.errors).toEqual({});
        }),
        { numRuns: 20 }
      );
    });

    it('should always accept empty content (property test with 20 runs)', () => {
      fc.assert(
        fc.property(validTitleArb, (title) => {
          const result = validateCompanyPageData({ title, content: '' });

          // Property: Empty content should always be accepted (Req 2.7)
          expect(result.valid).toBe(true);
          expect(result.errors).toEqual({});
        }),
        { numRuns: 20 }
      );
    });

    it('should handle common valid title/content combinations', () => {
      const validCombinations = [
        { title: 'About Us', content: '<p>Welcome to our company.</p>' },
        { title: 'Contact', content: '' },
        { title: 'Privacy Policy', content: 'We respect your privacy.' },
        { title: 'Terms of Service', content: '<h1>Terms</h1><p>Please read carefully.</p>' },
        { title: 'A', content: '' }, // Single character title
        { title: '  Padded Title  ', content: 'Some content' }, // Whitespace padding
      ];

      for (const combo of validCombinations) {
        const result = validateCompanyPageData(combo);
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual({});
      }
    });

    it('should reject common invalid title/content combinations', () => {
      const invalidCombinations = [
        { title: '', content: 'Some content' },
        { title: '   ', content: '' },
        { title: '\t\n', content: 'Content here' },
        { title: '  \t  ', content: '<p>HTML content</p>' },
      ];

      for (const combo of invalidCombinations) {
        const result = validateCompanyPageData(combo);
        expect(result.valid).toBe(false);
        expect(result.errors.title).toBe('Title is required');
      }
    });
  });
});
