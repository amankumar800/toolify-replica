/**
 * Property-based tests for foreign key cascade delete behavior
 *
 * **Feature: database-schema-redesign, Property 4: Cascade Delete Behavior**
 * **Validates: Requirements 4.2, 5.2, 5.3**
 *
 * *For any* parent record with dependent children via ON DELETE CASCADE,
 * deleting the parent SHALL automatically delete all dependent children.
 *
 * To run these tests, you need to set SUPABASE_SERVICE_ROLE_KEY in your environment.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_KEY;

// Helper to generate unique slugs
function generateUniqueSlug(base: string): string {
  return `test-${base}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe.skipIf(shouldSkip)('Cascade Delete Property Tests', { timeout: 120000 }, () => {
  let supabase: SupabaseClient<Database>;
  const testToolIds: string[] = [];
  const testCategoryIds: string[] = [];
  const testSubcategoryIds: string[] = [];
  const testFeaturedToolIds: string[] = [];

  beforeAll(() => {
    supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  afterAll(async () => {
    // Clean up any remaining test data in reverse order of dependencies
    if (testFeaturedToolIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)('featured_tools').delete().in('id', testFeaturedToolIds);
    }
    if (testSubcategoryIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)('subcategories').delete().in('id', testSubcategoryIds);
    }
    if (testToolIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)('tools').delete().in('id', testToolIds);
    }
    if (testCategoryIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)('categories').delete().in('id', testCategoryIds);
    }
  });


  /**
   * **Feature: database-schema-redesign, Property 4: Cascade Delete Behavior**
   * **Validates: Requirements 4.2, 5.2, 5.3**
   *
   * *For any* tool with category relationships, deleting the tool SHALL also delete
   * all related tool_categories records.
   */
  describe('Property 4: Cascade Delete Behavior', () => {
    // Arbitrary for generating valid tool names
    const toolNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,49}$/);

    // Arbitrary for generating valid category names
    const categoryNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,29}$/);

    // Arbitrary for generating number of categories to link (1-3)
    const numCategoriesArb = fc.integer({ min: 1, max: 3 });

    it('should delete tool_categories records when tool is deleted (property test with 20 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          toolNameArb,
          categoryNameArb,
          numCategoriesArb,
          async (toolName, categoryBaseName, numCategories) => {
            // Create a tool
            const toolSlug = generateUniqueSlug(toolName.toLowerCase().replace(/\s+/g, '-').slice(0, 20));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: tool, error: toolError } = await (supabase.from as any)('tools')
              .insert({
                name: toolName,
                slug: toolSlug,
                website_url: 'https://example.com',
              })
              .select('id')
              .single();

            if (toolError) throw toolError;
            testToolIds.push(tool.id);

            // Create categories and link them to the tool
            const categoryIds: string[] = [];
            for (let i = 0; i < numCategories; i++) {
              const categorySlug = generateUniqueSlug(`${categoryBaseName}-${i}`.toLowerCase().replace(/\s+/g, '-').slice(0, 20));
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: category, error: categoryError } = await (supabase.from as any)('categories')
                .insert({
                  name: `${categoryBaseName} ${i}`,
                  slug: categorySlug,
                })
                .select('id')
                .single();

              if (categoryError) throw categoryError;
              testCategoryIds.push(category.id);
              categoryIds.push(category.id);

              // Link tool to category
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { error: linkError } = await (supabase.from as any)('tool_categories')
                .insert({
                  tool_id: tool.id,
                  category_id: category.id,
                });

              if (linkError) throw linkError;
            }

            // Verify tool_categories records exist before deletion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: beforeDelete, error: beforeError } = await (supabase.from as any)('tool_categories')
              .select('*')
              .eq('tool_id', tool.id);

            if (beforeError) throw beforeError;
            expect(beforeDelete.length).toBe(numCategories);

            // Delete the tool
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: deleteError } = await (supabase.from as any)('tools')
              .delete()
              .eq('id', tool.id);

            if (deleteError) throw deleteError;

            // Remove from cleanup list since it's already deleted
            const toolIndex = testToolIds.indexOf(tool.id);
            if (toolIndex > -1) {
              testToolIds.splice(toolIndex, 1);
            }

            // Property: tool_categories records should be deleted via cascade
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: afterDelete, error: afterError } = await (supabase.from as any)('tool_categories')
              .select('*')
              .eq('tool_id', tool.id);

            if (afterError) throw afterError;
            expect(afterDelete.length).toBe(0);
          }
        ),
        { numRuns: 20 }
      );
    }, 180000);

    it('should delete tool_categories records when category is deleted', async () => {
      // Create a tool
      const toolSlug = generateUniqueSlug('cascade-cat-test');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: tool, error: toolError } = await (supabase.from as any)('tools')
        .insert({
          name: 'Cascade Category Test Tool',
          slug: toolSlug,
          website_url: 'https://example.com',
        })
        .select('id')
        .single();

      if (toolError) throw toolError;
      testToolIds.push(tool.id);

      // Create a category
      const categorySlug = generateUniqueSlug('cascade-cat');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: category, error: categoryError } = await (supabase.from as any)('categories')
        .insert({
          name: 'Cascade Test Category',
          slug: categorySlug,
        })
        .select('id')
        .single();

      if (categoryError) throw categoryError;
      testCategoryIds.push(category.id);

      // Link tool to category
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: linkError } = await (supabase.from as any)('tool_categories')
        .insert({
          tool_id: tool.id,
          category_id: category.id,
        });

      if (linkError) throw linkError;

      // Verify tool_categories record exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: beforeDelete } = await (supabase.from as any)('tool_categories')
        .select('*')
        .eq('category_id', category.id);

      expect(beforeDelete?.length).toBe(1);

      // Delete the category
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase.from as any)('categories')
        .delete()
        .eq('id', category.id);

      if (deleteError) throw deleteError;

      // Remove from cleanup list
      const catIndex = testCategoryIds.indexOf(category.id);
      if (catIndex > -1) {
        testCategoryIds.splice(catIndex, 1);
      }

      // Property: tool_categories records should be deleted via cascade
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: afterDelete } = await (supabase.from as any)('tool_categories')
        .select('*')
        .eq('category_id', category.id);

      expect(afterDelete?.length).toBe(0);
    });

    it('should preserve tool when only tool_categories link is removed', async () => {
      // Create a tool
      const toolSlug = generateUniqueSlug('preserve-tool-test');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: tool, error: toolError } = await (supabase.from as any)('tools')
        .insert({
          name: 'Preserve Tool Test',
          slug: toolSlug,
          website_url: 'https://example.com',
        })
        .select('id')
        .single();

      if (toolError) throw toolError;
      testToolIds.push(tool.id);

      // Create a category
      const categorySlug = generateUniqueSlug('preserve-cat');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: category, error: categoryError } = await (supabase.from as any)('categories')
        .insert({
          name: 'Preserve Test Category',
          slug: categorySlug,
        })
        .select('id')
        .single();

      if (categoryError) throw categoryError;
      testCategoryIds.push(category.id);

      // Link tool to category
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)('tool_categories')
        .insert({
          tool_id: tool.id,
          category_id: category.id,
        });

      // Delete only the tool_categories link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)('tool_categories')
        .delete()
        .eq('tool_id', tool.id)
        .eq('category_id', category.id);

      // Property: Tool should still exist
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: toolAfter } = await (supabase.from as any)('tools')
        .select('id')
        .eq('id', tool.id)
        .single();

      expect(toolAfter).not.toBeNull();
      expect(toolAfter?.id).toBe(tool.id);

      // Property: Category should still exist
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: categoryAfter } = await (supabase.from as any)('categories')
        .select('id')
        .eq('id', category.id)
        .single();

      expect(categoryAfter).not.toBeNull();
      expect(categoryAfter?.id).toBe(category.id);
    });

    // Requirement 4.2: Subcategories cascade delete from categories
    it('should delete subcategories when category is deleted (Req 4.2)', async () => {
      // Create a category
      const categorySlug = generateUniqueSlug('cascade-subcat-test');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: category, error: categoryError } = await (supabase.from as any)('categories')
        .insert({
          name: 'Cascade Subcategory Test Category',
          slug: categorySlug,
        })
        .select('id')
        .single();

      if (categoryError) throw categoryError;
      testCategoryIds.push(category.id);

      // Create subcategories
      const subcategorySlug1 = generateUniqueSlug('subcat-1');
      const subcategorySlug2 = generateUniqueSlug('subcat-2');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: subcat1, error: subcat1Error } = await (supabase.from as any)('subcategories')
        .insert({
          category_id: category.id,
          name: 'Subcategory 1',
          slug: subcategorySlug1,
        })
        .select('id')
        .single();

      if (subcat1Error) throw subcat1Error;
      testSubcategoryIds.push(subcat1.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: subcat2, error: subcat2Error } = await (supabase.from as any)('subcategories')
        .insert({
          category_id: category.id,
          name: 'Subcategory 2',
          slug: subcategorySlug2,
        })
        .select('id')
        .single();

      if (subcat2Error) throw subcat2Error;
      testSubcategoryIds.push(subcat2.id);

      // Verify subcategories exist before deletion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: beforeDelete } = await (supabase.from as any)('subcategories')
        .select('*')
        .eq('category_id', category.id);

      expect(beforeDelete?.length).toBe(2);

      // Delete the category
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase.from as any)('categories')
        .delete()
        .eq('id', category.id);

      if (deleteError) throw deleteError;

      // Remove from cleanup lists
      const catIndex = testCategoryIds.indexOf(category.id);
      if (catIndex > -1) testCategoryIds.splice(catIndex, 1);
      const subcat1Index = testSubcategoryIds.indexOf(subcat1.id);
      if (subcat1Index > -1) testSubcategoryIds.splice(subcat1Index, 1);
      const subcat2Index = testSubcategoryIds.indexOf(subcat2.id);
      if (subcat2Index > -1) testSubcategoryIds.splice(subcat2Index, 1);

      // Property: subcategories should be deleted via cascade
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: afterDelete } = await (supabase.from as any)('subcategories')
        .select('*')
        .eq('category_id', category.id);

      expect(afterDelete?.length).toBe(0);
    });

    // Requirement 5.2, 5.3: featured_tools cascade delete from tools
    it('should delete featured_tools when tool is deleted (Req 5.2, 5.3)', async () => {
      // Create a tool
      const toolSlug = generateUniqueSlug('cascade-featured-test');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: tool, error: toolError } = await (supabase.from as any)('tools')
        .insert({
          name: 'Cascade Featured Test Tool',
          slug: toolSlug,
          website_url: 'https://example.com',
        })
        .select('id')
        .single();

      if (toolError) throw toolError;
      testToolIds.push(tool.id);

      // Create featured_tools entries
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: featured1, error: featured1Error } = await (supabase.from as any)('featured_tools')
        .insert({
          tool_id: tool.id,
          placement_type: 'homepage',
        })
        .select('id')
        .single();

      if (featured1Error) throw featured1Error;
      testFeaturedToolIds.push(featured1.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: featured2, error: featured2Error } = await (supabase.from as any)('featured_tools')
        .insert({
          tool_id: tool.id,
          placement_type: 'category',
        })
        .select('id')
        .single();

      if (featured2Error) throw featured2Error;
      testFeaturedToolIds.push(featured2.id);

      // Verify featured_tools exist before deletion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: beforeDelete } = await (supabase.from as any)('featured_tools')
        .select('*')
        .eq('tool_id', tool.id);

      expect(beforeDelete?.length).toBe(2);

      // Delete the tool
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase.from as any)('tools')
        .delete()
        .eq('id', tool.id);

      if (deleteError) throw deleteError;

      // Remove from cleanup lists
      const toolIndex = testToolIds.indexOf(tool.id);
      if (toolIndex > -1) testToolIds.splice(toolIndex, 1);
      const featured1Index = testFeaturedToolIds.indexOf(featured1.id);
      if (featured1Index > -1) testFeaturedToolIds.splice(featured1Index, 1);
      const featured2Index = testFeaturedToolIds.indexOf(featured2.id);
      if (featured2Index > -1) testFeaturedToolIds.splice(featured2Index, 1);

      // Property: featured_tools should be deleted via cascade
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: afterDelete } = await (supabase.from as any)('featured_tools')
        .select('*')
        .eq('tool_id', tool.id);

      expect(afterDelete?.length).toBe(0);
    });

    // Property test for subcategories cascade with multiple categories
    it('should cascade delete subcategories for any category (property test with 20 runs)', async () => {
      const categoryNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,29}$/);
      const numSubcategoriesArb = fc.integer({ min: 1, max: 3 });

      await fc.assert(
        fc.asyncProperty(categoryNameArb, numSubcategoriesArb, async (categoryName, numSubcategories) => {
          // Create a category
          const categorySlug = generateUniqueSlug(categoryName.toLowerCase().replace(/\s+/g, '-').slice(0, 20));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: category, error: categoryError } = await (supabase.from as any)('categories')
            .insert({
              name: categoryName,
              slug: categorySlug,
            })
            .select('id')
            .single();

          if (categoryError) throw categoryError;
          testCategoryIds.push(category.id);

          // Create subcategories
          const subcategoryIds: string[] = [];
          for (let i = 0; i < numSubcategories; i++) {
            const subcategorySlug = generateUniqueSlug(`subcat-${i}`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: subcat, error: subcatError } = await (supabase.from as any)('subcategories')
              .insert({
                category_id: category.id,
                name: `Subcategory ${i}`,
                slug: subcategorySlug,
              })
              .select('id')
              .single();

            if (subcatError) throw subcatError;
            testSubcategoryIds.push(subcat.id);
            subcategoryIds.push(subcat.id);
          }

          // Verify subcategories exist before deletion
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: beforeDelete } = await (supabase.from as any)('subcategories')
            .select('*')
            .eq('category_id', category.id);

          expect(beforeDelete?.length).toBe(numSubcategories);

          // Delete the category
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: deleteError } = await (supabase.from as any)('categories')
            .delete()
            .eq('id', category.id);

          if (deleteError) throw deleteError;

          // Remove from cleanup lists
          const catIndex = testCategoryIds.indexOf(category.id);
          if (catIndex > -1) testCategoryIds.splice(catIndex, 1);
          for (const subcatId of subcategoryIds) {
            const subcatIndex = testSubcategoryIds.indexOf(subcatId);
            if (subcatIndex > -1) testSubcategoryIds.splice(subcatIndex, 1);
          }

          // Property: subcategories should be deleted via cascade
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: afterDelete } = await (supabase.from as any)('subcategories')
            .select('*')
            .eq('category_id', category.id);

          expect(afterDelete?.length).toBe(0);
        }),
        { numRuns: 20 }
      );
    }, 180000);
  });
});
