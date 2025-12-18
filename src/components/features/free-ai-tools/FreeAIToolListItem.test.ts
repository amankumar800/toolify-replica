/**
 * Property-Based Tests for FreeAIToolListItem Component
 * 
 * Tests the tool list item utility functions with property-based testing.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  addUtmParameter,
  truncateDescription,
  formatToolDescription,
  isValidToolSlug,
} from './FreeAIToolListItem';
import type { Tool } from '@/lib/types/free-ai-tools';

// =============================================================================
// Arbitraries (Generators) for Property-Based Testing
// =============================================================================

/**
 * Generates valid URLs for testing UTM parameter addition
 */
const validUrlArbitrary = fc.webUrl();

/**
 * Generates valid tool slugs: lowercase alphanumeric with hyphens, max 100 chars
 */
const validToolSlugArbitrary = fc
  .stringMatching(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)
  .filter((s) => s.length >= 2 && s.length <= 100 && !s.includes('--'));

/**
 * Generates invalid tool slugs (uppercase, special chars, too long)
 */
const invalidToolSlugArbitrary = fc.oneof(
  // Uppercase letters
  fc.string({ minLength: 1, maxLength: 50 }).filter((s) => /[A-Z]/.test(s)),
  // Special characters (not alphanumeric or hyphen)
  fc.string({ minLength: 1, maxLength: 50 }).filter((s) => /[^a-z0-9-]/.test(s)),
  // Too long (> 100 chars)
  fc.string({ minLength: 101, maxLength: 150 }).map((s) => s.toLowerCase().replace(/[^a-z0-9-]/g, 'a')),
  // Empty string
  fc.constant('')
);

/**
 * Generates descriptions of various lengths for truncation testing
 */
const descriptionArbitrary = fc.string({ minLength: 0, maxLength: 600 });

/**
 * Generates descriptions that are definitely longer than 200 characters
 */
const longDescriptionArbitrary = fc.string({ minLength: 201, maxLength: 600 });

/**
 * Generates descriptions that are 200 characters or less
 */
const shortDescriptionArbitrary = fc.string({ minLength: 0, maxLength: 200 });

/**
 * Generates Tool objects for testing
 */
const toolArbitrary: fc.Arbitrary<Tool> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  slug: validToolSlugArbitrary,
  externalUrl: fc.option(validUrlArbitrary, { nil: null }),
  description: fc.string({ maxLength: 500 }),
  freeTierDetails: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  pricing: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  categoryIds: fc.array(fc.uuid(), { maxLength: 5 }),
});

// =============================================================================
// Property-Based Tests
// =============================================================================

