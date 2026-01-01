/**
 * Property-Based Tests for Footer Social Links Filtering
 * 
 * **Feature: social-links-management**
 * **Property 3: Footer Filtering**
 * **Validates: Requirements 2.2**
 * 
 * For any set of social links with mixed empty and non-empty URLs, the Footer
 * component SHALL display exactly the platforms with non-empty URLs and hide
 * platforms with empty URLs.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SOCIAL_PLATFORMS, SocialPlatform } from '@/lib/utils/icon-mapping';
import type { SocialLinksResponse } from '@/lib/supabase/types';

// =============================================================================
// Types for Testing
// =============================================================================

interface FilteredSocialLink {
  platform: SocialPlatform;
  url: string;
}

// =============================================================================
// Arbitraries (Generators) for Property-Based Testing
// =============================================================================

/**
 * Generates a valid URL string (non-empty)
 */
const validUrlArbitrary = fc.webUrl();

/**
 * Generates an empty or whitespace-only string
 */
const emptyUrlArbitrary = fc.oneof(
  fc.constant(''),
  fc.constant('   '),
  fc.constant('\t'),
  fc.constant('  ')
);

/**
 * Generates a URL that is either valid or empty
 */
const urlOrEmptyArbitrary = fc.oneof(
  validUrlArbitrary,
  emptyUrlArbitrary
);

/**
 * Generates a SocialLinksResponse with random URLs (some empty, some valid)
 */
const socialLinksResponseArbitrary: fc.Arbitrary<SocialLinksResponse> = fc.record({
  twitter: fc.option(urlOrEmptyArbitrary, { nil: undefined }),
  linkedin: fc.option(urlOrEmptyArbitrary, { nil: undefined }),
  facebook: fc.option(urlOrEmptyArbitrary, { nil: undefined }),
  instagram: fc.option(urlOrEmptyArbitrary, { nil: undefined }),
});

/**
 * Generates a SocialLinksResponse with all valid URLs
 */
const allValidLinksArbitrary: fc.Arbitrary<SocialLinksResponse> = fc.record({
  twitter: validUrlArbitrary,
  linkedin: validUrlArbitrary,
  facebook: validUrlArbitrary,
  instagram: validUrlArbitrary,
});

/**
 * Generates a SocialLinksResponse with all empty URLs
 */
const allEmptyLinksArbitrary: fc.Arbitrary<SocialLinksResponse> = fc.record({
  twitter: emptyUrlArbitrary,
  linkedin: emptyUrlArbitrary,
  facebook: emptyUrlArbitrary,
  instagram: emptyUrlArbitrary,
});

// =============================================================================
// Footer Filtering Logic (mirrors Footer component logic)
// =============================================================================

/**
 * Filters social links to return only platforms with non-empty URLs
 * This mirrors the filtering logic in Footer.tsx
 */
function filterActiveSocialLinks(socialLinks: SocialLinksResponse): FilteredSocialLink[] {
  return SOCIAL_PLATFORMS.filter(
    (platform) => socialLinks[platform] && socialLinks[platform]!.trim() !== ''
  ).map((platform) => ({
    platform,
    url: socialLinks[platform]!,
  }));
}

/**
 * Checks if a URL is considered "active" (non-empty and non-whitespace)
 */
function isActiveUrl(url: string | undefined): boolean {
  return url !== undefined && url.trim() !== '';
}

// =============================================================================
// Property Tests
// =============================================================================

