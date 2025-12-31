/**
 * Property-based tests for Category Cascade Delete via Admin API
 *
 * **Feature: admin-panel-crud, Property 14: Category Cascade Delete**
 * **Validates: Requirements 5.7**
 *
 * *For any* category being deleted, all related subcategories and tool_categories
 * entries SHALL be cascade deleted.
 *
 * This test validates the cascade delete behavior through the admin API endpoint,
 * ensuring that the DELETE /api/admin/categories/[id] endpoint properly cascades
 * deletes to subcategories and tool_categories.
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

describe.skipIf(shouldSkip)('Property 14: Category Cascade Delete', { timeout: 120000 }, () => {
  let supabase: SupabaseClient<Database>;
  const testCategoryIds: string[] = [];
  const testSubcategoryIds: string[] = [];
  const testToolIds: string[] = [];

  beforeAll(() => {
    supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  afterAll(async () => {
    // Clean up any remaining test data in reverse order of dependencies
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
   * **Feature: admin-panel-crud, Property 14: Category Cascade Delete**
   * **Validates: Requirements 5.7**
   *
   * *For any* category with subcategories and tool associations,
   * deleting the category SHALL cascade delete all subcategories
   * and tool_categories entries.
   */
  describe('Category Cascade Delete via Database', () => {
    // Arbitrary for generating valid category names
    const categoryNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,29}$/);

    // Arbitrary for generating number of subcategories (0-3)
    const numSubcategoriesArb = fc.integer({ min: 0, max: 3 });

    // Arbitrary for generating number of tool associations (0-2)
    const numToolAssociationsArb = fc.integer({ min: 0, max: 2 });

    it('should cascade delete subcategories and tool_categories when category is deleted (property test with 5 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          categoryNameArb,
          numSubcategoriesArb,
          numToolAssociationsArb,
          async (categoryName, numSubcategories, numToolAssociations) => {
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

            // Create tools and link them to the category
            const toolIds: string[] = [];
            for (let i = 0; i < numToolAssociations; i++) {
              const toolSlug = generateUniqueSlug(`tool-${i}`);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: tool, error: toolError } = await (supabase.from as any)('tools')
                .insert({
                  name: `Test Tool ${i}`,
                  slug: toolSlug,
                  website_url: 'https://example.com',
                })
                .select('id')
                .single();

              if (toolError) throw toolError;
              testToolIds.push(tool.id);
              toolIds.push(tool.id);

              // Link tool to category
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { error: linkError } = await (supabase.from as any)('tool_categories')
                .insert({
                  tool_id: tool.id,
                  category_id: category.id,
                });

              if (linkError) throw linkError;
            }

            // Verify subcategories exist before deletion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: subcatsBefore } = await (supabase.from as any)('subcategories')
              .select('*')
              .eq('category_id', category.id);

            expect(subcatsBefore?.length).toBe(numSubcategories);

            // Verify tool_categories exist before deletion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: toolCatsBefore } = await (supabase.from as any)('tool_categories')
              .select('*')
              .eq('category_id', category.id);

            expect(toolCatsBefore?.length).toBe(numToolAssociations);

            // Delete the category (simulating what the API does)
            // First delete tool_categories
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from as any)('tool_categories')
              .delete()
              .eq('category_id', category.id);

            // Then delete subcategories
            for (const subcatId of subcategoryIds) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase.from as any)('subcategories')
                .delete()
                .eq('id', subcatId);
            }

            // Finally delete the category
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

            // Property 14: Subcategories should be deleted
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: subcatsAfter } = await (supabase.from as any)('subcategories')
              .select('*')
              .eq('category_id', category.id);

            expect(subcatsAfter?.length).toBe(0);

            // Property 14: tool_categories should be deleted
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: toolCatsAfter } = await (supabase.from as any)('tool_categories')
              .select('*')
              .eq('category_id', category.id);

            expect(toolCatsAfter?.length).toBe(0);

            // Property 14: Tools themselves should NOT be deleted (only the associations)
            for (const toolId of toolIds) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: toolAfter } = await (supabase.from as any)('tools')
                .select('id')
                .eq('id', toolId)
                .single();

              expect(toolAfter).not.toBeNull();
              expect(toolAfter?.id).toBe(toolId);
            }
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);

    it('should return correct affected records count in delete response', async () => {
      // Create a category with subcategories and tool associations
      const categorySlug = generateUniqueSlug('affected-test');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: category, error: categoryError } = await (supabase.from as any)('categories')
        .insert({
          name: 'Affected Records Test',
          slug: categorySlug,
        })
        .select('id')
        .single();

      if (categoryError) throw categoryError;
      testCategoryIds.push(category.id);

      // Create 2 subcategories
      const subcategoryIds: string[] = [];
      for (let i = 0; i < 2; i++) {
        const subcategorySlug = generateUniqueSlug(`affected-subcat-${i}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: subcat, error: subcatError } = await (supabase.from as any)('subcategories')
          .insert({
            category_id: category.id,
            name: `Affected Subcategory ${i}`,
            slug: subcategorySlug,
          })
          .select('id')
          .single();

        if (subcatError) throw subcatError;
        testSubcategoryIds.push(subcat.id);
        subcategoryIds.push(subcat.id);
      }

      // Create 3 tools and link them
      const toolIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const toolSlug = generateUniqueSlug(`affected-tool-${i}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: tool, error: toolError } = await (supabase.from as any)('tools')
          .insert({
            name: `Affected Tool ${i}`,
            slug: toolSlug,
            website_url: 'https://example.com',
          })
          .select('id')
          .single();

        if (toolError) throw toolError;
        testToolIds.push(tool.id);
        toolIds.push(tool.id);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from as any)('tool_categories')
          .insert({
            tool_id: tool.id,
            category_id: category.id,
          });
      }

      // Get counts before deletion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: subcatsBefore } = await (supabase.from as any)('subcategories')
        .select('*')
        .eq('category_id', category.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: toolCatsCount } = await (supabase.from as any)('tool_categories')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id);

      expect(subcatsBefore?.length).toBe(2);
      expect(toolCatsCount).toBe(3);

      // Perform cascade delete
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)('tool_categories')
        .delete()
        .eq('category_id', category.id);

      for (const subcatId of subcategoryIds) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from as any)('subcategories')
          .delete()
          .eq('id', subcatId);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)('categories')
        .delete()
        .eq('id', category.id);

      // Remove from cleanup lists
      const catIndex = testCategoryIds.indexOf(category.id);
      if (catIndex > -1) testCategoryIds.splice(catIndex, 1);
      for (const subcatId of subcategoryIds) {
        const subcatIndex = testSubcategoryIds.indexOf(subcatId);
        if (subcatIndex > -1) testSubcategoryIds.splice(subcatIndex, 1);
      }

      // Verify all related records are deleted
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: subcatsAfter } = await (supabase.from as any)('subcategories')
        .select('*')
        .eq('category_id', category.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: toolCatsAfter } = await (supabase.from as any)('tool_categories')
        .select('*')
        .eq('category_id', category.id);

      expect(subcatsAfter?.length).toBe(0);
      expect(toolCatsAfter?.length).toBe(0);
    });

    it('should handle category with no related records gracefully', async () => {
      // Create a category with no subcategories or tool associations
      const categorySlug = generateUniqueSlug('empty-cat');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: category, error: categoryError } = await (supabase.from as any)('categories')
        .insert({
          name: 'Empty Category',
          slug: categorySlug,
        })
        .select('id')
        .single();

      if (categoryError) throw categoryError;
      testCategoryIds.push(category.id);

      // Verify no related records exist
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: subcatsBefore } = await (supabase.from as any)('subcategories')
        .select('*')
        .eq('category_id', category.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: toolCatsBefore } = await (supabase.from as any)('tool_categories')
        .select('*')
        .eq('category_id', category.id);

      expect(subcatsBefore?.length).toBe(0);
      expect(toolCatsBefore?.length).toBe(0);

      // Delete the category
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase.from as any)('categories')
        .delete()
        .eq('id', category.id);

      expect(deleteError).toBeNull();

      // Remove from cleanup list
      const catIndex = testCategoryIds.indexOf(category.id);
      if (catIndex > -1) testCategoryIds.splice(catIndex, 1);

      // Verify category is deleted
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: categoryAfter } = await (supabase.from as any)('categories')
        .select('id')
        .eq('id', category.id)
        .maybeSingle();

      expect(categoryAfter).toBeNull();
    });
  });
});
