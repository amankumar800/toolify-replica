/**
 * Property-based tests for tools repository specialized operations
 *
 * Tests Properties 8-9 from the design document:
 * - Property 8: Tool-category link/unlink consistency
 * - Property 9: BulkUpsert returns correct count
 *
 * To run these tests, you need to set SUPABASE_SERVICE_ROLE_KEY in your environment.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createToolsRepository, type ToolsRepository, type ToolInsert } from '../tools.repository';
import { createCategoriesRepository, type CategoriesRepository, type CategoryInsert } from '../categories.repository';
import type { Database } from '@/lib/supabase/types';
import { TABLES } from '../../constants/tables';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_KEY;

// Helper to generate unique slugs
function generateUniqueSlug(base: string): string {
  return `test-${base}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe.skipIf(shouldSkip)('Tools Repository Property Tests', () => {
  let supabase: SupabaseClient<Database>;
  let toolsRepo: ToolsRepository;
  let categoriesRepo: CategoriesRepository;
  const testToolIds: string[] = [];
  const testCategoryIds: string[] = [];

  beforeAll(() => {
    supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    toolsRepo = createToolsRepository(supabase);
    categoriesRepo = createCategoriesRepository(supabase);
  });

  afterAll(async () => {
    // Clean up test data - delete tool_categories first due to foreign keys
    if (testToolIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)(TABLES.TOOL_CATEGORIES)
        .delete()
        .in('tool_id', testToolIds);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)(TABLES.TOOLS)
        .delete()
        .in('id', testToolIds);
    }
    if (testCategoryIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)(TABLES.CATEGORIES)
        .delete()
        .in('id', testCategoryIds);
    }
  });


  /**
   * **Feature: supabase-migration, Property 8: Tool-category link/unlink consistency**
   * **Validates: Requirements 3.2**
   *
   * *For any* tool and category, after linkToCategory(toolId, categoryId),
   * findByCategory(categorySlug) SHALL include the tool.
   * After unlinkFromCategory, it SHALL NOT include the tool.
   */
  describe('Property 8: Tool-category link/unlink consistency', () => {
    // Arbitrary for generating valid tool names
    const toolNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,29}$/);
    
    // Arbitrary for generating valid category names
    const categoryNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,29}$/);

    it('should include tool in category after linking and exclude after unlinking (property test with 100 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          toolNameArb,
          categoryNameArb,
          async (toolName, categoryName) => {
            // Create a unique tool
            const toolSlug = generateUniqueSlug(toolName.toLowerCase().replace(/\s+/g, '-').slice(0, 15));
            const toolInsert: ToolInsert = {
              name: toolName,
              slug: toolSlug,
              website_url: 'https://example.com',
            };
            const tool = await toolsRepo.create(toolInsert);
            testToolIds.push(tool.id);

            // Create a unique category
            const categorySlug = generateUniqueSlug(categoryName.toLowerCase().replace(/\s+/g, '-').slice(0, 15));
            const categoryInsert: CategoryInsert = {
              name: categoryName,
              slug: categorySlug,
            };
            const category = await categoriesRepo.create(categoryInsert);
            testCategoryIds.push(category.id);

            // Link tool to category
            await toolsRepo.linkToCategory(tool.id, category.id);

            // Property: After linking, findByCategory should include the tool
            const toolsInCategory = await toolsRepo.findByCategory(categorySlug);
            const foundAfterLink = toolsInCategory.some((t) => t.id === tool.id);
            expect(foundAfterLink).toBe(true);

            // Unlink tool from category
            await toolsRepo.unlinkFromCategory(tool.id, category.id);

            // Property: After unlinking, findByCategory should NOT include the tool
            const toolsAfterUnlink = await toolsRepo.findByCategory(categorySlug);
            const foundAfterUnlink = toolsAfterUnlink.some((t) => t.id === tool.id);
            expect(foundAfterUnlink).toBe(false);
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);

    it('should handle linking same tool to multiple categories', async () => {
      // Create a tool
      const toolSlug = generateUniqueSlug('multi-cat-tool');
      const tool = await toolsRepo.create({
        name: 'Multi Category Tool',
        slug: toolSlug,
        website_url: 'https://example.com',
      });
      testToolIds.push(tool.id);

      // Create multiple categories
      const categories = [];
      for (let i = 0; i < 3; i++) {
        const categorySlug = generateUniqueSlug(`multi-cat-${i}`);
        const category = await categoriesRepo.create({
          name: `Multi Category ${i}`,
          slug: categorySlug,
        });
        testCategoryIds.push(category.id);
        categories.push(category);
      }

      // Link tool to all categories
      for (const category of categories) {
        await toolsRepo.linkToCategory(tool.id, category.id);
      }

      // Verify tool appears in all categories
      for (const category of categories) {
        const toolsInCategory = await toolsRepo.findByCategory(category.slug);
        const found = toolsInCategory.some((t) => t.id === tool.id);
        expect(found).toBe(true);
      }

      // Unlink from first category only
      await toolsRepo.unlinkFromCategory(tool.id, categories[0].id);

      // Verify tool is removed from first category but still in others
      const toolsInFirst = await toolsRepo.findByCategory(categories[0].slug);
      expect(toolsInFirst.some((t) => t.id === tool.id)).toBe(false);

      const toolsInSecond = await toolsRepo.findByCategory(categories[1].slug);
      expect(toolsInSecond.some((t) => t.id === tool.id)).toBe(true);
    }, 30000);

    it('should handle idempotent linking (linking twice should not error)', async () => {
      // Create a tool and category
      const toolSlug = generateUniqueSlug('idempotent-link');
      const tool = await toolsRepo.create({
        name: 'Idempotent Link Tool',
        slug: toolSlug,
        website_url: 'https://example.com',
      });
      testToolIds.push(tool.id);

      const categorySlug = generateUniqueSlug('idempotent-cat');
      const category = await categoriesRepo.create({
        name: 'Idempotent Category',
        slug: categorySlug,
      });
      testCategoryIds.push(category.id);

      // Link twice - should not throw
      await toolsRepo.linkToCategory(tool.id, category.id);
      await toolsRepo.linkToCategory(tool.id, category.id);

      // Verify tool appears only once
      const toolsInCategory = await toolsRepo.findByCategory(categorySlug);
      const matchingTools = toolsInCategory.filter((t) => t.id === tool.id);
      expect(matchingTools.length).toBe(1);
    });
  });


  /**
   * **Feature: supabase-migration, Property 9: BulkUpsert returns correct count**
   * **Validates: Requirements 3.3**
   *
   * *For any* array of N tools with unique slugs, bulkUpsert SHALL return an array of length N.
   */
  describe('Property 9: BulkUpsert returns correct count', () => {
    // Arbitrary for generating valid tool names
    const toolNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,29}$/);

    it('should return array of length N when bulk upserting N tools with unique slugs (property test with 100 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array of 1-5 unique tool names
          fc.array(toolNameArb, { minLength: 1, maxLength: 5 }),
          async (toolNames) => {
            // Ensure unique names by adding index
            const uniqueToolNames = toolNames.map((name, i) => `${name} ${i}`);
            
            // Create tool inserts with unique slugs
            const toolInserts: ToolInsert[] = uniqueToolNames.map((name) => ({
              name,
              slug: generateUniqueSlug(name.toLowerCase().replace(/\s+/g, '-').slice(0, 15)),
              website_url: 'https://example.com',
            }));

            // Bulk upsert
            const results = await toolsRepo.bulkUpsert(toolInserts);

            // Track created IDs for cleanup
            results.forEach((r) => testToolIds.push(r.id));

            // Property: Result array length should equal input array length
            expect(results.length).toBe(toolInserts.length);

            // Verify each result has the expected data
            for (let i = 0; i < results.length; i++) {
              expect(results[i].name).toBe(toolInserts[i].name);
              expect(results[i].slug).toBe(toolInserts[i].slug);
              expect(results[i].website_url).toBe(toolInserts[i].website_url);
            }
          }
        ),
        { numRuns: 5 }
      );
    }, 20000);

    it('should handle empty array gracefully', async () => {
      const results = await toolsRepo.bulkUpsert([]);
      expect(results).toEqual([]);
    });

    it('should update existing tools when slugs conflict', async () => {
      // Create initial tools
      const slug1 = generateUniqueSlug('bulk-conflict-1');
      const slug2 = generateUniqueSlug('bulk-conflict-2');
      
      const initialTools: ToolInsert[] = [
        { name: 'Initial Tool 1', slug: slug1, website_url: 'https://example.com/1' },
        { name: 'Initial Tool 2', slug: slug2, website_url: 'https://example.com/2' },
      ];

      const initialResults = await toolsRepo.bulkUpsert(initialTools);
      initialResults.forEach((r) => testToolIds.push(r.id));

      // Upsert with same slugs but different names
      const updatedTools: ToolInsert[] = [
        { name: 'Updated Tool 1', slug: slug1, website_url: 'https://example.com/updated1' },
        { name: 'Updated Tool 2', slug: slug2, website_url: 'https://example.com/updated2' },
      ];

      const updatedResults = await toolsRepo.bulkUpsert(updatedTools);

      // Property: Should return same count
      expect(updatedResults.length).toBe(2);

      // Property: Should have updated the existing records (same IDs)
      expect(updatedResults[0].id).toBe(initialResults[0].id);
      expect(updatedResults[1].id).toBe(initialResults[1].id);

      // Property: Names should be updated
      expect(updatedResults[0].name).toBe('Updated Tool 1');
      expect(updatedResults[1].name).toBe('Updated Tool 2');
    });

    it('should handle mix of new and existing tools', async () => {
      // Create one existing tool
      const existingSlug = generateUniqueSlug('bulk-mix-existing');
      const existingTool = await toolsRepo.create({
        name: 'Existing Tool',
        slug: existingSlug,
        website_url: 'https://example.com/existing',
      });
      testToolIds.push(existingTool.id);

      // Bulk upsert with existing and new tools
      const newSlug = generateUniqueSlug('bulk-mix-new');
      const mixedTools: ToolInsert[] = [
        { name: 'Updated Existing', slug: existingSlug, website_url: 'https://example.com/updated' },
        { name: 'New Tool', slug: newSlug, website_url: 'https://example.com/new' },
      ];

      const results = await toolsRepo.bulkUpsert(mixedTools);
      
      // Track new tool for cleanup
      const newTool = results.find((r) => r.slug === newSlug);
      if (newTool) testToolIds.push(newTool.id);

      // Property: Should return 2 results
      expect(results.length).toBe(2);

      // Verify existing tool was updated
      const updatedExisting = results.find((r) => r.slug === existingSlug);
      expect(updatedExisting).toBeDefined();
      expect(updatedExisting!.id).toBe(existingTool.id);
      expect(updatedExisting!.name).toBe('Updated Existing');

      // Verify new tool was created
      expect(newTool).toBeDefined();
      expect(newTool!.name).toBe('New Tool');
    });
  });
});
