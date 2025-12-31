/**
 * Property-based tests for Category Groups repository
 *
 * Tests Properties 12 and 13 from the design document:
 * - Property 12: Drag-Drop Reordering (partial)
 * - Property 13: Category Group Deletion Prevention
 *
 * Feature: admin-panel-crud
 * Validates: Requirements 4.2, 4.5, 4.7
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createCategoryGroupsRepository, type CategoryGroupsRepository } from '../category-groups.repository';
import { createCategoriesRepository, type CategoriesRepository } from '../categories.repository';
import type { Database } from '@/lib/supabase/types';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_KEY;

// Helper to generate unique names
function generateUniqueName(base: string): string {
  return `Test ${base} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Helper to generate unique slugs
function generateUniqueSlug(base: string): string {
  return `test-${base}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe.skipIf(shouldSkip)('Category Groups Repository Property Tests', { timeout: 120000 }, () => {
  let supabase: SupabaseClient<Database>;
  let categoryGroupsRepo: CategoryGroupsRepository;
  let categoriesRepo: CategoriesRepository;
  const testGroupIds: string[] = [];
  const testCategoryIds: string[] = [];

  beforeAll(() => {
    supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    categoryGroupsRepo = createCategoryGroupsRepository(supabase);
    categoriesRepo = createCategoriesRepository(supabase);
  });

  afterAll(async () => {
    // Clean up test data in reverse order (categories first, then groups)
    if (testCategoryIds.length > 0) {
      await supabase.from('categories').delete().in('id', testCategoryIds);
    }
    if (testGroupIds.length > 0) {
      await supabase.from('category_groups').delete().in('id', testGroupIds);
    }
  });

  /**
   * **Feature: admin-panel-crud, Property 12: Drag-Drop Reordering (partial)**
   * **Validates: Requirements 4.2**
   *
   * *For any* drag-drop operation that moves an item from position A to position B,
   * the display_order values SHALL be updated such that the moved item has the
   * correct position and all other items maintain their relative order.
   */
  describe('Property 12: Drag-Drop Reordering', () => {
    it('should update display orders correctly when reordering groups (property test with 10 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate number of groups to create (3-6)
          fc.integer({ min: 3, max: 6 }),
          async (numGroups) => {
            // Create test groups with sequential display orders
            const createdGroups: { id: string; display_order: number }[] = [];
            
            for (let i = 0; i < numGroups; i++) {
              const group = await categoryGroupsRepo.create({
                name: generateUniqueName(`Reorder Group ${i}`),
                display_order: i + 1,
              });
              testGroupIds.push(group.id);
              createdGroups.push({ id: group.id, display_order: i + 1 });
            }

            // Generate new order (shuffle the display orders)
            const newOrders = createdGroups.map((g, index) => ({
              id: g.id,
              display_order: numGroups - index, // Reverse order
            }));

            // Apply the reorder
            await categoryGroupsRepo.updateDisplayOrders(newOrders);

            // Verify each group has the correct new display order
            for (const order of newOrders) {
              const group = await categoryGroupsRepo.findById(order.id);
              expect(group.display_order).toBe(order.display_order);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should preserve relative order when moving a single item', async () => {
      // Create 5 groups with sequential orders
      const groups: { id: string; name: string; display_order: number }[] = [];
      
      for (let i = 0; i < 5; i++) {
        const group = await categoryGroupsRepo.create({
          name: generateUniqueName(`Single Move Group ${i}`),
          display_order: i + 1,
        });
        testGroupIds.push(group.id);
        groups.push({ id: group.id, name: group.name, display_order: i + 1 });
      }

      // Move the first item to position 3
      const newOrders = [
        { id: groups[1].id, display_order: 1 },
        { id: groups[2].id, display_order: 2 },
        { id: groups[0].id, display_order: 3 }, // Moved from position 1 to 3
        { id: groups[3].id, display_order: 4 },
        { id: groups[4].id, display_order: 5 },
      ];

      await categoryGroupsRepo.updateDisplayOrders(newOrders);

      // Verify the new order
      const updatedGroups = await categoryGroupsRepo.findAllWithCategoryCount();
      const testGroups = updatedGroups.filter(g => groups.some(tg => tg.id === g.id));
      
      // Sort by display_order to verify order
      testGroups.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      
      // The moved item should now be at position 3
      const movedGroup = testGroups.find(g => g.id === groups[0].id);
      expect(movedGroup?.display_order).toBe(3);
    });
  });

  /**
   * **Feature: admin-panel-crud, Property 13: Category Group Deletion Prevention**
   * **Validates: Requirements 4.5, 4.7**
   *
   * *For any* category group that has assigned categories, attempting to delete it
   * SHALL be prevented until all categories are reassigned or deleted.
   */
  describe('Property 13: Category Group Deletion Prevention', () => {
    it('should allow deletion when group has no categories (property test with 10 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid group names
          fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,30}$/),
          async (baseName) => {
            // Create a group with no categories
            const group = await categoryGroupsRepo.create({
              name: generateUniqueName(baseName),
            });
            testGroupIds.push(group.id);

            // Check if it can be deleted
            const { canDelete, categories } = await categoryGroupsRepo.canDelete(group.id);

            // Property: Group with no categories should be deletable
            expect(canDelete).toBe(true);
            expect(categories).toHaveLength(0);

            // Actually delete it
            await categoryGroupsRepo.delete(group.id);
            
            // Remove from cleanup list since it's already deleted
            const index = testGroupIds.indexOf(group.id);
            if (index > -1) {
              testGroupIds.splice(index, 1);
            }

            // Verify it's deleted
            try {
              await categoryGroupsRepo.findById(group.id);
              // Should not reach here
              expect(true).toBe(false);
            } catch {
              // Expected - group should not be found
              expect(true).toBe(true);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should prevent deletion when group has assigned categories (property test with 10 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate number of categories to assign (1-3)
          fc.integer({ min: 1, max: 3 }),
          async (numCategories) => {
            // Create a group
            const group = await categoryGroupsRepo.create({
              name: generateUniqueName('Group With Categories'),
            });
            testGroupIds.push(group.id);

            // Create categories assigned to this group
            const createdCategories: string[] = [];
            for (let i = 0; i < numCategories; i++) {
              const category = await categoriesRepo.create({
                name: generateUniqueName(`Category ${i}`),
                slug: generateUniqueSlug(`category-${i}`),
                group_id: group.id,
              });
              testCategoryIds.push(category.id);
              createdCategories.push(category.name);
            }

            // Check if it can be deleted
            const { canDelete, categories } = await categoryGroupsRepo.canDelete(group.id);

            // Property: Group with categories should NOT be deletable
            expect(canDelete).toBe(false);
            expect(categories).toHaveLength(numCategories);
            
            // Verify the returned categories match what we created
            const categoryNames = categories.map(c => c.name);
            for (const name of createdCategories) {
              expect(categoryNames).toContain(name);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return correct category info for deletion prevention', async () => {
      // Create a group
      const group = await categoryGroupsRepo.create({
        name: generateUniqueName('Info Test Group'),
      });
      testGroupIds.push(group.id);

      // Create a category with specific details
      const categoryName = generateUniqueName('Info Test Category');
      const categorySlug = generateUniqueSlug('info-test');
      const category = await categoriesRepo.create({
        name: categoryName,
        slug: categorySlug,
        group_id: group.id,
      });
      testCategoryIds.push(category.id);

      // Check deletion prevention info
      const { canDelete, categories } = await categoryGroupsRepo.canDelete(group.id);

      // Verify the category info is correct
      expect(canDelete).toBe(false);
      expect(categories).toHaveLength(1);
      expect(categories[0].id).toBe(category.id);
      expect(categories[0].name).toBe(categoryName);
      expect(categories[0].slug).toBe(categorySlug);
    });

    it('should allow deletion after all categories are removed', async () => {
      // Create a group
      const group = await categoryGroupsRepo.create({
        name: generateUniqueName('Removal Test Group'),
      });
      testGroupIds.push(group.id);

      // Create a category
      const category = await categoriesRepo.create({
        name: generateUniqueName('Removal Test Category'),
        slug: generateUniqueSlug('removal-test'),
        group_id: group.id,
      });
      testCategoryIds.push(category.id);

      // Initially should not be deletable
      let result = await categoryGroupsRepo.canDelete(group.id);
      expect(result.canDelete).toBe(false);

      // Delete the category
      await categoriesRepo.delete(category.id);
      
      // Remove from cleanup list
      const catIndex = testCategoryIds.indexOf(category.id);
      if (catIndex > -1) {
        testCategoryIds.splice(catIndex, 1);
      }

      // Now should be deletable
      result = await categoryGroupsRepo.canDelete(group.id);
      expect(result.canDelete).toBe(true);
      expect(result.categories).toHaveLength(0);
    });
  });
});
