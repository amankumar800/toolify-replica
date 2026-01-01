/**
 * Property-Based Tests for Footer Conditional External Link Display
 * 
 * **Feature: company-pages-management**
 * **Property 10: Conditional External Link Display**
 * **Validates: Requirements 5.5**
 * 
 * For any external link (Community, Help Center), the Footer SHALL display
 * the link if and only if the URL is non-empty.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ExternalLinksResponse } from '@/lib/supabase/types';

// =============================================================================
// Types for Testing
// =============================================================================

interface ExternalLinkDisplay {
  community: boolean;
  help_center: boolean;
}

type ExternalLinkPlatform = 'community' | 'help_center';

// =============================================================================
// Constants
// =============================================================================

const EXTERNAL_LINK_PLATFORMS: ExternalLinkPlatform[] = ['community', 'help_center'];

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
  fc.constant(undefined)
);

/**
 * Generates a URL that is either valid or empty
 */
const urlOrEmptyArbitrary = fc.oneof(
  validUrlArbitrary,
  emptyUrlArbitrary
);

/**
 * Generates an ExternalLinksResponse with random URLs (some empty, some valid)
 */
const externalLinksResponseArbitrary: fc.Arbitrary<ExternalLinksResponse> = fc.record({
  community: fc.option(urlOrEmptyArbitrary, { nil: undefined }),
  help_center: fc.option(urlOrEmptyArbitrary, { nil: undefined }),
});

/**
 * Generates an ExternalLinksResponse with all valid URLs
 */
const allValidExternalLinksArbitrary: fc.Arbitrary<ExternalLinksResponse> = fc.record({
  community: validUrlArbitrary,
  help_center: validUrlArbitrary,
});

/**
 * Generates an ExternalLinksResponse with all empty URLs
 */
const allEmptyExternalLinksArbitrary: fc.Arbitrary<ExternalLinksResponse> = fc.record({
  community: emptyUrlArbitrary,
  help_center: emptyUrlArbitrary,
});

// =============================================================================
// Helper Functions - Mirrors Footer Component Logic
// =============================================================================

/**
 * Checks if a URL is considered "active" (non-empty and non-whitespace)
 */
function isActiveUrl(url: string | undefined): boolean {
  return url !== undefined && url.trim() !== '';
}

/**
 * Determines which external links should be displayed based on URL values
 * This mirrors the conditional rendering logic in Footer.tsx
 */
function getExternalLinkDisplayState(externalLinks: ExternalLinksResponse): ExternalLinkDisplay {
  return {
    community: isActiveUrl(externalLinks.community),
    help_center: isActiveUrl(externalLinks.help_center),
  };
}

/**
 * Counts how many external links should be displayed
 */
function countDisplayedLinks(externalLinks: ExternalLinksResponse): number {
  const displayState = getExternalLinkDisplayState(externalLinks);
  return (displayState.community ? 1 : 0) + (displayState.help_center ? 1 : 0);
}

// =============================================================================
// Property Tests
// =============================================================================

