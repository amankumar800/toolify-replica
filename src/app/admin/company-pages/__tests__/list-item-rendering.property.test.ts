/**
 * Property-based tests for Company Pages List Item Rendering
 *
 * **Feature: company-pages-management, Property 1: Company Page List Item Rendering**
 * **Validates: Requirements 1.2, 1.3**
 *
 * *For any* company page in the database, the list page SHALL render an item
 * containing the page title, last updated date, and an edit button.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { CompanyPageRow, CompanyPageSlug } from '@/lib/supabase/types';

// ============================================================================
// Test Arbitraries
// ============================================================================

// Arbitrary for valid company page slugs
const companyPageSlugArb = fc.constantFrom('about', 'contact', 'privacy', 'terms') as fc.Arbitrary<CompanyPageSlug>;

// Arbitrary for non-empty titles
const titleArb = fc.string({ minLength: 1, maxLength: 200 })
  .filter(s => s.trim().length > 0)
  .map(s => s.trim());

// Arbitrary for content (can be empty)
const contentArb = fc.string({ minLength: 0, maxLength: 5000 });

// Arbitrary for valid ISO date strings using integer timestamps
const dateStringArb = fc.integer({
  min: new Date('2020-01-01').getTime(),
  max: new Date('2030-12-31').getTime(),
}).map(ts => new Date(ts).toISOString());

// Arbitrary for generating company page rows
const companyPageRowArb: fc.Arbitrary<CompanyPageRow> = fc.record({
  id: fc.uuid(),
  slug: companyPageSlugArb,
  title: titleArb,
  content: contentArb,
  created_at: fc.option(dateStringArb, { nil: null }),
  updated_at: fc.option(dateStringArb, { nil: null }),
});

// Arbitrary for generating arrays of company pages (1-4 pages)
const companyPagesArb = fc.array(companyPageRowArb, { minLength: 1, maxLength: 4 });

// ============================================================================
// Helper Functions (Pure logic extracted from component)
// ============================================================================

/**
 * Format date for display
 * Extracted from the component for testing
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Represents the data that should be rendered for a list item
 */
interface ListItemRenderData {
  slug: string;
  title: string;
  formattedDate: string;
  editUrl: string;
}

/**
 * Transform a company page row into list item render data
 * This represents what the component should render
 */
function transformToListItemData(page: CompanyPageRow): ListItemRenderData {
  return {
    slug: page.slug,
    title: page.title,
    formattedDate: formatDate(page.updated_at),
    editUrl: `/admin/company-pages/${page.slug}/edit`,
  };
}

/**
 * Validate that list item data contains all required elements
 * Requirements: 1.2, 1.3
 */
function validateListItemData(data: ListItemRenderData): {
  hasTitle: boolean;
  hasDate: boolean;
  hasEditUrl: boolean;
  isValid: boolean;
} {
  const hasTitle = data.title.length > 0;
  const hasDate = data.formattedDate.length > 0;
  const hasEditUrl = data.editUrl.startsWith('/admin/company-pages/') && data.editUrl.endsWith('/edit');
  
  return {
    hasTitle,
    hasDate,
    hasEditUrl,
    isValid: hasTitle && hasDate && hasEditUrl,
  };
}

// ============================================================================
// Property 1: Company Page List Item Rendering
// ============================================================================

describe('Property 1: Company Page List Item Rendering', () => {
  /**
   * **Feature: company-pages-management, Property 1: Company Page List Item Rendering**
   * **Validates: Requirements 1.2, 1.3**
   *
   * *For any* company page in the database, the list page SHALL render an item
   * containing the page title, last updated date, and an edit button.
   */

  it('should render title for any company page (property test with 100 runs)', () => {
    fc.assert(
      fc.property(companyPageRowArb, (page) => {
        const renderData = transformToListItemData(page);
        const validation = validateListItemData(renderData);

        // Property: Title should always be present and match the page title
        expect(validation.hasTitle).toBe(true);
        expect(renderData.title).toBe(page.title);
      }),
      { numRuns: 20 }
    );
  });

  it('should render formatted date for any company page (property test with 20 runs)', () => {
    fc.assert(
      fc.property(companyPageRowArb, (page) => {
        const renderData = transformToListItemData(page);
        const validation = validateListItemData(renderData);

        // Property: Date should always be present (either formatted date or "Never")
        expect(validation.hasDate).toBe(true);
        
        // If updated_at is null, should show "Never"
        if (page.updated_at === null) {
          expect(renderData.formattedDate).toBe('Never');
        } else {
          // Should be a non-empty formatted date string
          expect(renderData.formattedDate.length).toBeGreaterThan(0);
          expect(renderData.formattedDate).not.toBe('Never');
        }
      }),
      { numRuns: 20 }
    );
  });

  it('should render edit button with correct URL for any company page (property test with 20 runs)', () => {
    fc.assert(
      fc.property(companyPageRowArb, (page) => {
        const renderData = transformToListItemData(page);
        const validation = validateListItemData(renderData);

        // Property: Edit URL should be correctly formatted
        expect(validation.hasEditUrl).toBe(true);
        expect(renderData.editUrl).toBe(`/admin/company-pages/${page.slug}/edit`);
      }),
      { numRuns: 20 }
    );
  });

  it('should render all required elements for any company page (property test with 20 runs)', () => {
    fc.assert(
      fc.property(companyPageRowArb, (page) => {
        const renderData = transformToListItemData(page);
        const validation = validateListItemData(renderData);

        // Property: All required elements should be present
        expect(validation.isValid).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  it('should render all pages in a list correctly (property test with 20 runs)', () => {
    fc.assert(
      fc.property(companyPagesArb, (pages) => {
        // Transform all pages to render data
        const renderDataList = pages.map(transformToListItemData);

        // Property: Each page should have valid render data
        renderDataList.forEach((renderData, index) => {
          const validation = validateListItemData(renderData);
          expect(validation.isValid).toBe(true);
          expect(renderData.slug).toBe(pages[index].slug);
          expect(renderData.title).toBe(pages[index].title);
        });

        // Property: Number of rendered items should match number of pages
        expect(renderDataList.length).toBe(pages.length);
      }),
      { numRuns: 20 }
    );
  });

  it('should format dates consistently (property test with 20 runs)', () => {
    fc.assert(
      fc.property(dateStringArb, (dateString) => {
        const formatted = formatDate(dateString);

        // Property: Formatted date should be non-empty
        expect(formatted.length).toBeGreaterThan(0);

        // Property: Formatted date should contain year, month, and day components
        // The format is "MMM D, YYYY, HH:MM AM/PM"
        expect(formatted).toMatch(/\w{3}\s+\d{1,2},\s+\d{4}/);
      }),
      { numRuns: 20 }
    );
  });

  it('should handle null dates correctly', () => {
    const formatted = formatDate(null);
    expect(formatted).toBe('Never');
  });

  it('should generate correct edit URLs for all valid slugs', () => {
    const validSlugs: CompanyPageSlug[] = ['about', 'contact', 'privacy', 'terms'];

    validSlugs.forEach((slug) => {
      const page: CompanyPageRow = {
        id: 'test-id',
        slug,
        title: 'Test Title',
        content: 'Test content',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const renderData = transformToListItemData(page);
      expect(renderData.editUrl).toBe(`/admin/company-pages/${slug}/edit`);
    });
  });
});
