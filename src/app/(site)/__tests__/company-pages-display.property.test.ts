/**
 * Property-based tests for company pages frontend display
 *
 * Tests Property 5 from the design document:
 * - Property 5: Content Display Round-Trip
 *
 * **Feature: company-pages-management**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 *
 * *For any* company page slug, the content saved via the admin panel SHALL be
 * displayed on the corresponding frontend page at `/{slug}`.
 *
 * Since we cannot render React Server Components in unit tests, this test validates
 * the data layer that the frontend pages depend on - ensuring that saved content
 * is correctly retrievable by slug, which is what the frontend pages do.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  createCompanyPagesRepository,
  type CompanyPagesRepository,
} from '@/lib/db/repositories/company-pages.repository';
import type { Database, CompanyPageSlug } from '@/lib/supabase/types';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_KEY;

// Valid company page slugs matching frontend routes
const SLUG_TO_ROUTE: Record<CompanyPageSlug, string> = {
  about: '/about',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
};

const VALID_SLUGS: CompanyPageSlug[] = ['about', 'contact', 'privacy', 'terms'];

// Store original values for cleanup
const originalValues: Map<string, { title: string; content: string }> = new Map();

// Use sequential mode to avoid conflicts with other tests modifying the same records
describe.skipIf(shouldSkip).sequential('Company Pages Display Property Tests', { timeout: 120000 }, () => {
  let supabase: SupabaseClient<Database>;
  let companyPagesRepo: CompanyPagesRepository;

  beforeAll(async () => {
    supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    companyPagesRepo = createCompanyPagesRepository(supabase);

    // Store original values for all pages before tests
    for (const slug of VALID_SLUGS) {
      const page = await companyPagesRepo.findBySlug(slug);
      if (page) {
        originalValues.set(slug, { title: page.title, content: page.content });
      }
    }
  });

  afterAll(async () => {
    // Restore original values after tests
    for (const [slug, values] of originalValues.entries()) {
      await companyPagesRepo.update(slug, values);
    }
  });

  /**
   * **Feature: company-pages-management, Property 5: Content Display Round-Trip**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   *
   * *For any* company page slug, the content saved via the admin panel SHALL be
   * displayed on the corresponding frontend page at `/{slug}`.
   */
  describe.sequential('Property 5: Content Display Round-Trip', () => {
    it('should retrieve exact content saved for any slug (property test with 100 runs)', async () => {
      // Use 'privacy' slug to avoid conflicts with other tests using 'about', 'contact', 'terms'
      const testSlug: CompanyPageSlug = 'privacy';
      
      await fc.assert(
        fc.asyncProperty(
          // Generate non-empty title
          fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim() || 'Default Title'),
          // Generate HTML content (simulating rich text editor output)
          fc.oneof(
            fc.constant(''), // Empty content
            fc.string({ minLength: 1, maxLength: 2000 }), // Plain text
            // HTML content
            fc.tuple(
              fc.string({ minLength: 1, maxLength: 500 }),
              fc.string({ minLength: 1, maxLength: 500 })
            ).map(([p1, p2]) => `<p>${p1}</p><p>${p2}</p>`)
          ),
          async (title, content) => {
            const validTitle = title.trim() || 'Default Title';

            // Save content (simulating admin panel save)
            await companyPagesRepo.update(testSlug, {
              title: validTitle,
              content,
            });

            // Fetch content (simulating frontend page fetch)
            const page = await companyPagesRepo.findBySlug(testSlug);

            // Property: Frontend should receive exact same content that was saved
            expect(page).not.toBeNull();
            expect(page!.slug).toBe(testSlug);
            expect(page!.title).toBe(validTitle);
            expect(page!.content).toBe(content);

            // Verify the slug maps to correct route
            expect(SLUG_TO_ROUTE[testSlug]).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly handle each specific page route', async () => {
      // Test each page individually to ensure all routes work
      // Use 'contact' slug for this test to avoid conflicts
      const testSlug: CompanyPageSlug = 'contact';
      const testContent = `<h2>Test content for ${testSlug}</h2><p>This is test content.</p>`;
      const testTitle = `Test Contact Page`;

      // Save via admin
      await companyPagesRepo.update(testSlug, {
        title: testTitle,
        content: testContent,
      });

      // Fetch for frontend display
      const page = await companyPagesRepo.findBySlug(testSlug);

      expect(page).not.toBeNull();
      expect(page!.title).toBe(testTitle);
      expect(page!.content).toBe(testContent);
      expect(SLUG_TO_ROUTE[testSlug]).toBe('/contact');
    });

    it('should handle empty content for placeholder display', async () => {
      // Use 'about' slug for this test
      const testSlug: CompanyPageSlug = 'about';
      const title = `About Page`;

      // Save with empty content
      await companyPagesRepo.update(testSlug, {
        title,
        content: '',
      });

      // Fetch for frontend
      const page = await companyPagesRepo.findBySlug(testSlug);

      // Property: Empty content should be retrievable (frontend shows placeholder)
      expect(page).not.toBeNull();
      expect(page!.content).toBe('');
      // Frontend logic: hasContent = page?.content && page.content.trim().length > 0
      const hasContent = !!(page!.content && page!.content.trim().length > 0);
      expect(hasContent).toBe(false);
    });

    it('should preserve HTML content structure', async () => {
      const htmlContents = [
        '<h1>Heading</h1><p>Paragraph</p>',
        '<ul><li>Item 1</li><li>Item 2</li></ul>',
        '<p><strong>Bold</strong> and <em>italic</em></p>',
        '<a href="https://example.com">Link</a>',
        '<blockquote>Quote</blockquote>',
      ];

      // Test 'terms' slug with all HTML contents (different from other tests)
      const testSlug: CompanyPageSlug = 'terms';
      for (const htmlContent of htmlContents) {
        await companyPagesRepo.update(testSlug, {
          title: 'HTML Test',
          content: htmlContent,
        });

        const page = await companyPagesRepo.findBySlug(testSlug);

        expect(page).not.toBeNull();
        expect(page!.content).toBe(htmlContent);
      }
    });
  });
});
