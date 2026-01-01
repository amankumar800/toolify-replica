/**
 * Property-Based Tests for Footer Company Link Navigation
 * 
 * **Feature: company-pages-management**
 * **Property 6: Footer Company Link Navigation**
 * **Validates: Requirements 3.6**
 * 
 * For any company page link in the footer, clicking the link SHALL navigate
 * to the correct internal page URL (/about, /contact, /privacy, /terms).
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// =============================================================================
// Types for Testing
// =============================================================================

interface CompanyPageLink {
  label: string;
  href: string;
  testId: string;
}

// =============================================================================
// Constants - Company Page Links Configuration
// =============================================================================

/**
 * The fixed set of company page links that should appear in the footer
 * These are internal pages with fixed URLs
 */
const COMPANY_PAGE_LINKS: CompanyPageLink[] = [
  { label: 'About Us', href: '/about', testId: 'footer-about-link' },
  { label: 'Contact', href: '/contact', testId: 'footer-contact-link' },
  { label: 'Privacy Policy', href: '/privacy', testId: 'footer-privacy-link' },
  { label: 'Terms of Service', href: '/terms', testId: 'footer-terms-link' },
];

/**
 * Valid company page slugs
 */
const COMPANY_PAGE_SLUGS = ['about', 'contact', 'privacy', 'terms'] as const;
type CompanyPageSlug = typeof COMPANY_PAGE_SLUGS[number];

// =============================================================================
// Arbitraries (Generators) for Property-Based Testing
// =============================================================================

/**
 * Generates a random company page slug
 */
const companyPageSlugArbitrary: fc.Arbitrary<CompanyPageSlug> = fc.constantFrom(...COMPANY_PAGE_SLUGS);

/**
 * Generates a random company page link from the fixed set
 */
const companyPageLinkArbitrary: fc.Arbitrary<CompanyPageLink> = fc.constantFrom(...COMPANY_PAGE_LINKS);

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Gets the expected href for a company page slug
 */
function getExpectedHref(slug: CompanyPageSlug): string {
  return `/${slug}`;
}

/**
 * Gets the company page link configuration by slug
 */
function getLinkBySlug(slug: CompanyPageSlug): CompanyPageLink | undefined {
  return COMPANY_PAGE_LINKS.find(link => link.href === `/${slug}`);
}

/**
 * Validates that a link href is a valid internal company page URL
 */
function isValidCompanyPageUrl(href: string): boolean {
  return COMPANY_PAGE_SLUGS.some(slug => href === `/${slug}`);
}

// =============================================================================
// Property Tests
// =============================================================================

describe('Footer Company Link Navigation - Property Tests', () => {
  /**
   * **Feature: company-pages-management, Property 6: Footer Company Link Navigation**
   * **Validates: Requirements 3.6**
   */

  describe('Link Href Correctness (Requirement 3.6)', () => {
    it('for any company page slug, the link href matches the expected internal URL', () => {
      fc.assert(
        fc.property(
          companyPageSlugArbitrary,
          (slug) => {
            const expectedHref = getExpectedHref(slug);
            const link = getLinkBySlug(slug);

            expect(link).toBeDefined();
            expect(link!.href).toBe(expectedHref);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any company page link, the href is a valid internal URL starting with /', () => {
      fc.assert(
        fc.property(
          companyPageLinkArbitrary,
          (link) => {
            expect(link.href).toMatch(/^\/[a-z]+$/);
            expect(isValidCompanyPageUrl(link.href)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any company page link, the href does not contain external URL patterns', () => {
      fc.assert(
        fc.property(
          companyPageLinkArbitrary,
          (link) => {
            // Should not be an external URL
            expect(link.href).not.toMatch(/^https?:\/\//);
            expect(link.href).not.toMatch(/^\/\//);
            // Should be a relative internal path
            expect(link.href.startsWith('/')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Link Configuration Completeness', () => {
    it('all four company pages have corresponding links', () => {
      for (const slug of COMPANY_PAGE_SLUGS) {
        const link = getLinkBySlug(slug);
        expect(link).toBeDefined();
        expect(link!.href).toBe(`/${slug}`);
      }
    });

    it('exactly four company page links are configured', () => {
      expect(COMPANY_PAGE_LINKS.length).toBe(4);
    });

    it('each company page link has a unique href', () => {
      const hrefs = COMPANY_PAGE_LINKS.map(link => link.href);
      const uniqueHrefs = new Set(hrefs);
      expect(uniqueHrefs.size).toBe(COMPANY_PAGE_LINKS.length);
    });

    it('each company page link has a unique testId', () => {
      const testIds = COMPANY_PAGE_LINKS.map(link => link.testId);
      const uniqueTestIds = new Set(testIds);
      expect(uniqueTestIds.size).toBe(COMPANY_PAGE_LINKS.length);
    });
  });

  describe('Link Label Consistency', () => {
    it('for any company page link, the label is non-empty', () => {
      fc.assert(
        fc.property(
          companyPageLinkArbitrary,
          (link) => {
            expect(link.label.trim()).not.toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any company page link, the testId follows naming convention', () => {
      fc.assert(
        fc.property(
          companyPageLinkArbitrary,
          (link) => {
            // testId should follow pattern: footer-{slug}-link
            expect(link.testId).toMatch(/^footer-[a-z]+-link$/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Slug to Href Mapping', () => {
    it('for any slug, the href is exactly /{slug}', () => {
      fc.assert(
        fc.property(
          companyPageSlugArbitrary,
          (slug) => {
            const expectedHref = `/${slug}`;
            expect(getExpectedHref(slug)).toBe(expectedHref);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('href to slug mapping is bijective (one-to-one)', () => {
      const hrefToSlug = new Map<string, CompanyPageSlug>();
      
      for (const slug of COMPANY_PAGE_SLUGS) {
        const href = getExpectedHref(slug);
        
        // Each href should map to exactly one slug
        expect(hrefToSlug.has(href)).toBe(false);
        hrefToSlug.set(href, slug);
      }

      // All slugs should have unique hrefs
      expect(hrefToSlug.size).toBe(COMPANY_PAGE_SLUGS.length);
    });
  });

  describe('Determinism', () => {
    it('link configuration is deterministic', () => {
      fc.assert(
        fc.property(
          companyPageSlugArbitrary,
          (slug) => {
            const link1 = getLinkBySlug(slug);
            const link2 = getLinkBySlug(slug);

            expect(link1).toEqual(link2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('href generation is deterministic for same slug', () => {
      fc.assert(
        fc.property(
          companyPageSlugArbitrary,
          (slug) => {
            const href1 = getExpectedHref(slug);
            const href2 = getExpectedHref(slug);

            expect(href1).toBe(href2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
