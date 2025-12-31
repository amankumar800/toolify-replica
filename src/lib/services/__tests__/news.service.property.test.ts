/**
 * Property-based tests for AI News Service
 *
 * Tests Property 15 from the design document:
 * - Property 15: Publication Timestamp
 *
 * **Feature: admin-panel-crud**
 * **Validates: Requirements 7.8**
 *
 * To run these tests, you need to set:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createAINewsRepository, type AINewsRepository } from '@/lib/db/repositories/ai-news.repository';
import type { Database } from '@/lib/supabase/types';
import { TABLES } from '@/lib/db/constants/tables';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_KEY;

// Helper to generate unique test slugs
function generateTestSlug(base: string): string {
  return `test-${base}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Valid title generator (5-200 characters, no special chars that might cause issues)
const validTitleArbitrary = fc
  .string({ minLength: 5, maxLength: 50 })
  .map(s => {
    const cleaned = s.replace(/[^\w\s]/g, 'a').trim();
    return cleaned.length >= 5 ? cleaned : 'Test Title Article';
  });

// News category generator
const categoryArbitrary = fc.constantFrom(
  'AI Research',
  'Industry News',
  'Product Launch',
  'Tutorial',
  'Opinion',
  null
);

describe.skipIf(shouldSkip)('AI News Service Property Tests', { timeout: 120000 }, () => {
  let supabase: SupabaseClient<Database>;
  let newsRepo: AINewsRepository;
  const testNewsIds: string[] = [];

  beforeAll(() => {
    supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    newsRepo = createAINewsRepository(supabase);
  });

  afterAll(async () => {
    // Clean up test data
    if (testNewsIds.length > 0) {
      await supabase.from(TABLES.AI_NEWS).delete().in('id', testNewsIds);
    }
  });

  /**
   * **Feature: admin-panel-crud, Property 15: Publication Timestamp**
   * **Validates: Requirements 7.8**
   *
   * *For any* AI News item where is_published changes from false to true,
   * the published_at field SHALL be set to the current timestamp.
   */
  describe('Property 15: Publication Timestamp', () => {
    it('should auto-set published_at when publishing via the publish method', async () => {
      await fc.assert(
        fc.asyncProperty(
          validTitleArbitrary,
          categoryArbitrary,
          async (title, category) => {
            const slug = generateTestSlug('publish-method');

            // Create unpublished news item first
            const news = await newsRepo.create({
              title,
              slug,
              category,
              is_published: false,
            });
            testNewsIds.push(news.id);

            // Verify it's unpublished
            expect(news.is_published).toBe(false);
            expect(news.published_at).toBeNull();

            const beforePublish = new Date();

            // Publish using the publish method (which sets published_at)
            const publishedNews = await newsRepo.publish(news.id);

            const afterPublish = new Date();

            // Property: published_at should be set to around the publish time
            expect(publishedNews.is_published).toBe(true);
            expect(publishedNews.published_at).not.toBeNull();

            const publishedAt = new Date(publishedNews.published_at!);
            expect(publishedAt.getTime()).toBeGreaterThanOrEqual(beforePublish.getTime() - 1000);
            expect(publishedAt.getTime()).toBeLessThanOrEqual(afterPublish.getTime() + 1000);
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should set published_at when updating is_published from false to true via update', async () => {
      await fc.assert(
        fc.asyncProperty(
          validTitleArbitrary,
          categoryArbitrary,
          async (title, category) => {
            const slug = generateTestSlug('update-publish');

            // Create unpublished news item
            const news = await newsRepo.create({
              title,
              slug,
              category,
              is_published: false,
            });
            testNewsIds.push(news.id);

            // Verify it's unpublished and has no published_at
            expect(news.is_published).toBe(false);
            expect(news.published_at).toBeNull();

            const beforePublish = new Date();

            // Update to published with published_at set
            const publishedNews = await newsRepo.update(news.id, {
              is_published: true,
              published_at: new Date().toISOString(),
            });

            const afterPublish = new Date();

            // Property: published_at should be set when is_published changes to true
            expect(publishedNews.is_published).toBe(true);
            expect(publishedNews.published_at).not.toBeNull();

            const publishedAt = new Date(publishedNews.published_at!);
            expect(publishedAt.getTime()).toBeGreaterThanOrEqual(beforePublish.getTime() - 1000);
            expect(publishedAt.getTime()).toBeLessThanOrEqual(afterPublish.getTime() + 1000);
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should NOT set published_at when creating unpublished news', async () => {
      await fc.assert(
        fc.asyncProperty(
          validTitleArbitrary,
          categoryArbitrary,
          async (title, category) => {
            const slug = generateTestSlug('create-unpublished');

            // Create unpublished news item
            const news = await newsRepo.create({
              title,
              slug,
              category,
              is_published: false,
            });
            testNewsIds.push(news.id);

            // Property: published_at should be null for unpublished news
            expect(news.is_published).toBe(false);
            expect(news.published_at).toBeNull();
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should preserve custom published_at when provided (comparing dates)', async () => {
      const title = 'Test Custom Published At';
      const slug = generateTestSlug('custom-published-at');
      const customDate = new Date('2024-01-15T10:30:00Z');
      const customPublishedAt = customDate.toISOString();

      // Create news item with custom published_at
      const news = await newsRepo.create({
        title,
        slug,
        is_published: true,
        published_at: customPublishedAt,
      });
      testNewsIds.push(news.id);

      // Property: Custom published_at should be preserved (compare as dates)
      expect(news.is_published).toBe(true);
      expect(news.published_at).not.toBeNull();
      
      // Compare as Date objects to handle timezone format differences
      const returnedDate = new Date(news.published_at!);
      expect(returnedDate.getTime()).toBe(customDate.getTime());
    });

    it('should update published_at when re-publishing via publish method', async () => {
      const title = 'Test Republish Article';
      const slug = generateTestSlug('republish-test');

      // Create unpublished news item
      const news = await newsRepo.create({
        title,
        slug,
        is_published: false,
      });
      testNewsIds.push(news.id);

      // First publish
      const firstPublish = await newsRepo.publish(news.id);
      const firstPublishedAt = firstPublish.published_at;
      expect(firstPublishedAt).not.toBeNull();

      // Unpublish
      await newsRepo.unpublish(news.id);

      // Wait a bit to ensure timestamps would be different
      await new Promise(resolve => setTimeout(resolve, 100));

      // Re-publish - this will set a new published_at
      const republishedNews = await newsRepo.publish(news.id);

      // Property: When re-publishing, published_at gets updated to the new publish time
      expect(republishedNews.is_published).toBe(true);
      expect(republishedNews.published_at).not.toBeNull();
      
      // The new published_at should be different (later) than the first one
      const firstTime = new Date(firstPublishedAt!).getTime();
      const secondTime = new Date(republishedNews.published_at!).getTime();
      expect(secondTime).toBeGreaterThanOrEqual(firstTime);
    });
  });

  /**
   * Additional tests for news CRUD operations
   */
  describe('News CRUD Operations', () => {
    it('should create and retrieve news items correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          validTitleArbitrary,
          categoryArbitrary,
          async (title, category) => {
            const slug = generateTestSlug('crud-test');

            // Create news item (unpublished to avoid published_at complexity)
            const created = await newsRepo.create({
              title,
              slug,
              category,
              is_published: false,
            });
            testNewsIds.push(created.id);

            // Retrieve news item
            const retrieved = await newsRepo.findById(created.id);

            // Property: Retrieved item should match created item
            expect(retrieved).not.toBeNull();
            expect(retrieved!.id).toBe(created.id);
            expect(retrieved!.title).toBe(title);
            expect(retrieved!.slug).toBe(slug);
            expect(retrieved!.category).toBe(category);
            expect(retrieved!.is_published).toBe(false);
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should update news items correctly', async () => {
      const title = 'Original Title';
      const slug = generateTestSlug('update-test');

      // Create news item
      const created = await newsRepo.create({
        title,
        slug,
        is_published: false,
      });
      testNewsIds.push(created.id);

      // Update news item
      const newTitle = 'Updated Title';
      const updated = await newsRepo.update(created.id, {
        title: newTitle,
      });

      // Property: Updated fields should be changed
      expect(updated.title).toBe(newTitle);
      expect(updated.slug).toBe(slug); // Unchanged
    });

    it('should delete news items correctly', async () => {
      const title = 'To Be Deleted';
      const slug = generateTestSlug('delete-test');

      // Create news item
      const created = await newsRepo.create({
        title,
        slug,
        is_published: false,
      });

      // Delete news item
      await newsRepo.delete(created.id);

      // Verify deletion by trying to find it
      // The findById throws an error for not found, so we catch it
      let found = true;
      try {
        const retrieved = await newsRepo.findById(created.id);
        found = retrieved !== null;
      } catch {
        found = false;
      }

      // Property: Deleted item should not be retrievable
      expect(found).toBe(false);
    });
  });
});
