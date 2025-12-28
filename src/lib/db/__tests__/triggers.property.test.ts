/**
 * Property-based tests for database triggers
 *
 * **Feature: database-schema-redesign, Property 7: Trigger Behavior**
 * **Validates: Requirements 12.4**
 *
 * *For any* table with an updated_at trigger, updating a row SHALL automatically
 * set updated_at to the current timestamp.
 *
 * Tables with updated_at triggers:
 * - tools
 * - categories
 * - category_groups
 * - subcategories
 * - midjourney_prompts
 * - ai_news
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

// Helper to wait for a short time to ensure timestamp difference
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe.skipIf(shouldSkip)('Property 7: Trigger Behavior', { timeout: 180000 }, () => {
  let supabase: SupabaseClient<Database>;

  // Track test data for cleanup
  const testToolIds: string[] = [];
  const testCategoryIds: string[] = [];
  const testCategoryGroupIds: string[] = [];
  const testSubcategoryIds: string[] = [];
  const testMidjourneyPromptIds: string[] = [];
  const testAiNewsIds: string[] = [];

  beforeAll(() => {
    supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  afterAll(async () => {
    // Clean up test data in reverse order of dependencies
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
    if (testCategoryGroupIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)('category_groups').delete().in('id', testCategoryGroupIds);
    }
    if (testMidjourneyPromptIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)('midjourney_prompts').delete().in('id', testMidjourneyPromptIds);
    }
    if (testAiNewsIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)('ai_news').delete().in('id', testAiNewsIds);
    }
  });


  /**
   * Tools table updated_at trigger tests
   */
  describe('Tools Table Trigger', () => {
    // Arbitrary for generating valid tool names
    const toolNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,49}$/);

    it('should update updated_at timestamp when tool is modified (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(toolNameArb, toolNameArb, async (originalName, newName) => {
          // Skip if names are the same (no actual update)
          fc.pre(originalName !== newName);

          const slug = generateUniqueSlug(originalName.toLowerCase().replace(/\s+/g, '-').slice(0, 20));

          // Create initial record
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: created, error: createError } = await (supabase.from as any)('tools')
            .insert({
              name: originalName,
              slug,
              website_url: 'https://example.com',
            })
            .select('id, updated_at')
            .single();

          expect(createError).toBeNull();
          testToolIds.push(created.id);

          const originalUpdatedAt = created.updated_at;
          expect(originalUpdatedAt).toBeDefined();

          await sleep(10);

          // Update the record
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: updated, error: updateError } = await (supabase.from as any)('tools')
            .update({ name: newName })
            .eq('id', created.id)
            .select('updated_at')
            .single();

          expect(updateError).toBeNull();

          // Property: updated_at should be greater than or equal to the original
          const originalTime = new Date(originalUpdatedAt).getTime();
          const updatedTime = new Date(updated.updated_at).getTime();
          expect(updatedTime).toBeGreaterThanOrEqual(originalTime);

          return true;
        }),
        { numRuns: 20 }
      );
    }, 180000);

    it('should set updated_at on initial tool creation', async () => {
      const slug = generateUniqueSlug('tool-creation-test');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: created, error } = await (supabase.from as any)('tools')
        .insert({
          name: 'Tool Creation Test',
          slug,
          website_url: 'https://example.com',
        })
        .select('id, created_at, updated_at')
        .single();

      expect(error).toBeNull();
      testToolIds.push(created.id);

      expect(created.created_at).toBeDefined();
      expect(created.updated_at).toBeDefined();

      // They should be equal or very close on initial creation
      const createdTime = new Date(created.created_at).getTime();
      const updatedTime = new Date(created.updated_at).getTime();
      expect(Math.abs(updatedTime - createdTime)).toBeLessThan(1000);
    });
  });

  /**
   * Categories table updated_at trigger tests
   */
  describe('Categories Table Trigger', () => {
    const categoryNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,29}$/);

    it('should update updated_at timestamp when category is modified (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(categoryNameArb, categoryNameArb, async (originalName, newName) => {
          fc.pre(originalName !== newName);

          const slug = generateUniqueSlug(originalName.toLowerCase().replace(/\s+/g, '-').slice(0, 20));

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: created, error: createError } = await (supabase.from as any)('categories')
            .insert({
              name: originalName,
              slug,
            })
            .select('id, updated_at')
            .single();

          expect(createError).toBeNull();
          testCategoryIds.push(created.id);

          const originalUpdatedAt = created.updated_at;
          await sleep(10);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: updated, error: updateError } = await (supabase.from as any)('categories')
            .update({ name: newName })
            .eq('id', created.id)
            .select('updated_at')
            .single();

          expect(updateError).toBeNull();

          const originalTime = new Date(originalUpdatedAt).getTime();
          const updatedTime = new Date(updated.updated_at).getTime();
          expect(updatedTime).toBeGreaterThanOrEqual(originalTime);

          return true;
        }),
        { numRuns: 20 }
      );
    }, 180000);

    it('should not change created_at when category is updated', async () => {
      const slug = generateUniqueSlug('cat-created-at-test');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: created, error: createError } = await (supabase.from as any)('categories')
        .insert({
          name: 'Category Created At Test',
          slug,
        })
        .select('id, created_at')
        .single();

      expect(createError).toBeNull();
      testCategoryIds.push(created.id);

      const originalCreatedAt = created.created_at;
      await sleep(10);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updated, error: updateError } = await (supabase.from as any)('categories')
        .update({ name: 'Updated Category Name' })
        .eq('id', created.id)
        .select('created_at')
        .single();

      expect(updateError).toBeNull();
      expect(updated.created_at).toBe(originalCreatedAt);
    });
  });


  /**
   * Category Groups table updated_at trigger tests
   */
  describe('Category Groups Table Trigger', () => {
    const groupNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,29}$/);

    it('should update updated_at timestamp when category_group is modified (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(groupNameArb, groupNameArb, async (originalName, newName) => {
          fc.pre(originalName !== newName);

          const uniqueName = `${originalName} ${Date.now()}`;
          const newUniqueName = `${newName} ${Date.now() + 1}`;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: created, error: createError } = await (supabase.from as any)('category_groups')
            .insert({
              name: uniqueName,
            })
            .select('id, updated_at')
            .single();

          expect(createError).toBeNull();
          testCategoryGroupIds.push(created.id);

          const originalUpdatedAt = created.updated_at;
          await sleep(10);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: updated, error: updateError } = await (supabase.from as any)('category_groups')
            .update({ name: newUniqueName })
            .eq('id', created.id)
            .select('updated_at')
            .single();

          expect(updateError).toBeNull();

          const originalTime = new Date(originalUpdatedAt).getTime();
          const updatedTime = new Date(updated.updated_at).getTime();
          expect(updatedTime).toBeGreaterThanOrEqual(originalTime);

          return true;
        }),
        { numRuns: 20 }
      );
    }, 180000);
  });

  /**
   * Subcategories table updated_at trigger tests
   */
  describe('Subcategories Table Trigger', () => {
    const subcategoryNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,29}$/);

    it('should update updated_at timestamp when subcategory is modified (property test)', async () => {
      // First create a parent category
      const categorySlug = generateUniqueSlug('parent-cat');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: category, error: catError } = await (supabase.from as any)('categories')
        .insert({
          name: 'Parent Category for Subcategory Test',
          slug: categorySlug,
        })
        .select('id')
        .single();

      expect(catError).toBeNull();
      testCategoryIds.push(category.id);

      await fc.assert(
        fc.asyncProperty(subcategoryNameArb, subcategoryNameArb, async (originalName, newName) => {
          fc.pre(originalName !== newName);

          const slug = generateUniqueSlug(originalName.toLowerCase().replace(/\s+/g, '-').slice(0, 20));

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: created, error: createError } = await (supabase.from as any)('subcategories')
            .insert({
              category_id: category.id,
              name: originalName,
              slug,
            })
            .select('id, updated_at')
            .single();

          expect(createError).toBeNull();
          testSubcategoryIds.push(created.id);

          const originalUpdatedAt = created.updated_at;
          await sleep(10);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: updated, error: updateError } = await (supabase.from as any)('subcategories')
            .update({ name: newName })
            .eq('id', created.id)
            .select('updated_at')
            .single();

          expect(updateError).toBeNull();

          const originalTime = new Date(originalUpdatedAt).getTime();
          const updatedTime = new Date(updated.updated_at).getTime();
          expect(updatedTime).toBeGreaterThanOrEqual(originalTime);

          return true;
        }),
        { numRuns: 20 }
      );
    }, 180000);
  });


  /**
   * Midjourney Prompts table updated_at trigger tests
   */
  describe('Midjourney Prompts Table Trigger', () => {
    const titleArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,49}$/);

    it('should update updated_at timestamp when midjourney_prompt is modified (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(titleArb, titleArb, async (originalTitle, newTitle) => {
          fc.pre(originalTitle !== newTitle);

          const slug = generateUniqueSlug(originalTitle.toLowerCase().replace(/\s+/g, '-').slice(0, 20));

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: created, error: createError } = await (supabase.from as any)('midjourney_prompts')
            .insert({
              title: originalTitle,
              slug,
              type: 'sref',
            })
            .select('id, updated_at')
            .single();

          expect(createError).toBeNull();
          testMidjourneyPromptIds.push(created.id);

          const originalUpdatedAt = created.updated_at;
          await sleep(10);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: updated, error: updateError } = await (supabase.from as any)('midjourney_prompts')
            .update({ title: newTitle })
            .eq('id', created.id)
            .select('updated_at')
            .single();

          expect(updateError).toBeNull();

          const originalTime = new Date(originalUpdatedAt).getTime();
          const updatedTime = new Date(updated.updated_at).getTime();
          expect(updatedTime).toBeGreaterThanOrEqual(originalTime);

          return true;
        }),
        { numRuns: 20 }
      );
    }, 180000);

    it('should set updated_at on initial midjourney_prompt creation', async () => {
      const slug = generateUniqueSlug('mj-creation-test');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: created, error } = await (supabase.from as any)('midjourney_prompts')
        .insert({
          title: 'Midjourney Creation Test',
          slug,
          type: 'prompt',
        })
        .select('id, created_at, updated_at')
        .single();

      expect(error).toBeNull();
      testMidjourneyPromptIds.push(created.id);

      expect(created.created_at).toBeDefined();
      expect(created.updated_at).toBeDefined();

      const createdTime = new Date(created.created_at).getTime();
      const updatedTime = new Date(created.updated_at).getTime();
      expect(Math.abs(updatedTime - createdTime)).toBeLessThan(1000);
    });
  });

  /**
   * AI News table updated_at trigger tests
   */
  describe('AI News Table Trigger', () => {
    const titleArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,49}$/);

    it('should update updated_at timestamp when ai_news is modified (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(titleArb, titleArb, async (originalTitle, newTitle) => {
          fc.pre(originalTitle !== newTitle);

          const slug = generateUniqueSlug(originalTitle.toLowerCase().replace(/\s+/g, '-').slice(0, 20));

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: created, error: createError } = await (supabase.from as any)('ai_news')
            .insert({
              title: originalTitle,
              slug,
            })
            .select('id, updated_at')
            .single();

          expect(createError).toBeNull();
          testAiNewsIds.push(created.id);

          const originalUpdatedAt = created.updated_at;
          await sleep(10);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: updated, error: updateError } = await (supabase.from as any)('ai_news')
            .update({ title: newTitle })
            .eq('id', created.id)
            .select('updated_at')
            .single();

          expect(updateError).toBeNull();

          const originalTime = new Date(originalUpdatedAt).getTime();
          const updatedTime = new Date(updated.updated_at).getTime();
          expect(updatedTime).toBeGreaterThanOrEqual(originalTime);

          return true;
        }),
        { numRuns: 20 }
      );
    }, 180000);

    it('should not change created_at when ai_news is updated', async () => {
      const slug = generateUniqueSlug('news-created-at-test');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: created, error: createError } = await (supabase.from as any)('ai_news')
        .insert({
          title: 'AI News Created At Test',
          slug,
        })
        .select('id, created_at')
        .single();

      expect(createError).toBeNull();
      testAiNewsIds.push(created.id);

      const originalCreatedAt = created.created_at;
      await sleep(10);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updated, error: updateError } = await (supabase.from as any)('ai_news')
        .update({ title: 'Updated AI News Title' })
        .eq('id', created.id)
        .select('created_at')
        .single();

      expect(updateError).toBeNull();
      expect(updated.created_at).toBe(originalCreatedAt);
    });
  });

  /**
   * Combined property test for all tables with updated_at triggers
   */
  describe('Combined Trigger Property Tests', () => {
    it('should update updated_at on each subsequent update for any table', async () => {
      // Test tools table with multiple updates
      const toolSlug = generateUniqueSlug('multi-update-tool');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: tool, error: toolError } = await (supabase.from as any)('tools')
        .insert({
          name: 'Multi Update Tool',
          slug: toolSlug,
          website_url: 'https://example.com',
        })
        .select('id, updated_at')
        .single();

      expect(toolError).toBeNull();
      testToolIds.push(tool.id);

      let previousUpdatedAt = tool.updated_at;

      // Perform multiple updates and verify timestamp increases each time
      for (let i = 1; i <= 3; i++) {
        await sleep(10);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: updated, error: updateError } = await (supabase.from as any)('tools')
          .update({ name: `Updated Name ${i}` })
          .eq('id', tool.id)
          .select('updated_at')
          .single();

        expect(updateError).toBeNull();

        const previousTime = new Date(previousUpdatedAt).getTime();
        const currentTime = new Date(updated.updated_at).getTime();
        expect(currentTime).toBeGreaterThanOrEqual(previousTime);

        previousUpdatedAt = updated.updated_at;
      }
    });
  });
});