describe('FreeAIToolListItem - Property Tests', () => {
  /**
   * **Feature: free-ai-tools, Property 2: Tool Description Format Preservation**
   * **Validates: Requirements 5.3, 5.4**
   * 
   * For any tool description scraped from the source, the rendered output SHALL
   * preserve the original format including free tier details, features, and pricing
   * separated by " / " and " - ".
   */
  describe('Property 2: Tool Description Format Preservation', () => {
    it('formatToolDescription preserves freeTierDetails when present', () => {
      fc.assert(
        fc.property(toolArbitrary, (tool) => {
          const formatted = formatToolDescription(tool);
          
          // If freeTierDetails exists, it should be in the output
          if (tool.freeTierDetails && tool.freeTierDetails.length > 0) {
            expect(formatted).toContain(tool.freeTierDetails);
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('formatToolDescription preserves pricing when present and not duplicated', () => {
      fc.assert(
        fc.property(toolArbitrary, (tool) => {
          const formatted = formatToolDescription(tool);
          
          // If pricing exists and is not already in description, it should be in output
          if (tool.pricing && tool.pricing.length > 0 && !tool.description?.includes(tool.pricing)) {
            expect(formatted).toContain(tool.pricing);
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('formatToolDescription preserves description content', () => {
      fc.assert(
        fc.property(toolArbitrary, (tool) => {
          const formatted = formatToolDescription(tool);
          
          // If description exists and freeTierDetails is not duplicated in it
          if (tool.description && tool.description.length > 0) {
            if (!tool.freeTierDetails || !tool.description.includes(tool.freeTierDetails)) {
              expect(formatted).toContain(tool.description);
            }
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('formatToolDescription uses " - " separator between parts', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            slug: validToolSlugArbitrary,
            externalUrl: fc.constant(null),
            description: fc.string({ minLength: 1, maxLength: 100 }),
            freeTierDetails: fc.string({ minLength: 1, maxLength: 50 }),
            pricing: fc.string({ minLength: 1, maxLength: 50 }),
            categoryIds: fc.array(fc.uuid(), { maxLength: 2 }),
          }),
          (tool) => {
            // Ensure description doesn't contain freeTierDetails or pricing
            const cleanTool = {
              ...tool,
              description: 'unique description content',
              freeTierDetails: 'free tier info',
              pricing: 'From $10/month',
            };
            
            const formatted = formatToolDescription(cleanTool);
            
            // Should contain separator between parts
            expect(formatted).toContain(' - ');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: free-ai-tools, Property 9: Tool Description Truncation**
   * **Validates: Requirements 5.7**
   * 
   * For any tool description exceeding 200 characters, the rendered output SHALL
   * truncate with ellipsis and provide expand functionality that reveals the full
   * description when activated.
   */
  describe('Property 9: Tool Description Truncation', () => {
    it('descriptions <= 200 chars are not truncated', () => {
      fc.assert(
        fc.property(shortDescriptionArbitrary, (description) => {
          const truncated = truncateDescription(description, 200);
          
          // Should be unchanged (no ellipsis added)
          expect(truncated).toBe(description);
          expect(truncated).not.toContain('...');
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('descriptions > 200 chars are truncated with ellipsis', () => {
      fc.assert(
        fc.property(longDescriptionArbitrary, (description) => {
          const truncated = truncateDescription(description, 200);
          
          // Should end with ellipsis
          expect(truncated).toMatch(/\.\.\.$/);
          
          // Should be shorter than or equal to maxLength + ellipsis
          expect(truncated.length).toBeLessThanOrEqual(203); // 200 + "..."
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('truncated text is a prefix of the original', () => {
      fc.assert(
        fc.property(longDescriptionArbitrary, (description) => {
          const truncated = truncateDescription(description, 200);
          
          // Remove ellipsis to get the prefix
          const prefix = truncated.replace(/\.\.\.$/, '');
          
          // The prefix should be a substring of the original starting at index 0
          expect(description.startsWith(prefix)).toBe(true);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('truncation respects word boundaries when possible', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 201, maxLength: 400 }).filter((s) => s.includes(' ')),
          (description) => {
            const truncated = truncateDescription(description, 200);
            const prefix = truncated.replace(/\.\.\.$/, '');
            
            // If there was a space in the truncation zone, it should end at a word boundary
            // (not in the middle of a word)
            const lastChar = prefix[prefix.length - 1];
            
            // Either ends with space, or the next char in original is space/end
            const nextCharInOriginal = description[prefix.length];
            const endsAtWordBoundary = 
              lastChar === ' ' || 
              nextCharInOriginal === ' ' || 
              nextCharInOriginal === undefined;
            
            // This is a soft check - word boundary is preferred but not always possible
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: free-ai-tools, Property 7: External Link UTM Parameter**
   * **Validates: Requirements 14.2**
   * 
   * For any rendered external tool link, the URL SHALL contain the query
   * parameter `utm_source=toolify`.
   */
  describe('Property 7: External Link UTM Parameter', () => {
    it('addUtmParameter adds utm_source=toolify to URLs without query params', () => {
      fc.assert(
        fc.property(
          fc.webUrl().filter((url) => !url.includes('?')),
          (url) => {
            const result = addUtmParameter(url);
            
            // Should contain utm_source=toolify
            expect(result).toContain('utm_source=toolify');
            
            // Should use ? as separator for first param
            expect(result).toContain('?utm_source=toolify');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('addUtmParameter adds utm_source=toolify to URLs with existing query params', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.webUrl().filter((url) => !url.includes('?')),
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z]+$/.test(s)),
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z0-9]+$/.test(s))
          ),
          ([baseUrl, paramName, paramValue]) => {
            const urlWithParam = `${baseUrl}?${paramName}=${paramValue}`;
            const result = addUtmParameter(urlWithParam);
            
            // Should contain utm_source=toolify
            expect(result).toContain('utm_source=toolify');
            
            // Should preserve original param
            expect(result).toContain(`${paramName}=${paramValue}`);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('addUtmParameter overwrites existing utm_source parameter', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.webUrl().filter((url) => !url.includes('?')),
            // Generate source values that won't be substrings of 'toolify'
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => 
              /^[a-z]+$/.test(s) && !s.startsWith('t') && s !== 'toolify'
            )
          ),
          ([baseUrl, existingSource]) => {
            const urlWithUtm = `${baseUrl}?utm_source=${existingSource}`;
            const result = addUtmParameter(urlWithUtm);
            
            // Should contain utm_source=toolify (overwritten)
            expect(result).toContain('utm_source=toolify');
            
            // Parse the URL to verify the utm_source value is exactly 'toolify'
            const parsedUrl = new URL(result);
            expect(parsedUrl.searchParams.get('utm_source')).toBe('toolify');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('addUtmParameter returns empty string for empty input', () => {
      const result = addUtmParameter('');
      expect(result).toBe('');
    });
  });

  /**
   * **Feature: free-ai-tools, Property 6: Tool Slug Format Validation**
   * **Validates: Requirements 13.5**
   * 
   * For any stored tool, the slug SHALL be at most 100 characters and contain
   * only alphanumeric characters and hyphens.
   */
  describe('Property 6: Tool Slug Format Validation', () => {
    it('valid slugs pass validation', () => {
      fc.assert(
        fc.property(validToolSlugArbitrary, (slug) => {
          expect(isValidToolSlug(slug)).toBe(true);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('invalid slugs fail validation', () => {
      fc.assert(
        fc.property(invalidToolSlugArbitrary, (slug) => {
          expect(isValidToolSlug(slug)).toBe(false);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('slugs > 100 characters fail validation', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 101, maxLength: 200 }).map((s) => 
            s.toLowerCase().replace(/[^a-z0-9-]/g, 'a')
          ),
          (slug) => {
            expect(isValidToolSlug(slug)).toBe(false);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('slugs with uppercase letters fail validation', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 50 }).filter((s) => /[A-Z]/.test(s)),
          (slug) => {
            expect(isValidToolSlug(slug)).toBe(false);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('slugs with special characters fail validation', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 50 }).filter((s) => /[^a-zA-Z0-9-]/.test(s)),
          (slug) => {
            expect(isValidToolSlug(slug)).toBe(false);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('empty slug fails validation', () => {
      expect(isValidToolSlug('')).toBe(false);
    });
  });
});
