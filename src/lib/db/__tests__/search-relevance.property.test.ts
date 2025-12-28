/**
 * Property-based tests for search relevance ordering
 *
 * **Feature: database-schema-redesign, Property 9: Search Relevance Ordering**
 * **Validates: Requirements 13.4**
 *
 * *For any* full-text search query, results SHALL be ordered by relevance score using ts_rank().
 *
 * To run these tests, you need to set SUPABASE_SERVICE_ROLE_KEY in your environment.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_KEY;

describe.skipIf(shouldSkip)('Search Relevance Ordering Property Tests', { timeout: 120000 }, () => {
  let supabase: SupabaseClient;
  const testToolIds: string[] = [];

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testToolIds.length > 0) {
      await supabase.from('tools').delete().in('id', testToolIds);
    }
  });

  /**
   * Helper to generate a unique slug
   */
  function generateSlug(): string {
    return `test-tool-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  /**
   * **Feature: database-schema-redesign, Property 9: Search Relevance Ordering**
   * **Validates: Requirements 13.4**
   *
   * *For any* full-text search query, results SHALL be ordered by relevance score.
   */
  describe('Property 9: Search Relevance Ordering', () => {
    it('should return results when searching with textSearch', async () => {
      // Create a tool with a unique searchable term
      const uniqueTerm = `searchtest${Date.now()}`;
      const slug = generateSlug();

      const { data: insertData, error: insertError } = await supabase
        .from('tools')
        .insert({
          name: `Tool ${uniqueTerm}`,
          slug,
          website_url: 'https://example.com',
          status: 'published',
        })
        .select('id')
        .single();

      expect(insertError).toBeNull();
      if (insertData) {
        testToolIds.push(insertData.id);

        // Search for the term
        const { data: searchData, error: searchError } = await supabase
          .from('tools')
          .select('id, name')
          .textSearch('search_vector', uniqueTerm);

        expect(searchError).toBeNull();
        expect(searchData).not.toBeNull();
        expect(searchData?.length).toBeGreaterThan(0);
      }
    });

    it('should rank tools with term in name higher than tools with term only in description', async () => {
      // Create a unique search term
      const uniqueTerm = `relevancetest${Date.now()}`;

      // Create tool with term in name (should rank higher - weight A)
      const slug1 = generateSlug();
      const { data: tool1, error: error1 } = await supabase
        .from('tools')
        .insert({
          name: `${uniqueTerm} Primary Tool`,
          slug: slug1,
          website_url: 'https://example.com',
          description: 'A generic description without the search term',
          status: 'published',
        })
        .select('id')
        .single();

      expect(error1).toBeNull();
      if (tool1) testToolIds.push(tool1.id);

      // Create tool with term only in description (should rank lower - weight C)
      const slug2 = generateSlug();
      const { data: tool2, error: error2 } = await supabase
        .from('tools')
        .insert({
          name: 'Secondary Tool',
          slug: slug2,
          website_url: 'https://example.com',
          description: `This tool is about ${uniqueTerm} technology`,
          status: 'published',
        })
        .select('id')
        .single();

      expect(error2).toBeNull();
      if (tool2) testToolIds.push(tool2.id);

      // Search for the term - tool with term in name should appear first
      // Note: Supabase textSearch returns results ordered by relevance by default
      const { data: searchData, error: searchError } = await supabase
        .from('tools')
        .select('id, name')
        .textSearch('search_vector', uniqueTerm);

      expect(searchError).toBeNull();
      expect(searchData).not.toBeNull();
      expect(searchData?.length).toBeGreaterThanOrEqual(2);

      // The tool with term in name should appear before tool with term only in description
      if (searchData && searchData.length >= 2 && tool1 && tool2) {
        const tool1Index = searchData.findIndex((t) => t.id === tool1.id);
        const tool2Index = searchData.findIndex((t) => t.id === tool2.id);

        // Tool1 (term in name) should have lower index (appear first)
        expect(tool1Index).toBeLessThan(tool2Index);
      }
    });

    it('should rank tools with term in short_description higher than tools with term only in description', async () => {
      // Create a unique search term
      const uniqueTerm = `shortdesctest${Date.now()}`;

      // Create tool with term in short_description (weight B)
      const slug1 = generateSlug();
      const { data: tool1, error: error1 } = await supabase
        .from('tools')
        .insert({
          name: 'Tool With Short Desc',
          slug: slug1,
          website_url: 'https://example.com',
          short_description: `A ${uniqueTerm} powered solution`,
          description: 'Generic long description',
          status: 'published',
        })
        .select('id')
        .single();

      expect(error1).toBeNull();
      if (tool1) testToolIds.push(tool1.id);

      // Create tool with term only in description (weight C)
      const slug2 = generateSlug();
      const { data: tool2, error: error2 } = await supabase
        .from('tools')
        .insert({
          name: 'Tool With Long Desc',
          slug: slug2,
          website_url: 'https://example.com',
          short_description: 'Generic short description',
          description: `This is a detailed description about ${uniqueTerm} features`,
          status: 'published',
        })
        .select('id')
        .single();

      expect(error2).toBeNull();
      if (tool2) testToolIds.push(tool2.id);

      // Search for the term
      const { data: searchData, error: searchError } = await supabase
        .from('tools')
        .select('id, name')
        .textSearch('search_vector', uniqueTerm);

      expect(searchError).toBeNull();
      expect(searchData).not.toBeNull();
      expect(searchData?.length).toBeGreaterThanOrEqual(2);

      // Tool with term in short_description should rank higher
      if (searchData && searchData.length >= 2 && tool1 && tool2) {
        const tool1Index = searchData.findIndex((t) => t.id === tool1.id);
        const tool2Index = searchData.findIndex((t) => t.id === tool2.id);

        expect(tool1Index).toBeLessThan(tool2Index);
      }
    });

    it('should return consistent ordering for the same search query', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 5 }), async (runNumber) => {
          // Use a common term that might exist in multiple tools
          const searchTerm = 'ai';

          // Run the same search multiple times
          const results: string[][] = [];

          for (let i = 0; i < 3; i++) {
            const { data, error } = await supabase
              .from('tools')
              .select('id')
              .textSearch('search_vector', searchTerm)
              .limit(10);

            expect(error).toBeNull();
            if (data) {
              results.push(data.map((t) => t.id));
            }
          }

          // All results should have the same ordering
          if (results.length >= 2) {
            for (let i = 1; i < results.length; i++) {
              expect(results[i]).toEqual(results[0]);
            }
          }
        }),
        { numRuns: 3 }
      );
    });

    it('should handle multi-word search queries', async () => {
      const uniqueTerm1 = `multiword${Date.now()}`;
      const uniqueTerm2 = `searchquery${Date.now() + 1}`;
      const slug = generateSlug();

      const { data: insertData, error: insertError } = await supabase
        .from('tools')
        .insert({
          name: `${uniqueTerm1} ${uniqueTerm2} Tool`,
          slug,
          website_url: 'https://example.com',
          status: 'published',
        })
        .select('id')
        .single();

      expect(insertError).toBeNull();
      if (insertData) {
        testToolIds.push(insertData.id);

        // Search with both terms (websearch type handles multi-word queries)
        const { data: searchData, error: searchError } = await supabase
          .from('tools')
          .select('id')
          .textSearch('search_vector', `${uniqueTerm1} ${uniqueTerm2}`, { type: 'websearch' });

        expect(searchError).toBeNull();
        expect(searchData).not.toBeNull();
        expect(searchData?.some((t) => t.id === insertData.id)).toBe(true);
      }
    });

    it('should filter by status while maintaining relevance ordering', async () => {
      const uniqueTerm = `statusfilter${Date.now()}`;

      // Create published tool
      const slug1 = generateSlug();
      const { data: publishedTool, error: error1 } = await supabase
        .from('tools')
        .insert({
          name: `${uniqueTerm} Published`,
          slug: slug1,
          website_url: 'https://example.com',
          status: 'published',
        })
        .select('id')
        .single();

      expect(error1).toBeNull();
      if (publishedTool) testToolIds.push(publishedTool.id);

      // Create pending tool
      const slug2 = generateSlug();
      const { data: pendingTool, error: error2 } = await supabase
        .from('tools')
        .insert({
          name: `${uniqueTerm} Pending`,
          slug: slug2,
          website_url: 'https://example.com',
          status: 'pending',
        })
        .select('id')
        .single();

      expect(error2).toBeNull();
      if (pendingTool) testToolIds.push(pendingTool.id);

      // Search with status filter - should only return published
      const { data: searchData, error: searchError } = await supabase
        .from('tools')
        .select('id, status')
        .textSearch('search_vector', uniqueTerm)
        .eq('status', 'published');

      expect(searchError).toBeNull();
      expect(searchData).not.toBeNull();

      // Should contain published tool
      expect(searchData?.some((t) => t.id === publishedTool?.id)).toBe(true);
      // Should not contain pending tool
      expect(searchData?.some((t) => t.id === pendingTool?.id)).toBe(false);
    });
  });
});
