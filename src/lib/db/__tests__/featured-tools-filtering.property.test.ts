/**
 * Property-based tests for featured tools date filtering
 *
 * **Feature: database-schema-redesign, Property 10: Featured Tools Date Filtering**
 * **Validates: Requirements 6.7**
 *
 * *For any* query for active featured tools, only records where
 * start_date <= NOW() AND end_date >= NOW() SHALL be returned.
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

describe.skipIf(shouldSkip)('Featured Tools Date Filtering Property Tests', { timeout: 120000 }, () => {
  let supabase: SupabaseClient;
  const testToolIds: string[] = [];
  const testFeaturedToolIds: string[] = [];

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  afterAll(async () => {
    // Clean up test data in correct order (featured_tools first due to FK)
    if (testFeaturedToolIds.length > 0) {
      await supabase.from('featured_tools').delete().in('id', testFeaturedToolIds);
    }
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
   * Helper to create a test tool and return its ID
   */
  async function createTestTool(): Promise<string | null> {
    const slug = generateSlug();
    const { data, error } = await supabase
      .from('tools')
      .insert({
        name: 'Test Tool for Featured',
        slug,
        website_url: 'https://example.com',
        status: 'published',
      })
      .select('id')
      .single();

    if (error || !data) return null;
    testToolIds.push(data.id);
    return data.id;
  }

  /**
   * Helper to get date offset from now
   */
  function getDateOffset(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  /**
   * **Feature: database-schema-redesign, Property 10: Featured Tools Date Filtering**
   * **Validates: Requirements 6.7**
   *
   * *For any* query for active featured tools, only records where
   * start_date <= NOW() AND end_date >= NOW() SHALL be returned.
   */
  describe('Property 10: Featured Tools Date Filtering', () => {
    it('should return featured tools with null dates (always active)', async () => {
      const toolId = await createTestTool();
      expect(toolId).not.toBeNull();

      if (toolId) {
        // Create featured tool with null dates (always active)
        const { data: featuredData, error: featuredError } = await supabase
          .from('featured_tools')
          .insert({
            tool_id: toolId,
            placement_type: 'homepage',
            start_date: null,
            end_date: null,
          })
          .select('id')
          .single();

        expect(featuredError).toBeNull();
        if (featuredData) {
          testFeaturedToolIds.push(featuredData.id);

          // Query for active featured tools
          const now = new Date().toISOString();
          const { data: activeData, error: activeError } = await supabase
            .from('featured_tools')
            .select('id, tool_id')
            .or(`start_date.is.null,start_date.lte.${now}`)
            .or(`end_date.is.null,end_date.gte.${now}`)
            .eq('id', featuredData.id);

          expect(activeError).toBeNull();
          expect(activeData).not.toBeNull();
          expect(activeData?.length).toBeGreaterThan(0);
        }
      }
    });

    it('should return featured tools with current date within range', async () => {
      const toolId = await createTestTool();
      expect(toolId).not.toBeNull();

      if (toolId) {
        // Create featured tool with date range that includes now
        const startDate = getDateOffset(-7); // 7 days ago
        const endDate = getDateOffset(7); // 7 days from now

        const { data: featuredData, error: featuredError } = await supabase
          .from('featured_tools')
          .insert({
            tool_id: toolId,
            placement_type: 'homepage',
            start_date: startDate,
            end_date: endDate,
          })
          .select('id')
          .single();

        expect(featuredError).toBeNull();
        if (featuredData) {
          testFeaturedToolIds.push(featuredData.id);

          // Query for active featured tools
          const now = new Date().toISOString();
          const { data: activeData, error: activeError } = await supabase
            .from('featured_tools')
            .select('id')
            .lte('start_date', now)
            .gte('end_date', now)
            .eq('id', featuredData.id);

          expect(activeError).toBeNull();
          expect(activeData).not.toBeNull();
          expect(activeData?.length).toBeGreaterThan(0);
        }
      }
    });

    it('should NOT return featured tools with future start_date', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 30 }), // days in future
          async (daysInFuture) => {
            const toolId = await createTestTool();
            expect(toolId).not.toBeNull();

            if (toolId) {
              // Create featured tool with future start date
              const startDate = getDateOffset(daysInFuture);
              const endDate = getDateOffset(daysInFuture + 30);

              const { data: featuredData, error: featuredError } = await supabase
                .from('featured_tools')
                .insert({
                  tool_id: toolId,
                  placement_type: 'homepage',
                  start_date: startDate,
                  end_date: endDate,
                })
                .select('id')
                .single();

              expect(featuredError).toBeNull();
              if (featuredData) {
                testFeaturedToolIds.push(featuredData.id);

                // Query for active featured tools (start_date <= now)
                const now = new Date().toISOString();
                const { data: activeData, error: activeError } = await supabase
                  .from('featured_tools')
                  .select('id')
                  .lte('start_date', now)
                  .eq('id', featuredData.id);

                expect(activeError).toBeNull();
                // Should NOT be returned because start_date is in the future
                expect(activeData?.length ?? 0).toBe(0);
              }
            }
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should NOT return featured tools with past end_date', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 30 }), // days in past
          async (daysInPast) => {
            const toolId = await createTestTool();
            expect(toolId).not.toBeNull();

            if (toolId) {
              // Create featured tool with past end date
              const startDate = getDateOffset(-daysInPast - 30);
              const endDate = getDateOffset(-daysInPast);

              const { data: featuredData, error: featuredError } = await supabase
                .from('featured_tools')
                .insert({
                  tool_id: toolId,
                  placement_type: 'homepage',
                  start_date: startDate,
                  end_date: endDate,
                })
                .select('id')
                .single();

              expect(featuredError).toBeNull();
              if (featuredData) {
                testFeaturedToolIds.push(featuredData.id);

                // Query for active featured tools (end_date >= now)
                const now = new Date().toISOString();
                const { data: activeData, error: activeError } = await supabase
                  .from('featured_tools')
                  .select('id')
                  .gte('end_date', now)
                  .eq('id', featuredData.id);

                expect(activeError).toBeNull();
                // Should NOT be returned because end_date is in the past
                expect(activeData?.length ?? 0).toBe(0);
              }
            }
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should filter by placement_type while respecting date constraints', async () => {
      const toolId = await createTestTool();
      expect(toolId).not.toBeNull();

      if (toolId) {
        // Create active featured tool for homepage
        const startDate = getDateOffset(-7);
        const endDate = getDateOffset(7);

        const { data: featuredData, error: featuredError } = await supabase
          .from('featured_tools')
          .insert({
            tool_id: toolId,
            placement_type: 'homepage',
            start_date: startDate,
            end_date: endDate,
          })
          .select('id')
          .single();

        expect(featuredError).toBeNull();
        if (featuredData) {
          testFeaturedToolIds.push(featuredData.id);

          const now = new Date().toISOString();

          // Query for homepage placement - should find it
          const { data: homepageData, error: homepageError } = await supabase
            .from('featured_tools')
            .select('id')
            .eq('placement_type', 'homepage')
            .lte('start_date', now)
            .gte('end_date', now)
            .eq('id', featuredData.id);

          expect(homepageError).toBeNull();
          expect(homepageData?.length).toBeGreaterThan(0);

          // Query for category placement - should NOT find it
          const { data: categoryData, error: categoryError } = await supabase
            .from('featured_tools')
            .select('id')
            .eq('placement_type', 'category')
            .lte('start_date', now)
            .gte('end_date', now)
            .eq('id', featuredData.id);

          expect(categoryError).toBeNull();
          expect(categoryData?.length ?? 0).toBe(0);
        }
      }
    });

    it('should handle sponsored tools with date filtering', async () => {
      const toolId = await createTestTool();
      expect(toolId).not.toBeNull();

      if (toolId) {
        // Create active sponsored featured tool
        const startDate = getDateOffset(-7);
        const endDate = getDateOffset(7);

        const { data: featuredData, error: featuredError } = await supabase
          .from('featured_tools')
          .insert({
            tool_id: toolId,
            placement_type: 'homepage',
            is_sponsored: true,
            sponsor_name: 'Test Sponsor',
            start_date: startDate,
            end_date: endDate,
          })
          .select('id')
          .single();

        expect(featuredError).toBeNull();
        if (featuredData) {
          testFeaturedToolIds.push(featuredData.id);

          const now = new Date().toISOString();

          // Query for active sponsored tools
          const { data: sponsoredData, error: sponsoredError } = await supabase
            .from('featured_tools')
            .select('id, is_sponsored, sponsor_name')
            .eq('is_sponsored', true)
            .lte('start_date', now)
            .gte('end_date', now)
            .eq('id', featuredData.id);

          expect(sponsoredError).toBeNull();
          expect(sponsoredData?.length).toBeGreaterThan(0);
          expect(sponsoredData?.[0]?.is_sponsored).toBe(true);
          expect(sponsoredData?.[0]?.sponsor_name).toBe('Test Sponsor');
        }
      }
    });

    it('should correctly identify boundary conditions (start_date = now)', async () => {
      const toolId = await createTestTool();
      expect(toolId).not.toBeNull();

      if (toolId) {
        // Create featured tool starting exactly now
        const now = new Date();
        const startDate = now.toISOString();
        const endDate = getDateOffset(7);

        const { data: featuredData, error: featuredError } = await supabase
          .from('featured_tools')
          .insert({
            tool_id: toolId,
            placement_type: 'homepage',
            start_date: startDate,
            end_date: endDate,
          })
          .select('id')
          .single();

        expect(featuredError).toBeNull();
        if (featuredData) {
          testFeaturedToolIds.push(featuredData.id);

          // Query should include this tool (start_date <= now)
          const queryNow = new Date().toISOString();
          const { data: activeData, error: activeError } = await supabase
            .from('featured_tools')
            .select('id')
            .lte('start_date', queryNow)
            .gte('end_date', queryNow)
            .eq('id', featuredData.id);

          expect(activeError).toBeNull();
          expect(activeData?.length).toBeGreaterThan(0);
        }
      }
    });

    it('should correctly identify boundary conditions (end_date slightly in future)', async () => {
      const toolId = await createTestTool();
      expect(toolId).not.toBeNull();

      if (toolId) {
        // Create featured tool ending slightly in the future (1 minute from now)
        // to avoid timing issues with exact boundary
        const startDate = getDateOffset(-7);
        const endDate = new Date(Date.now() + 60000).toISOString(); // 1 minute from now

        const { data: featuredData, error: featuredError } = await supabase
          .from('featured_tools')
          .insert({
            tool_id: toolId,
            placement_type: 'homepage',
            start_date: startDate,
            end_date: endDate,
          })
          .select('id')
          .single();

        expect(featuredError).toBeNull();
        if (featuredData) {
          testFeaturedToolIds.push(featuredData.id);

          // Query should include this tool (end_date >= now)
          const queryNow = new Date().toISOString();
          const { data: activeData, error: activeError } = await supabase
            .from('featured_tools')
            .select('id')
            .lte('start_date', queryNow)
            .gte('end_date', queryNow)
            .eq('id', featuredData.id);

          expect(activeError).toBeNull();
          expect(activeData?.length).toBeGreaterThan(0);
        }
      }
    });
  });
});
