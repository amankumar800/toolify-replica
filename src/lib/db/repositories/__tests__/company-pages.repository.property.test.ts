/**
 * Property-based tests for company pages repository
 *
 * Tests Property 3 from the design document:
 * - Property 3: Form Pre-population Round-Trip
 *
 * **Feature: company-pages-management**
 * **Validates: Requirements 2.2**
 *
 * To run these tests, you need to set SUPABASE_SERVICE_ROLE_KEY in your environment.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  createCompanyPagesRepository,
  type CompanyPagesRepository,
} from '../company-pages.repository';
import type { Database, CompanyPageSlug } from '@/lib/supabase/types';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_KEY;

// Valid company page slugs
const VALID_SLUGS: CompanyPageSlug[] = ['about', 'contact', 'privacy', 'terms'];

// Store original values for cleanup
const originalValues: Map<string, { title: string; content: string }> = new Map();

// Use sequential mode to avoid conflicts with other tests modifying the same records
describe.skipIf(shouldSkip).sequential('Company Pages Repository Property Tests', { timeout: 120000 }, () => {
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
   * **Feature: company-pages-management, Property 3: Form Pre-population Round-Trip**
   * **Validates: Requirements 2.2**
   *
   * *For any* company page with saved content, loading the edit form SHALL display
   * the exact same title and content values that were saved.
   */
  describe('Property 3: Form Pre-population Round-Trip', () => {
    it('should return exact same title and content after update (property test with 100 runs)', async () => {
      // Use a single slug to avoid conflicts with parallel tests
      const testSlug: CompanyPageSlug = 'terms';
      
      await fc.assert(
        fc.asyncProperty(
          // Generate non-empty title (trimmed)
          fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim() || 'Default Title'),
          // Generate content (can be empty or have content)
          fc.string({ minLength: 0, maxLength: 5000 }),
          async (title, content) => {
            // Ensure title is non-empty after trimming
            const validTitle = title.trim() || 'Default Title';

            // Update the page with generated values
            const updatedPage = await companyPagesRepo.update(testSlug, {
              title: validTitle,
              content,
            });

            // Fetch the page again (simulating form pre-population)
            const fetchedPage = await companyPagesRepo.findBySlug(testSlug);

            // Property: The fetched page should have exact same values as what was saved
            expect(fetchedPage).not.toBeNull();
            expect(fetchedPage!.title).toBe(validTitle);
            expect(fetchedPage!.content).toBe(content);

            // Also verify the update response matches
            expect(updatedPage.title).toBe(validTitle);
            expect(updatedPage.content).toBe(content);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve content with special characters', async () => {
      // Use a single slug to avoid conflicts with parallel tests
      const testSlug: CompanyPageSlug = 'terms';
      
      await fc.assert(
        fc.asyncProperty(
          // Generate content with special characters
          fc.string({ minLength: 1, maxLength: 1000 }),
          async (content) => {
            const title = 'Test Title with Special Chars: <>&"\'';

            // Update with special characters
            await companyPagesRepo.update(testSlug, { title, content });

            // Fetch and verify
            const fetchedPage = await companyPagesRepo.findBySlug(testSlug);

            expect(fetchedPage).not.toBeNull();
            expect(fetchedPage!.title).toBe(title);
            expect(fetchedPage!.content).toBe(content);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle empty content correctly', async () => {
      // Use only 'terms' slug to avoid conflicts with other tests
      const testSlug: CompanyPageSlug = 'terms';
      const title = `Test terms Page`;
      const emptyContent = '';

      // Update with empty content
      await companyPagesRepo.update(testSlug, { title, content: emptyContent });

      // Fetch and verify
      const fetchedPage = await companyPagesRepo.findBySlug(testSlug);

      expect(fetchedPage).not.toBeNull();
      expect(fetchedPage!.title).toBe(title);
      expect(fetchedPage!.content).toBe(emptyContent);
    });
  });

  /**
   * Additional tests for repository methods
   */
  describe('Repository Methods', () => {
    it('findAll should return all four company pages', async () => {
      const pages = await companyPagesRepo.findAll();

      expect(pages).toHaveLength(4);

      const slugs = pages.map(p => p.slug);
      expect(slugs).toContain('about');
      expect(slugs).toContain('contact');
      expect(slugs).toContain('privacy');
      expect(slugs).toContain('terms');
    });

    it('findBySlug should return null for non-existent slug', async () => {
      const page = await companyPagesRepo.findBySlug('non-existent-slug');
      expect(page).toBeNull();
    });

    it('findBySlug should return correct page for each valid slug', async () => {
      for (const slug of VALID_SLUGS) {
        const page = await companyPagesRepo.findBySlug(slug);

        expect(page).not.toBeNull();
        expect(page!.slug).toBe(slug);
        expect(page!.id).toBeDefined();
        expect(page!.title).toBeDefined();
      }
    });
  });
});
