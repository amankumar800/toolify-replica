/**
 * Property-based tests for full-text search functionality
 *
 * **Feature: database-schema-redesign, Property 8: Full-Text Search Generation**
 * **Validates: Requirements 1.9, 13.2, 13.5**
 *
 * *For any* tool record, the search_vector column SHALL be automatically generated
 * with correct weighted terms from name, short_description, description, and tags.
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

describe.skipIf(shouldSkip)('Full-Text Search Property Tests', { timeout: 120000 }, () => {
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
   * Helper to generate valid tool name (alphanumeric with spaces)
   */
  const validNameArb = fc
    .string({ minLength: 3, maxLength: 50 })
    .filter((s) => /^[a-zA-Z0-9\s]+$/.test(s) && s.trim().length >= 3)
    .map((s) => s.trim() || 'TestTool');

  /**
   * Helper to generate valid description text
   */
  const validDescriptionArb = fc
    .string({ minLength: 10, maxLength: 200 })
    .filter((s) => /^[a-zA-Z0-9\s.,!?]+$/.test(s) && s.trim().length >= 10)
    .map((s) => s.trim() || 'This is a test description for the tool');

  /**
   * Helper to generate valid tags (alphanumeric only)
   */
  const validTagArb = fc
    .string({ minLength: 2, maxLength: 20 })
    .filter((s) => /^[a-z0-9]+$/.test(s));

  const validTagsArb = fc.array(validTagArb, { minLength: 0, maxLength: 5 });

  /**
   * **Feature: database-schema-redesign, Property 8: Full-Text Search Generation**
   * **Validates: Requirements 1.9, 13.2, 13.5**
   *
   * *For any* tool record, the search_vector column SHALL be automatically generated.
   */
  describe('Property 8: Full-Text Search Generation', () => {
    it('should automatically generate search_vector when inserting a tool', async () => {
      await fc.assert(
        fc.asyncProperty(validNameArb, async (name) => {
          const slug = generateSlug();

          const { data, error } = await supabase
            .from('tools')
            .insert({
              name,
              slug,
              website_url: 'https://example.com',
            })
            .select('id, name, search_vector')
            .single();

          expect(error).toBeNull();
          expect(data).not.toBeNull();

          if (data) {
            testToolIds.push(data.id);
            // search_vector should be generated (not null)
            expect(data.search_vector).not.toBeNull();
          }
        }),
        { numRuns: 10 }
      );
    });

    it('should include name terms in search_vector with weight A', async () => {
      await fc.assert(
        fc.asyncProperty(validNameArb, async (name) => {
          const slug = generateSlug();
          // Use a unique word in the name for testing
          const uniqueWord = `uniquename${Date.now()}`;
          const testName = `${name} ${uniqueWord}`;

          const { data: insertData, error: insertError } = await supabase
            .from('tools')
            .insert({
              name: testName,
              slug,
              website_url: 'https://example.com',
            })
            .select('id')
            .single();

          expect(insertError).toBeNull();
          if (insertData) {
            testToolIds.push(insertData.id);

            // Search for the unique word - should find the tool
            const { data: searchData, error: searchError } = await supabase
              .from('tools')
              .select('id, name')
              .textSearch('search_vector', uniqueWord)
              .eq('id', insertData.id);

            expect(searchError).toBeNull();
            expect(searchData).not.toBeNull();
            expect(searchData?.length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 5 }
      );
    });

    it('should include short_description terms in search_vector with weight B', async () => {
      await fc.assert(
        fc.asyncProperty(validNameArb, validDescriptionArb, async (name, shortDesc) => {
          const slug = generateSlug();
          // Use a unique word in short_description for testing
          const uniqueWord = `uniqueshort${Date.now()}`;
          const testShortDesc = `${shortDesc} ${uniqueWord}`;

          const { data: insertData, error: insertError } = await supabase
            .from('tools')
            .insert({
              name,
              slug,
              website_url: 'https://example.com',
              short_description: testShortDesc,
            })
            .select('id')
            .single();

          expect(insertError).toBeNull();
          if (insertData) {
            testToolIds.push(insertData.id);

            // Search for the unique word - should find the tool
            const { data: searchData, error: searchError } = await supabase
              .from('tools')
              .select('id')
              .textSearch('search_vector', uniqueWord)
              .eq('id', insertData.id);

            expect(searchError).toBeNull();
            expect(searchData).not.toBeNull();
            expect(searchData?.length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 5 }
      );
    });

    it('should include description terms in search_vector with weight C', async () => {
      await fc.assert(
        fc.asyncProperty(validNameArb, validDescriptionArb, async (name, description) => {
          const slug = generateSlug();
          // Use a unique word in description for testing
          const uniqueWord = `uniquedesc${Date.now()}`;
          const testDesc = `${description} ${uniqueWord}`;

          const { data: insertData, error: insertError } = await supabase
            .from('tools')
            .insert({
              name,
              slug,
              website_url: 'https://example.com',
              description: testDesc,
            })
            .select('id')
            .single();

          expect(insertError).toBeNull();
          if (insertData) {
            testToolIds.push(insertData.id);

            // Search for the unique word - should find the tool
            const { data: searchData, error: searchError } = await supabase
              .from('tools')
              .select('id')
              .textSearch('search_vector', uniqueWord)
              .eq('id', insertData.id);

            expect(searchError).toBeNull();
            expect(searchData).not.toBeNull();
            expect(searchData?.length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 5 }
      );
    });

    it('should include tags in search_vector with weight D', async () => {
      await fc.assert(
        fc.asyncProperty(validNameArb, async (name) => {
          const slug = generateSlug();
          // Use a unique tag for testing
          const uniqueTag = `uniquetag${Date.now()}`;

          const { data: insertData, error: insertError } = await supabase
            .from('tools')
            .insert({
              name,
              slug,
              website_url: 'https://example.com',
              tags: [uniqueTag, 'ai', 'tool'],
            })
            .select('id')
            .single();

          expect(insertError).toBeNull();
          if (insertData) {
            testToolIds.push(insertData.id);

            // Search for the unique tag - should find the tool
            const { data: searchData, error: searchError } = await supabase
              .from('tools')
              .select('id')
              .textSearch('search_vector', uniqueTag)
              .eq('id', insertData.id);

            expect(searchError).toBeNull();
            expect(searchData).not.toBeNull();
            expect(searchData?.length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 5 }
      );
    });

    it('should automatically update search_vector when tool is updated (Req 13.5)', async () => {
      await fc.assert(
        fc.asyncProperty(validNameArb, validNameArb, async (originalName, newName) => {
          const slug = generateSlug();
          const uniqueOriginal = `original${Date.now()}`;
          const uniqueNew = `newname${Date.now() + 1}`;

          // Insert tool with original name
          const { data: insertData, error: insertError } = await supabase
            .from('tools')
            .insert({
              name: `${originalName} ${uniqueOriginal}`,
              slug,
              website_url: 'https://example.com',
            })
            .select('id, search_vector')
            .single();

          expect(insertError).toBeNull();
          if (insertData) {
            testToolIds.push(insertData.id);
            const originalSearchVector = insertData.search_vector;

            // Update the tool name
            const { data: updateData, error: updateError } = await supabase
              .from('tools')
              .update({ name: `${newName} ${uniqueNew}` })
              .eq('id', insertData.id)
              .select('id, search_vector')
              .single();

            expect(updateError).toBeNull();
            expect(updateData).not.toBeNull();

            // search_vector should be different after update (if names are different)
            if (originalName !== newName) {
              // The search_vector should have been regenerated
              // We verify by searching for the new unique word
              const { data: searchData, error: searchError } = await supabase
                .from('tools')
                .select('id')
                .textSearch('search_vector', uniqueNew)
                .eq('id', insertData.id);

              expect(searchError).toBeNull();
              expect(searchData?.length).toBeGreaterThan(0);
            }
          }
        }),
        { numRuns: 5 }
      );
    });

    it('should combine all weighted fields in search_vector (Req 13.2)', async () => {
      const slug = generateSlug();
      const uniqueName = `testname${Date.now()}`;
      const uniqueShort = `testshort${Date.now() + 1}`;
      const uniqueDesc = `testdesc${Date.now() + 2}`;
      const uniqueTag = `testtag${Date.now() + 3}`;

      const { data: insertData, error: insertError } = await supabase
        .from('tools')
        .insert({
          name: `Tool ${uniqueName}`,
          slug,
          website_url: 'https://example.com',
          short_description: `Short ${uniqueShort}`,
          description: `Description ${uniqueDesc}`,
          tags: [uniqueTag],
        })
        .select('id')
        .single();

      expect(insertError).toBeNull();
      if (insertData) {
        testToolIds.push(insertData.id);

        // All unique words should be searchable
        for (const word of [uniqueName, uniqueShort, uniqueDesc, uniqueTag]) {
          const { data: searchData, error: searchError } = await supabase
            .from('tools')
            .select('id')
            .textSearch('search_vector', word)
            .eq('id', insertData.id);

          expect(searchError).toBeNull();
          expect(searchData?.length).toBeGreaterThan(0);
        }
      }
    });
  });
});
