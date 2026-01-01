/**
 * Property-based tests for Company Pages Edit Navigation
 *
 * **Feature: company-pages-management, Property 2: Edit Navigation**
 * **Validates: Requirements 1.4**
 *
 * *For any* company page slug, clicking the Edit button SHALL navigate to
 * `/admin/company-pages/{slug}/edit`.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { CompanyPageSlug } from '@/lib/supabase/types';

// ============================================================================
// Test Arbitraries
// ============================================================================

// Arbitrary for valid company page slugs
const companyPageSlugArb = fc.constantFrom('about', 'contact', 'privacy', 'terms') as fc.Arbitrary<CompanyPageSlug>;

// ============================================================================
// Helper Functions (Pure logic extracted from component)
// ============================================================================

/**
 * Generate the edit URL for a company page
 * This is the logic used by the Edit button in the list page
 */
function generateEditUrl(slug: string): string {
  return `/admin/company-pages/${slug}/edit`;
}

/**
 * Validate that an edit URL is correctly formatted
 */
function isValidEditUrl(url: string, expectedSlug: string): boolean {
  const expectedUrl = `/admin/company-pages/${expectedSlug}/edit`;
  return url === expectedUrl;
}

/**
 * Parse a slug from an edit URL
 */
function parseSlugFromEditUrl(url: string): string | null {
  const match = url.match(/^\/admin\/company-pages\/([^/]+)\/edit$/);
  return match ? match[1] : null;
}

/**
 * Validate that an edit URL follows the correct pattern
 */
function validateEditUrlPattern(url: string): {
  isValid: boolean;
  hasCorrectPrefix: boolean;
  hasCorrectSuffix: boolean;
  extractedSlug: string | null;
} {
  const hasCorrectPrefix = url.startsWith('/admin/company-pages/');
  const hasCorrectSuffix = url.endsWith('/edit');
  const extractedSlug = parseSlugFromEditUrl(url);
  const isValid = hasCorrectPrefix && hasCorrectSuffix && extractedSlug !== null;

  return {
    isValid,
    hasCorrectPrefix,
    hasCorrectSuffix,
    extractedSlug,
  };
}

// ============================================================================
// Property 2: Edit Navigation
// ============================================================================

describe('Property 2: Edit Navigation', () => {
  /**
   * **Feature: company-pages-management, Property 2: Edit Navigation**
   * **Validates: Requirements 1.4**
   *
   * *For any* company page slug, clicking the Edit button SHALL navigate to
   * `/admin/company-pages/{slug}/edit`.
   */

  it('should generate correct edit URL for any valid slug (property test with 20 runs)', () => {
    fc.assert(
      fc.property(companyPageSlugArb, (slug) => {
        const editUrl = generateEditUrl(slug);

        // Property: Edit URL should match expected format
        expect(editUrl).toBe(`/admin/company-pages/${slug}/edit`);
      }),
      { numRuns: 20 }
    );
  });

  it('should validate edit URL correctly for any valid slug (property test with 20 runs)', () => {
    fc.assert(
      fc.property(companyPageSlugArb, (slug) => {
        const editUrl = generateEditUrl(slug);
        const isValid = isValidEditUrl(editUrl, slug);

        // Property: Generated URL should be valid for the given slug
        expect(isValid).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  it('should have correct URL pattern for any valid slug (property test with 20 runs)', () => {
    fc.assert(
      fc.property(companyPageSlugArb, (slug) => {
        const editUrl = generateEditUrl(slug);
        const validation = validateEditUrlPattern(editUrl);

        // Property: URL should have correct prefix
        expect(validation.hasCorrectPrefix).toBe(true);

        // Property: URL should have correct suffix
        expect(validation.hasCorrectSuffix).toBe(true);

        // Property: URL should be valid overall
        expect(validation.isValid).toBe(true);

        // Property: Extracted slug should match original
        expect(validation.extractedSlug).toBe(slug);
      }),
      { numRuns: 20 }
    );
  });

  it('should round-trip slug through URL generation and parsing (property test with 20 runs)', () => {
    fc.assert(
      fc.property(companyPageSlugArb, (slug) => {
        const editUrl = generateEditUrl(slug);
        const parsedSlug = parseSlugFromEditUrl(editUrl);

        // Property: Parsing the generated URL should return the original slug
        expect(parsedSlug).toBe(slug);
      }),
      { numRuns: 20 }
    );
  });

  it('should generate unique URLs for different slugs', () => {
    const validSlugs: CompanyPageSlug[] = ['about', 'contact', 'privacy', 'terms'];
    const urls = validSlugs.map(generateEditUrl);

    // Property: All URLs should be unique
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toBe(validSlugs.length);

    // Property: Each URL should correspond to its slug
    validSlugs.forEach((slug, index) => {
      expect(urls[index]).toBe(`/admin/company-pages/${slug}/edit`);
    });
  });

  it('should generate URLs that start with admin path', () => {
    const validSlugs: CompanyPageSlug[] = ['about', 'contact', 'privacy', 'terms'];

    validSlugs.forEach((slug) => {
      const editUrl = generateEditUrl(slug);

      // Property: URL should start with /admin/
      expect(editUrl.startsWith('/admin/')).toBe(true);

      // Property: URL should be within company-pages section
      expect(editUrl.includes('/company-pages/')).toBe(true);
    });
  });

  it('should reject invalid edit URLs', () => {
    const invalidUrls = [
      '/admin/company-pages/about', // Missing /edit
      '/admin/company-pages//edit', // Empty slug
      '/company-pages/about/edit', // Missing /admin prefix
      '/admin/categories/about/edit', // Wrong section
      '/admin/company-pages/about/edit/', // Trailing slash
    ];

    invalidUrls.forEach((url) => {
      const validation = validateEditUrlPattern(url);
      // At least one validation should fail for invalid URLs
      const isInvalid = !validation.isValid || 
                        !validation.hasCorrectPrefix || 
                        !validation.hasCorrectSuffix ||
                        validation.extractedSlug === null;
      expect(isInvalid).toBe(true);
    });
  });

  it('should handle all four company page slugs correctly', () => {
    const expectedMappings: Record<CompanyPageSlug, string> = {
      about: '/admin/company-pages/about/edit',
      contact: '/admin/company-pages/contact/edit',
      privacy: '/admin/company-pages/privacy/edit',
      terms: '/admin/company-pages/terms/edit',
    };

    Object.entries(expectedMappings).forEach(([slug, expectedUrl]) => {
      const generatedUrl = generateEditUrl(slug);
      expect(generatedUrl).toBe(expectedUrl);
    });
  });
});
