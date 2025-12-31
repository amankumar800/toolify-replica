/**
 * Property-based tests for news publication filtering
 *
 * **Feature: database-schema-redesign, Property 11: News Publication Filtering**
 * **Validates: Requirements 10.9, 11.3**
 *
 * *For any* public query to ai_news, only records where is_published = true SHALL be visible.
 *
 * To run these tests, you need to set SUPABASE_SERVICE_ROLE_KEY in your environment.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_KEY;

describe.skipIf(shouldSkip)('News Publication Filtering Property Tests', { timeout: 120000 }, () => {
  let adminSupabase: SupabaseClient;
  let anonSupabase: SupabaseClient;
  const testNewsIds: string[] = [];

  beforeAll(() => {
    // Admin client for creating test data
    adminSupabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Anonymous client for testing public access (RLS)
    if (SUPABASE_ANON_KEY) {
      anonSupabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    } else {
      // Fallback to admin client if anon key not available
      anonSupabase = adminSupabase;
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testNewsIds.length > 0) {
      await adminSupabase.from('ai_news').delete().in('id', testNewsIds);
    }
  });

  /**
   * Helper to generate a unique slug
   */
  function generateSlug(): string {
    return `test-news-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  /**
   * **Feature: database-schema-redesign, Property 11: News Publication Filtering**
   * **Validates: Requirements 10.9, 11.3**
   *
   * *For any* public query to ai_news, only records where is_published = true SHALL be visible.
   */
  describe('Property 11: News Publication Filtering', () => {
    it('should return published news articles', async () => {
      const slug = generateSlug();

      // Create a published news article
      const { data: insertData, error: insertError } = await adminSupabase
        .from('ai_news')
        .insert({
          title: 'Published Test Article',
          slug,
          summary: 'This is a published test article',
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      expect(insertError).toBeNull();
      if (insertData) {
        testNewsIds.push(insertData.id);

        // Query with anonymous client - should find the article
        const { data: queryData, error: queryError } = await anonSupabase
          .from('ai_news')
          .select('id, title, is_published')
          .eq('id', insertData.id);

        expect(queryError).toBeNull();
        expect(queryData).not.toBeNull();
        expect(queryData?.length).toBeGreaterThan(0);
        expect(queryData?.[0]?.is_published).toBe(true);
      }
    });

    it('should NOT return unpublished news articles via public query', async () => {
      const slug = generateSlug();

      // Create an unpublished news article
      const { data: insertData, error: insertError } = await adminSupabase
        .from('ai_news')
        .insert({
          title: 'Unpublished Test Article',
          slug,
          summary: 'This is an unpublished test article',
          is_published: false,
        })
        .select('id')
        .single();

      expect(insertError).toBeNull();
      if (insertData) {
        testNewsIds.push(insertData.id);

        // Query with anonymous client - should NOT find the article due to RLS
        const { data: queryData, error: queryError } = await anonSupabase
          .from('ai_news')
          .select('id, title, is_published')
          .eq('id', insertData.id);

        expect(queryError).toBeNull();
        // RLS should filter out unpublished articles
        expect(queryData?.length ?? 0).toBe(0);
      }
    });

    it('should filter unpublished articles for any generated article', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(), // is_published
          fc.string({ minLength: 5, maxLength: 100 }).filter((s) => /^[a-zA-Z0-9\s]+$/.test(s)),
          async (isPublished, title) => {
            const slug = generateSlug();

            // Create news article with random published status
            const { data: insertData, error: insertError } = await adminSupabase
              .from('ai_news')
              .insert({
                title: title || 'Test Article',
                slug,
                summary: 'Test summary',
                is_published: isPublished,
                published_at: isPublished ? new Date().toISOString() : null,
              })
              .select('id')
              .single();

            expect(insertError).toBeNull();
            if (insertData) {
              testNewsIds.push(insertData.id);

              // Query with anonymous client
              const { data: queryData, error: queryError } = await anonSupabase
                .from('ai_news')
                .select('id')
                .eq('id', insertData.id);

              expect(queryError).toBeNull();

              if (isPublished) {
                // Published articles should be visible
                expect(queryData?.length).toBeGreaterThan(0);
              } else {
                // Unpublished articles should NOT be visible
                expect(queryData?.length ?? 0).toBe(0);
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should order published news by priority_score DESC, published_at DESC (Req 10.9)', async () => {
      // Create multiple published articles with different priority scores
      const articles = [
        { title: 'Low Priority', priority_score: 1, published_at: new Date(Date.now() - 3600000).toISOString() },
        { title: 'High Priority', priority_score: 10, published_at: new Date(Date.now() - 7200000).toISOString() },
        { title: 'Medium Priority', priority_score: 5, published_at: new Date().toISOString() },
      ];

      const insertedIds: string[] = [];

      for (const article of articles) {
        const slug = generateSlug();
        const { data, error } = await adminSupabase
          .from('ai_news')
          .insert({
            ...article,
            slug,
            summary: 'Test summary',
            is_published: true,
          })
          .select('id')
          .single();

        expect(error).toBeNull();
        if (data) {
          insertedIds.push(data.id);
          testNewsIds.push(data.id);
        }
      }

      // Query with ordering by priority_score DESC, published_at DESC
      const { data: orderedData, error: orderError } = await anonSupabase
        .from('ai_news')
        .select('id, title, priority_score, published_at')
        .in('id', insertedIds)
        .order('priority_score', { ascending: false })
        .order('published_at', { ascending: false });

      expect(orderError).toBeNull();
      expect(orderedData).not.toBeNull();
      expect(orderedData?.length).toBe(3);

      // Verify ordering: High Priority (10) should be first
      if (orderedData && orderedData.length === 3) {
        expect(orderedData[0].priority_score).toBe(10);
        expect(orderedData[1].priority_score).toBe(5);
        expect(orderedData[2].priority_score).toBe(1);
      }
    });

    it('should allow admin to see unpublished articles', async () => {
      const slug = generateSlug();

      // Create an unpublished news article
      const { data: insertData, error: insertError } = await adminSupabase
        .from('ai_news')
        .insert({
          title: 'Admin Only Article',
          slug,
          summary: 'This should only be visible to admin',
          is_published: false,
        })
        .select('id')
        .single();

      expect(insertError).toBeNull();
      if (insertData) {
        testNewsIds.push(insertData.id);

        // Query with admin client - should find the article
        const { data: queryData, error: queryError } = await adminSupabase
          .from('ai_news')
          .select('id, title, is_published')
          .eq('id', insertData.id);

        expect(queryError).toBeNull();
        expect(queryData).not.toBeNull();
        expect(queryData?.length).toBeGreaterThan(0);
        expect(queryData?.[0]?.is_published).toBe(false);
      }
    });

    it('should filter by category while respecting publication status', async () => {
      const category = `test-category-${Date.now()}`;

      // Create published article in category
      const slug1 = generateSlug();
      const { data: published, error: error1 } = await adminSupabase
        .from('ai_news')
        .insert({
          title: 'Published in Category',
          slug: slug1,
          summary: 'Published article',
          category,
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      expect(error1).toBeNull();
      if (published) testNewsIds.push(published.id);

      // Create unpublished article in same category
      const slug2 = generateSlug();
      const { data: unpublished, error: error2 } = await adminSupabase
        .from('ai_news')
        .insert({
          title: 'Unpublished in Category',
          slug: slug2,
          summary: 'Unpublished article',
          category,
          is_published: false,
        })
        .select('id')
        .single();

      expect(error2).toBeNull();
      if (unpublished) testNewsIds.push(unpublished.id);

      // Query by category with anonymous client
      const { data: categoryData, error: categoryError } = await anonSupabase
        .from('ai_news')
        .select('id, title, is_published')
        .eq('category', category);

      expect(categoryError).toBeNull();
      expect(categoryData).not.toBeNull();

      // Should only contain published article
      expect(categoryData?.length).toBe(1);
      expect(categoryData?.[0]?.id).toBe(published?.id);
    });

    it('should filter by tags while respecting publication status', async () => {
      const uniqueTag = `testtag${Date.now()}`;

      // Create published article with tag
      const slug1 = generateSlug();
      const { data: published, error: error1 } = await adminSupabase
        .from('ai_news')
        .insert({
          title: 'Published with Tag',
          slug: slug1,
          summary: 'Published article',
          tags: [uniqueTag, 'ai'],
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      expect(error1).toBeNull();
      if (published) testNewsIds.push(published.id);

      // Create unpublished article with same tag
      const slug2 = generateSlug();
      const { data: unpublished, error: error2 } = await adminSupabase
        .from('ai_news')
        .insert({
          title: 'Unpublished with Tag',
          slug: slug2,
          summary: 'Unpublished article',
          tags: [uniqueTag, 'ml'],
          is_published: false,
        })
        .select('id')
        .single();

      expect(error2).toBeNull();
      if (unpublished) testNewsIds.push(unpublished.id);

      // Query by tag with anonymous client
      const { data: tagData, error: tagError } = await anonSupabase
        .from('ai_news')
        .select('id, title, is_published')
        .contains('tags', [uniqueTag]);

      expect(tagError).toBeNull();
      expect(tagData).not.toBeNull();

      // Should only contain published article
      expect(tagData?.length).toBe(1);
      expect(tagData?.[0]?.id).toBe(published?.id);
    });

    it('should handle publishing and unpublishing transitions', async () => {
      const slug = generateSlug();

      // Create unpublished article
      const { data: insertData, error: insertError } = await adminSupabase
        .from('ai_news')
        .insert({
          title: 'Transition Test Article',
          slug,
          summary: 'Testing publish/unpublish',
          is_published: false,
        })
        .select('id')
        .single();

      expect(insertError).toBeNull();
      if (insertData) {
        testNewsIds.push(insertData.id);

        // Initially not visible to public
        const { data: initialQuery } = await anonSupabase
          .from('ai_news')
          .select('id')
          .eq('id', insertData.id);

        expect(initialQuery?.length ?? 0).toBe(0);

        // Publish the article
        const { error: publishError } = await adminSupabase
          .from('ai_news')
          .update({
            is_published: true,
            published_at: new Date().toISOString(),
          })
          .eq('id', insertData.id);

        expect(publishError).toBeNull();

        // Now visible to public
        const { data: publishedQuery } = await anonSupabase
          .from('ai_news')
          .select('id')
          .eq('id', insertData.id);

        expect(publishedQuery?.length).toBeGreaterThan(0);

        // Unpublish the article
        const { error: unpublishError } = await adminSupabase
          .from('ai_news')
          .update({ is_published: false })
          .eq('id', insertData.id);

        expect(unpublishError).toBeNull();

        // No longer visible to public
        const { data: unpublishedQuery } = await anonSupabase
          .from('ai_news')
          .select('id')
          .eq('id', insertData.id);

        expect(unpublishedQuery?.length ?? 0).toBe(0);
      }
    });
  });
});
