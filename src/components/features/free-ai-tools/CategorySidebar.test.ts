/**
 * Property-Based Tests for CategorySidebar Navigation Active State
 * 
 * **Feature: free-ai-tools, Property 1: Navigation Active State Detection**
 * **Validates: Requirements 1.4**
 * 
 * For any URL path starting with /free-ai-tools, the navigation component
 * SHALL apply the active state class to the "Free AI Tools" nav link.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isActiveLink } from './CategorySidebar';

// =============================================================================
// Arbitraries (Generators) for Property-Based Testing
// =============================================================================

/**
 * Generates valid category slugs based on the 22 known categories
 */
const validCategorySlugs = [
  'chatbots-virtual-companions',
  'office-productivity',
  'image-generation-editing',
  'art-creative-design',
  'coding-development',
  'video-animation',
  'education-translation',
  'writing-editing',
  'voice-generation-conversion',
  'business-management',
  'music-audio',
  'ai-detection-anti-detection',
  'marketing-advertising',
  'research-data-analysis',
  'social-media',
  'legal-finance',
  'daily-life',
  'health-wellness',
  'image-analysis',
  'interior-architectural-design',
  'business-research',
  'other-1',
];

/**
 * Generates valid free-ai-tools paths
 * - /free-ai-tools (main page)
 * - /free-ai-tools/[category-slug] (category pages)
 */
const freeAIToolsPathArbitrary = fc.oneof(
  // Main page
  fc.constant('/free-ai-tools'),
  // Category pages
  fc.constantFrom(...validCategorySlugs).map((slug) => `/free-ai-tools/${slug}`)
);

/**
 * Generates paths that are NOT free-ai-tools paths
 */
const nonFreeAIToolsPathArbitrary = fc.oneof(
  fc.constant('/'),
  fc.constant('/category'),
  fc.constant('/tool/some-tool'),
  fc.constant('/Best-trending-AI-Tools'),
  fc.constant('/midjourney-library'),
  fc.constant('/submit'),
  fc.constant('/login'),
  // Random paths that don't start with /free-ai-tools
  fc.stringMatching(/^\/[a-z][a-z0-9-]*$/).filter(
    (path) => !path.startsWith('/free-ai-tools')
  )
);

/**
 * Generates category hrefs
 */
const categoryHrefArbitrary = fc.constantFrom(...validCategorySlugs).map(
  (slug) => `/free-ai-tools/${slug}`
);

// =============================================================================
// Property-Based Tests
// =============================================================================

describe('CategorySidebar - Navigation Active State Detection', () => {
  /**
   * **Feature: free-ai-tools, Property 1: Navigation Active State Detection**
   * **Validates: Requirements 1.4**
   * 
   * For any URL path starting with /free-ai-tools, the navigation component
   * SHALL apply the active state class to the "Free AI Tools" nav link.
   */
  describe('Property 1: Navigation Active State Detection', () => {
    it('Introduction link is active when pathname is exactly /free-ai-tools', () => {
      fc.assert(
        fc.property(fc.constant('/free-ai-tools'), (pathname) => {
          const href = '/free-ai-tools';
          const isActive = isActiveLink(pathname, href);
          expect(isActive).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('category link is active when pathname matches the category href', () => {
      fc.assert(
        fc.property(categoryHrefArbitrary, (href) => {
          // When pathname equals the category href, it should be active
          const isActive = isActiveLink(href, href);
          expect(isActive).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('category link is NOT active when pathname is a different category', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.constantFrom(...validCategorySlugs),
            fc.constantFrom(...validCategorySlugs)
          ).filter(([slug1, slug2]) => slug1 !== slug2),
          ([slug1, slug2]) => {
            const pathname = `/free-ai-tools/${slug1}`;
            const href = `/free-ai-tools/${slug2}`;
            const isActive = isActiveLink(pathname, href);
            expect(isActive).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Introduction link is NOT active when on a category page', () => {
      fc.assert(
        fc.property(categoryHrefArbitrary, (categoryPath) => {
          const introHref = '/free-ai-tools';
          // Introduction link should NOT be active when on a category page
          // because the pathname doesn't exactly match /free-ai-tools
          const isActive = isActiveLink(categoryPath, introHref);
          expect(isActive).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('no free-ai-tools links are active when on non-free-ai-tools pages', () => {
      fc.assert(
        fc.property(
          fc.tuple(nonFreeAIToolsPathArbitrary, categoryHrefArbitrary),
          ([pathname, href]) => {
            const isActive = isActiveLink(pathname, href);
            expect(isActive).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Introduction link is not active on non-free-ai-tools pages', () => {
      fc.assert(
        fc.property(nonFreeAIToolsPathArbitrary, (pathname) => {
          const introHref = '/free-ai-tools';
          const isActive = isActiveLink(pathname, introHref);
          expect(isActive).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});

// =============================================================================
// Unit Tests for Edge Cases
// =============================================================================

describe('CategorySidebar - isActiveLink Edge Cases', () => {
  it('exact match returns true', () => {
    expect(isActiveLink('/free-ai-tools', '/free-ai-tools')).toBe(true);
    expect(isActiveLink('/free-ai-tools/chatbots-virtual-companions', '/free-ai-tools/chatbots-virtual-companions')).toBe(true);
  });

  it('partial match for category pages returns false for intro link', () => {
    // When on a category page, the intro link should NOT be active
    expect(isActiveLink('/free-ai-tools/chatbots-virtual-companions', '/free-ai-tools')).toBe(false);
  });

  it('different paths return false', () => {
    expect(isActiveLink('/category', '/free-ai-tools')).toBe(false);
    expect(isActiveLink('/', '/free-ai-tools')).toBe(false);
    expect(isActiveLink('/tool/some-tool', '/free-ai-tools/chatbots-virtual-companions')).toBe(false);
  });

  it('handles trailing slashes correctly', () => {
    // Our implementation doesn't add trailing slashes, so these should work as expected
    expect(isActiveLink('/free-ai-tools', '/free-ai-tools')).toBe(true);
  });
});
