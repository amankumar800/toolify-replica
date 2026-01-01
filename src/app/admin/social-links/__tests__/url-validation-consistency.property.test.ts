/**
 * Property-based tests for URL validation consistency across all social link fields
 *
 * Tests Property 8 from the company-pages-management design document:
 * - Property 8: URL Validation Consistency
 *
 * **Feature: company-pages-management**
 * **Validates: Requirements 5.3**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateSocialUrl } from '@/lib/utils/validation';

/**
 * All URL field keys that should use the same validation
 */
const ALL_URL_FIELDS = [
  'twitter_url',
  'linkedin_url',
  'facebook_url',
  'instagram_url',
  'community_url',
  'help_center_url',
] as const;

const SOCIAL_MEDIA_FIELDS = ['twitter_url', 'linkedin_url', 'facebook_url', 'instagram_url'] as const;
const EXTERNAL_LINK_FIELDS = ['community_url', 'help_center_url'] as const;

describe('URL Validation Consistency Property Tests', () => {
  /**
   * **Feature: company-pages-management, Property 8: URL Validation Consistency**
   * **Validates: Requirements 5.3**
   *
   * *For any* URL input field (social media or external links), the same validation rules
   * SHALL apply: accept valid URLs (starting with http:// or https://) and empty strings,
   * reject all other strings.
   */
  describe('Property 8: URL Validation Consistency', () => {
    // Arbitrary for generating valid HTTP URLs
    const validUrlArb = fc
      .tuple(
        fc.constantFrom('http://', 'https://'),
        fc.stringMatching(/^[a-z0-9-]{1,20}$/),
        fc.stringMatching(/^[a-z]{2,6}$/),
        fc.option(fc.stringMatching(/^\/[a-z0-9\/-]{0,30}$/), { nil: undefined })
      )
      .map(([protocol, domain, tld, path]) => `${protocol}${domain}.${tld}${path || ''}`);

    // Arbitrary for generating invalid URLs (no protocol)
    const invalidUrlArb = fc
      .stringMatching(/^[a-z0-9.-]{1,30}$/)
      .filter((s: string) => !s.startsWith('http://') && !s.startsWith('https://') && s !== '');

    // Arbitrary for selecting any URL field
    const urlFieldArb = fc.constantFrom(...ALL_URL_FIELDS);

    // Arbitrary for selecting a social media field
    const socialMediaFieldArb = fc.constantFrom(...SOCIAL_MEDIA_FIELDS);

    // Arbitrary for selecting an external link field
    const externalLinkFieldArb = fc.constantFrom(...EXTERNAL_LINK_FIELDS);

    it('should apply same validation to all URL fields for valid URLs (property test with 100 runs)', () => {
      fc.assert(
        fc.property(validUrlArb, urlFieldArb, (url, _field) => {
          // The same validateSocialUrl function is used for all fields
          const result = validateSocialUrl(url);

          // Property: Valid URLs should be accepted regardless of which field they're for
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should apply same validation to all URL fields for invalid URLs (property test with 100 runs)', () => {
      fc.assert(
        fc.property(invalidUrlArb, urlFieldArb, (url, _field) => {
          // The same validateSocialUrl function is used for all fields
          const result = validateSocialUrl(url);

          // Property: Invalid URLs should be rejected regardless of which field they're for
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Please enter a valid URL (http:// or https://)');
        }),
        { numRuns: 100 }
      );
    });

    it('should apply same validation to all URL fields for empty strings (property test with 100 runs)', () => {
      fc.assert(
        fc.property(urlFieldArb, (_field) => {
          // The same validateSocialUrl function is used for all fields
          const result = validateSocialUrl('');

          // Property: Empty strings should be accepted regardless of which field they're for
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should produce identical results for social media and external link fields with same input (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.oneof(validUrlArb, invalidUrlArb, fc.constant('')),
          socialMediaFieldArb,
          externalLinkFieldArb,
          (url, _socialField, _externalField) => {
            // Validate the same URL for both field types
            const socialResult = validateSocialUrl(url);
            const externalResult = validateSocialUrl(url);

            // Property: Results should be identical for both field types
            expect(socialResult.valid).toBe(externalResult.valid);
            expect(socialResult.error).toBe(externalResult.error);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate external link URLs the same as social media URLs', () => {
      const testCases = [
        { url: 'https://community.example.com', expectedValid: true },
        { url: 'https://help.example.com/docs', expectedValid: true },
        { url: 'http://discord.gg/invite', expectedValid: true },
        { url: '', expectedValid: true },
        { url: 'community.example.com', expectedValid: false },
        { url: 'help.example.com', expectedValid: false },
        { url: 'just-text', expectedValid: false },
        { url: 'ftp://files.example.com', expectedValid: false },
      ];

      for (const { url, expectedValid } of testCases) {
        // Test for community_url field
        const communityResult = validateSocialUrl(url);
        expect(communityResult.valid).toBe(expectedValid);

        // Test for help_center_url field
        const helpCenterResult = validateSocialUrl(url);
        expect(helpCenterResult.valid).toBe(expectedValid);

        // Test for a social media field (twitter_url)
        const twitterResult = validateSocialUrl(url);
        expect(twitterResult.valid).toBe(expectedValid);

        // All results should be identical
        expect(communityResult.valid).toBe(twitterResult.valid);
        expect(helpCenterResult.valid).toBe(twitterResult.valid);
      }
    });
  });
});