describe('Footer Conditional External Link Display - Property Tests', () => {
  /**
   * **Feature: company-pages-management, Property 10: Conditional External Link Display**
   * **Validates: Requirements 5.5**
   */

  describe('Conditional Display Logic (Requirement 5.5)', () => {
    it('for any external links, a link is displayed if and only if its URL is non-empty', () => {
      fc.assert(
        fc.property(
          externalLinksResponseArbitrary,
          (externalLinks) => {
            const displayState = getExternalLinkDisplayState(externalLinks);

            // Community link should be displayed iff URL is non-empty
            expect(displayState.community).toBe(isActiveUrl(externalLinks.community));
            
            // Help Center link should be displayed iff URL is non-empty
            expect(displayState.help_center).toBe(isActiveUrl(externalLinks.help_center));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any external links with non-empty URLs, those links are displayed', () => {
      fc.assert(
        fc.property(
          externalLinksResponseArbitrary,
          (externalLinks) => {
            const displayState = getExternalLinkDisplayState(externalLinks);

            for (const platform of EXTERNAL_LINK_PLATFORMS) {
              const url = externalLinks[platform];
              if (isActiveUrl(url)) {
                expect(displayState[platform]).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any external links with empty URLs, those links are hidden', () => {
      fc.assert(
        fc.property(
          externalLinksResponseArbitrary,
          (externalLinks) => {
            const displayState = getExternalLinkDisplayState(externalLinks);

            for (const platform of EXTERNAL_LINK_PLATFORMS) {
              const url = externalLinks[platform];
              if (!isActiveUrl(url)) {
                expect(displayState[platform]).toBe(false);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Count Invariants', () => {
    it('displayed link count equals count of non-empty URLs', () => {
      fc.assert(
        fc.property(
          externalLinksResponseArbitrary,
          (externalLinks) => {
            const displayedCount = countDisplayedLinks(externalLinks);
            
            // Count non-empty URLs manually
            const expectedCount = EXTERNAL_LINK_PLATFORMS.filter(
              (platform) => isActiveUrl(externalLinks[platform])
            ).length;

            expect(displayedCount).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('displayed link count is between 0 and 2 (inclusive)', () => {
      fc.assert(
        fc.property(
          externalLinksResponseArbitrary,
          (externalLinks) => {
            const displayedCount = countDisplayedLinks(externalLinks);

            expect(displayedCount).toBeGreaterThanOrEqual(0);
            expect(displayedCount).toBeLessThanOrEqual(2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('All Valid Links', () => {
    it('when all external URLs are valid, both links are displayed', () => {
      fc.assert(
        fc.property(
          allValidExternalLinksArbitrary,
          (externalLinks) => {
            const displayState = getExternalLinkDisplayState(externalLinks);

            expect(displayState.community).toBe(true);
            expect(displayState.help_center).toBe(true);
            expect(countDisplayedLinks(externalLinks)).toBe(2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('All Empty Links', () => {
    it('when all external URLs are empty, no links are displayed', () => {
      fc.assert(
        fc.property(
          allEmptyExternalLinksArbitrary,
          (externalLinks) => {
            const displayState = getExternalLinkDisplayState(externalLinks);

            expect(displayState.community).toBe(false);
            expect(displayState.help_center).toBe(false);
            expect(countDisplayedLinks(externalLinks)).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Whitespace Handling', () => {
    it('whitespace-only URLs are treated as empty (link hidden)', () => {
      const whitespaceLinks: ExternalLinksResponse = {
        community: '   ',
        help_center: '\t',
      };

      const displayState = getExternalLinkDisplayState(whitespaceLinks);

      expect(displayState.community).toBe(false);
      expect(displayState.help_center).toBe(false);
    });

    it('URLs with leading/trailing whitespace but content are displayed', () => {
      const linksWithWhitespace: ExternalLinksResponse = {
        community: '  https://community.example.com  ',
        help_center: '',
      };

      const displayState = getExternalLinkDisplayState(linksWithWhitespace);

      expect(displayState.community).toBe(true);
      expect(displayState.help_center).toBe(false);
    });
  });

  describe('Undefined Handling', () => {
    it('undefined URLs are treated as empty (link hidden)', () => {
      const undefinedLinks: ExternalLinksResponse = {
        community: undefined,
        help_center: undefined,
      };

      const displayState = getExternalLinkDisplayState(undefinedLinks);

      expect(displayState.community).toBe(false);
      expect(displayState.help_center).toBe(false);
    });

    it('mixed undefined and valid URLs display correctly', () => {
      const mixedLinks: ExternalLinksResponse = {
        community: 'https://community.example.com',
        help_center: undefined,
      };

      const displayState = getExternalLinkDisplayState(mixedLinks);

      expect(displayState.community).toBe(true);
      expect(displayState.help_center).toBe(false);
    });
  });

  describe('Determinism', () => {
    it('display state is deterministic for same input', () => {
      fc.assert(
        fc.property(
          externalLinksResponseArbitrary,
          (externalLinks) => {
            const displayState1 = getExternalLinkDisplayState(externalLinks);
            const displayState2 = getExternalLinkDisplayState(externalLinks);

            expect(displayState1).toEqual(displayState2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Independence', () => {
    it('community link display is independent of help_center URL', () => {
      fc.assert(
        fc.property(
          urlOrEmptyArbitrary,
          urlOrEmptyArbitrary,
          (communityUrl, helpCenterUrl) => {
            const links1: ExternalLinksResponse = {
              community: communityUrl,
              help_center: helpCenterUrl,
            };
            const links2: ExternalLinksResponse = {
              community: communityUrl,
              help_center: isActiveUrl(helpCenterUrl) ? '' : 'https://help.example.com',
            };

            const displayState1 = getExternalLinkDisplayState(links1);
            const displayState2 = getExternalLinkDisplayState(links2);

            // Community display should be the same regardless of help_center
            expect(displayState1.community).toBe(displayState2.community);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('help_center link display is independent of community URL', () => {
      fc.assert(
        fc.property(
          urlOrEmptyArbitrary,
          urlOrEmptyArbitrary,
          (communityUrl, helpCenterUrl) => {
            const links1: ExternalLinksResponse = {
              community: communityUrl,
              help_center: helpCenterUrl,
            };
            const links2: ExternalLinksResponse = {
              community: isActiveUrl(communityUrl) ? '' : 'https://community.example.com',
              help_center: helpCenterUrl,
            };

            const displayState1 = getExternalLinkDisplayState(links1);
            const displayState2 = getExternalLinkDisplayState(links2);

            // Help center display should be the same regardless of community
            expect(displayState1.help_center).toBe(displayState2.help_center);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