describe('Footer Social Links Filtering - Property Tests', () => {
  /**
   * **Feature: social-links-management, Property 3: Footer Filtering**
   * **Validates: Requirements 2.2**
   */

  describe('Filtering Correctness (Requirement 2.2)', () => {
    it('for any social links, only platforms with non-empty URLs are included', () => {
      fc.assert(
        fc.property(
          socialLinksResponseArbitrary,
          (socialLinks) => {
            const filtered = filterActiveSocialLinks(socialLinks);

            // Every filtered link should have a non-empty URL
            for (const link of filtered) {
              expect(link.url.trim()).not.toBe('');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any social links, platforms with empty URLs are excluded', () => {
      fc.assert(
        fc.property(
          socialLinksResponseArbitrary,
          (socialLinks) => {
            const filtered = filterActiveSocialLinks(socialLinks);
            const filteredPlatforms = filtered.map((link) => link.platform);

            // Check that platforms with empty URLs are not in the filtered list
            for (const platform of SOCIAL_PLATFORMS) {
              const url = socialLinks[platform];
              if (!isActiveUrl(url)) {
                expect(filteredPlatforms).not.toContain(platform);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any social links, all platforms with non-empty URLs are included', () => {
      fc.assert(
        fc.property(
          socialLinksResponseArbitrary,
          (socialLinks) => {
            const filtered = filterActiveSocialLinks(socialLinks);
            const filteredPlatforms = filtered.map((link) => link.platform);

            // Check that all platforms with non-empty URLs are in the filtered list
            for (const platform of SOCIAL_PLATFORMS) {
              const url = socialLinks[platform];
              if (isActiveUrl(url)) {
                expect(filteredPlatforms).toContain(platform);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Count Invariants', () => {
    it('filtered count equals count of non-empty URLs', () => {
      fc.assert(
        fc.property(
          socialLinksResponseArbitrary,
          (socialLinks) => {
            const filtered = filterActiveSocialLinks(socialLinks);
            
            // Count non-empty URLs manually
            const expectedCount = SOCIAL_PLATFORMS.filter(
              (platform) => isActiveUrl(socialLinks[platform])
            ).length;

            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('filtered count is between 0 and 4 (inclusive)', () => {
      fc.assert(
        fc.property(
          socialLinksResponseArbitrary,
          (socialLinks) => {
            const filtered = filterActiveSocialLinks(socialLinks);

            expect(filtered.length).toBeGreaterThanOrEqual(0);
            expect(filtered.length).toBeLessThanOrEqual(4);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('All Valid Links', () => {
    it('when all URLs are valid, all 4 platforms are included', () => {
      fc.assert(
        fc.property(
          allValidLinksArbitrary,
          (socialLinks) => {
            const filtered = filterActiveSocialLinks(socialLinks);

            expect(filtered.length).toBe(4);
            
            const platforms = filtered.map((link) => link.platform);
            expect(platforms).toContain('twitter');
            expect(platforms).toContain('linkedin');
            expect(platforms).toContain('facebook');
            expect(platforms).toContain('instagram');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('All Empty Links', () => {
    it('when all URLs are empty, no platforms are included', () => {
      fc.assert(
        fc.property(
          allEmptyLinksArbitrary,
          (socialLinks) => {
            const filtered = filterActiveSocialLinks(socialLinks);

            expect(filtered.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('URL Preservation', () => {
    it('filtered URLs match original URLs exactly', () => {
      fc.assert(
        fc.property(
          socialLinksResponseArbitrary,
          (socialLinks) => {
            const filtered = filterActiveSocialLinks(socialLinks);

            for (const link of filtered) {
              expect(link.url).toBe(socialLinks[link.platform]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Platform Order', () => {
    it('filtered platforms maintain SOCIAL_PLATFORMS order', () => {
      fc.assert(
        fc.property(
          socialLinksResponseArbitrary,
          (socialLinks) => {
            const filtered = filterActiveSocialLinks(socialLinks);
            const filteredPlatforms = filtered.map((link) => link.platform);

            // Check that the order matches SOCIAL_PLATFORMS order
            const expectedOrder = SOCIAL_PLATFORMS.filter(
              (platform) => isActiveUrl(socialLinks[platform])
            );

            expect(filteredPlatforms).toEqual(expectedOrder);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Determinism', () => {
    it('filtering is deterministic for same input', () => {
      fc.assert(
        fc.property(
          socialLinksResponseArbitrary,
          (socialLinks) => {
            const filtered1 = filterActiveSocialLinks(socialLinks);
            const filtered2 = filterActiveSocialLinks(socialLinks);

            expect(filtered1).toEqual(filtered2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Whitespace Handling', () => {
    it('whitespace-only URLs are treated as empty', () => {
      const whitespaceLinks: SocialLinksResponse = {
        twitter: '   ',
        linkedin: '\t',
        facebook: ' \n ',
        instagram: '',
      };

      const filtered = filterActiveSocialLinks(whitespaceLinks);

      expect(filtered.length).toBe(0);
    });

    it('URLs with leading/trailing whitespace but content are included', () => {
      const linksWithWhitespace: SocialLinksResponse = {
        twitter: '  https://twitter.com/test  ',
        linkedin: '',
        facebook: undefined,
        instagram: 'https://instagram.com/test',
      };

      const filtered = filterActiveSocialLinks(linksWithWhitespace);

      expect(filtered.length).toBe(2);
      expect(filtered.map((l) => l.platform)).toContain('twitter');
      expect(filtered.map((l) => l.platform)).toContain('instagram');
    });
  });
});
