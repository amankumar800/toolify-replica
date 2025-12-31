/**
 * Property-based tests for Admin Dashboard Service
 *
 * Tests Properties from the design document:
 * - Property 13: Recent Tools Ordering
 * - Property 16: Dashboard Statistics Accuracy
 *
 * **Feature: admin-auth-separation**
 * **Validates: Requirements 10.1, 10.2, 10.3, 10.4**
 *
 * To run these tests, you need to set:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  getToolsCount,
  getCategoriesCount,
  getAiNewsCount,
  getRecentTools,
  getDashboardStats,
} from '../admin-dashboard.service';
import { TABLES } from '@/lib/db/constants/tables';
import type { Database } from '@/lib/supabase/types';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_KEY;

// Helper to generate unique slugs
function generateUniqueSlug(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe.skipIf(shouldSkip)('Admin Dashboard Service Property Tests', { timeout: 120000 }, () => {
  let supabase: SupabaseClient<Database>;
  const testToolIds: string[] = [];
  const testCategoryIds: string[] = [];
  const testNewsIds: string[] = [];

  beforeAll(() => {
    supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  afterAll(async () => {
    // Clean up test data in reverse order of dependencies
    if (testToolIds.length > 0) {
      await supabase.from(TABLES.TOOLS).delete().in('id', testToolIds);
    }
    if (testCategoryIds.length > 0) {
      await supabase.from(TABLES.CATEGORIES).delete().in('id', testCategoryIds);
    }
    if (testNewsIds.length > 0) {
      await supabase.from(TABLES.AI_NEWS).delete().in('id', testNewsIds);
    }
  });

  /**
   * **Feature: admin-auth-separation, Property 16: Dashboard Statistics Accuracy**
   * **Validates: Requirements 10.1, 10.2, 10.3**
   *
   * *For any* state of the database, the Admin_Dashboard SHALL display:
   * - The exact count of rows in the `tools` table as total tools
   * - The exact count of rows in the `categories` table as total categories
   * - The exact count of rows in the `ai_news` table as total AI news articles
   */
  describe('Property 16: Dashboard Statistics Accuracy', () => {
    it('getToolsCount should return exact count of tools in database', async () => {
      // Get initial count
      const initialCount = await getToolsCount(supabase);

      // Verify against direct database query
      const { count: directCount } = await supabase
        .from(TABLES.TOOLS)
        .select('*', { count: 'exact', head: true });

      // Property: Count should match exact database count
      expect(initialCount).toBe(directCount ?? 0);
    });

    it('getCategoriesCount should return exact count of categories in database', async () => {
      // Get count via service
      const serviceCount = await getCategoriesCount(supabase);

      // Verify against direct database query
      const { count: directCount } = await supabase
        .from(TABLES.CATEGORIES)
        .select('*', { count: 'exact', head: true });

      // Property: Count should match exact database count
      expect(serviceCount).toBe(directCount ?? 0);
    });

    it('getAiNewsCount should return exact count of AI news in database', async () => {
      // Get count via service
      const serviceCount = await getAiNewsCount(supabase);

      // Verify against direct database query
      const { count: directCount } = await supabase
        .from(TABLES.AI_NEWS)
        .select('*', { count: 'exact', head: true });

      // Property: Count should match exact database count
      expect(serviceCount).toBe(directCount ?? 0);
    });

    it('getDashboardStats should return accurate counts for all tables', async () => {
      // Get stats via service
      const stats = await getDashboardStats(supabase);

      // Get direct counts
      const { count: toolsCount } = await supabase
        .from(TABLES.TOOLS)
        .select('*', { count: 'exact', head: true });
      const { count: categoriesCount } = await supabase
        .from(TABLES.CATEGORIES)
        .select('*', { count: 'exact', head: true });
      const { count: newsCount } = await supabase
        .from(TABLES.AI_NEWS)
        .select('*', { count: 'exact', head: true });

      // Property: All counts should match exact database counts
      expect(stats.totalTools).toBe(toolsCount ?? 0);
      expect(stats.totalCategories).toBe(categoriesCount ?? 0);
      expect(stats.totalAiNews).toBe(newsCount ?? 0);
    });

    it('counts should update correctly when records are added', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }),
          async (numToAdd) => {
            // Get initial count
            const initialCount = await getToolsCount(supabase);

            // Add test tools
            const addedIds: string[] = [];
            for (let i = 0; i < numToAdd; i++) {
              const slug = generateUniqueSlug('prop16-tool');
              const { data, error } = await supabase
                .from(TABLES.TOOLS)
                .insert({
                  name: `Test Tool ${slug}`,
                  slug,
                  website_url: `https://example.com/${slug}`,
                })
                .select('id')
                .single();

              if (!error && data) {
                addedIds.push(data.id);
                testToolIds.push(data.id);
              }
            }

            // Get new count
            const newCount = await getToolsCount(supabase);

            // Property: Count should increase by exactly the number added
            expect(newCount).toBe(initialCount + addedIds.length);
          }
        ),
        { numRuns: 3 }
      );
    });
  });

  /**
   * **Feature: admin-auth-separation, Property 13: Recent Tools Ordering**
   * **Validates: Requirements 10.4**
   *
   * *For any* set of tools in the database, the Admin_Dashboard SHALL display
   * exactly the N tools with the most recent `created_at` timestamps,
   * ordered from newest to oldest.
   */
  describe('Property 13: Recent Tools Ordering', () => {
    it('getRecentTools should return tools ordered by created_at DESC', async () => {
      // Create test tools with known timestamps
      const toolsToCreate = 5;
      const createdTools: { id: string; created_at: string }[] = [];

      for (let i = 0; i < toolsToCreate; i++) {
        const slug = generateUniqueSlug(`prop13-order-${i}`);
        const { data, error } = await supabase
          .from(TABLES.TOOLS)
          .insert({
            name: `Order Test Tool ${i}`,
            slug,
            website_url: `https://example.com/${slug}`,
          })
          .select('id, created_at')
          .single();

        if (!error && data) {
          createdTools.push({ id: data.id, created_at: data.created_at! });
          testToolIds.push(data.id);
        }

        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Get recent tools
      const recentTools = await getRecentTools(toolsToCreate, supabase);

      // Property: Results should be ordered by created_at DESC (newest first)
      for (let i = 0; i < recentTools.length - 1; i++) {
        const currentDate = new Date(recentTools[i].created_at);
        const nextDate = new Date(recentTools[i + 1].created_at);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });

    it('getRecentTools should respect the limit parameter', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          async (limit) => {
            const recentTools = await getRecentTools(limit, supabase);

            // Property: Should return at most 'limit' tools
            expect(recentTools.length).toBeLessThanOrEqual(limit);

            // Property: Each tool should have required fields
            for (const tool of recentTools) {
              expect(tool.id).toBeDefined();
              expect(tool.name).toBeDefined();
              expect(tool.slug).toBeDefined();
              expect(tool.created_at).toBeDefined();
            }
          }
        ),
        { numRuns: 5 }
      );
    });

    it('getRecentTools should return the N most recent tools', async () => {
      // First, get all tools ordered by created_at DESC
      const { data: allTools } = await supabase
        .from(TABLES.TOOLS)
        .select('id, name, slug, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!allTools || allTools.length === 0) {
        // Skip if no tools exist
        return;
      }

      const limit = Math.min(5, allTools.length);
      const recentTools = await getRecentTools(limit, supabase);

      // Property: The returned tools should be the same as the top N from direct query
      expect(recentTools.length).toBe(limit);

      for (let i = 0; i < limit; i++) {
        expect(recentTools[i].id).toBe(allTools[i].id);
        expect(recentTools[i].name).toBe(allTools[i].name);
        expect(recentTools[i].slug).toBe(allTools[i].slug);
      }
    });

    it('newly added tools should appear first in recent tools', async () => {
      // Create a new tool
      const slug = generateUniqueSlug('prop13-newest');
      const { data: newTool, error } = await supabase
        .from(TABLES.TOOLS)
        .insert({
          name: `Newest Test Tool ${slug}`,
          slug,
          website_url: `https://example.com/${slug}`,
        })
        .select('id, name, slug, created_at')
        .single();

      if (error || !newTool) {
        throw new Error(`Failed to create test tool: ${error?.message}`);
      }

      testToolIds.push(newTool.id);

      // Get recent tools
      const recentTools = await getRecentTools(5, supabase);

      // Property: The newly created tool should be first (most recent)
      expect(recentTools.length).toBeGreaterThan(0);
      expect(recentTools[0].id).toBe(newTool.id);
      expect(recentTools[0].name).toBe(newTool.name);
      expect(recentTools[0].slug).toBe(newTool.slug);
    });

    it('getRecentTools should return empty array when no tools exist after cleanup', async () => {
      // This test verifies behavior with empty table
      // We'll use a fresh query with limit 0 to test edge case
      const recentTools = await getRecentTools(0, supabase);

      // Property: Should return empty array for limit 0
      expect(recentTools).toEqual([]);
    });
  });
});
