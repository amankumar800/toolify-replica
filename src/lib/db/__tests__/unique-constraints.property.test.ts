/**
 * Property-based tests for unique constraints
 *
 * **Feature: database-schema-redesign, Property 5: Unique Constraint Enforcement**
 * **Validates: Requirements 5.1, 8.2**
 *
 * *For any* column or column combination with a UNIQUE constraint,
 * inserting duplicate values SHALL be rejected.
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

describe.skipIf(shouldSkip)('Database Unique Constraints', { timeout: 120000 }, () => {
  let supabase: SupabaseClient;
  const testToolIds: string[] = [];
  const testCategoryIds: string[] = [];
  const testCategoryGroupIds: string[] = [];
  const testUserFavoriteIds: string[] = [];

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  });

  afterAll(async () => {
    // Clean up test data in reverse order of dependencies
    if (testUserFavoriteIds.length > 0) {
      await supabase.from('user_favorites').delete().in('id', testUserFavoriteIds);
    }
    if (testToolIds.length > 0) {
      await supabase.from('tools').delete().in('id', testToolIds);
    }
    if (testCategoryIds.length > 0) {
      await supabase.from('categories').delete().in('id', testCategoryIds);
    }
    if (testCategoryGroupIds.length > 0) {
      await supabase.from('category_groups').delete().in('id', testCategoryGroupIds);
    }
  });

  /**
   * **Feature: database-schema-redesign, Property 5: Unique Constraint Enforcement**
   * **Validates: Requirements 5.1, 8.2**
   *
   * *For any* attempt to insert a record with a slug that already exists,
   * the database SHALL reject the insert with a constraint violation error.
   */
  describe('Property 5: Unique Constraint Enforcement', () => {
    it('should reject duplicate tool slugs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 50 }).map(s => s.replace(/[^a-z0-9-]/gi, '-').toLowerCase()),
          async (slug) => {
            const uniqueSlug = `test-${slug}-${Date.now()}`;
            
            // First insert should succeed
            const { data: firstData, error: firstError } = await supabase.from('tools').insert({
              name: 'Test Tool 1',
              slug: uniqueSlug,
              website_url: 'https://example.com'
            }).select('id');

            expect(firstError).toBeNull();
            expect(firstData).not.toBeNull();
            
            if (firstData && firstData[0]) {
              testToolIds.push(firstData[0].id);
            }

            // Second insert with same slug should fail
            const { error: secondError } = await supabase.from('tools').insert({
              name: 'Test Tool 2',
              slug: uniqueSlug,
              website_url: 'https://example2.com'
            });

            expect(secondError).not.toBeNull();
            expect(secondError?.message).toContain('duplicate');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject duplicate category slugs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 50 }).map(s => s.replace(/[^a-z0-9-]/gi, '-').toLowerCase()),
          async (slug) => {
            const uniqueSlug = `test-cat-${slug}-${Date.now()}`;
            
            // First insert should succeed
            const { data: firstData, error: firstError } = await supabase.from('categories').insert({
              name: 'Test Category 1',
              slug: uniqueSlug
            }).select('id');

            expect(firstError).toBeNull();
            expect(firstData).not.toBeNull();
            
            if (firstData && firstData[0]) {
              testCategoryIds.push(firstData[0].id);
            }

            // Second insert with same slug should fail
            const { error: secondError } = await supabase.from('categories').insert({
              name: 'Test Category 2',
              slug: uniqueSlug
            });

            expect(secondError).not.toBeNull();
            expect(secondError?.message).toContain('duplicate');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject duplicate category_groups names', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 50 }),
          async (name) => {
            const uniqueName = `Test Group ${name} ${Date.now()}`;
            
            // First insert should succeed
            const { data: firstData, error: firstError } = await supabase.from('category_groups').insert({
              name: uniqueName
            }).select('id');

            expect(firstError).toBeNull();
            expect(firstData).not.toBeNull();
            
            if (firstData && firstData[0]) {
              testCategoryGroupIds.push(firstData[0].id);
            }

            // Second insert with same name should fail
            const { error: secondError } = await supabase.from('category_groups').insert({
              name: uniqueName
            });

            expect(secondError).not.toBeNull();
            expect(secondError?.message).toContain('duplicate');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should allow different slugs for tools', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            fc.string({ minLength: 3, maxLength: 20 }).map(s => s.replace(/[^a-z0-9-]/gi, '-').toLowerCase()),
            fc.string({ minLength: 3, maxLength: 20 }).map(s => s.replace(/[^a-z0-9-]/gi, '-').toLowerCase())
          ).filter(([a, b]) => a !== b),
          async ([slug1, slug2]) => {
            const timestamp = Date.now();
            const uniqueSlug1 = `test-${slug1}-${timestamp}-a`;
            const uniqueSlug2 = `test-${slug2}-${timestamp}-b`;
            
            // First insert should succeed
            const { data: firstData, error: firstError } = await supabase.from('tools').insert({
              name: 'Test Tool 1',
              slug: uniqueSlug1,
              website_url: 'https://example.com'
            }).select('id');

            expect(firstError).toBeNull();
            
            if (firstData && firstData[0]) {
              testToolIds.push(firstData[0].id);
            }

            // Second insert with different slug should also succeed
            const { data: secondData, error: secondError } = await supabase.from('tools').insert({
              name: 'Test Tool 2',
              slug: uniqueSlug2,
              website_url: 'https://example2.com'
            }).select('id');

            expect(secondError).toBeNull();
            expect(secondData).not.toBeNull();
            
            if (secondData && secondData[0]) {
              testToolIds.push(secondData[0].id);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    // Requirement 5.1: tool_categories composite primary key
    it('should reject duplicate tool_categories entries (Req 5.1)', async () => {
      // Create a tool
      const toolSlug = `test-tool-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const { data: toolData, error: toolError } = await supabase.from('tools').insert({
        name: 'Test Tool for Unique',
        slug: toolSlug,
        website_url: 'https://example.com'
      }).select('id');

      expect(toolError).toBeNull();
      if (toolData && toolData[0]) {
        testToolIds.push(toolData[0].id);
      }

      // Create a category
      const categorySlug = `test-cat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const { data: categoryData, error: categoryError } = await supabase.from('categories').insert({
        name: 'Test Category for Unique',
        slug: categorySlug
      }).select('id');

      expect(categoryError).toBeNull();
      if (categoryData && categoryData[0]) {
        testCategoryIds.push(categoryData[0].id);
      }

      if (toolData && toolData[0] && categoryData && categoryData[0]) {
        // First insert should succeed
        const { error: firstLinkError } = await supabase.from('tool_categories').insert({
          tool_id: toolData[0].id,
          category_id: categoryData[0].id
        });

        expect(firstLinkError).toBeNull();

        // Second insert with same tool_id and category_id should fail
        const { error: secondLinkError } = await supabase.from('tool_categories').insert({
          tool_id: toolData[0].id,
          category_id: categoryData[0].id
        });

        expect(secondLinkError).not.toBeNull();
        expect(secondLinkError?.message).toMatch(/duplicate|unique|already exists/i);
      }
    });

    // Requirement 8.2: user_favorites unique constraint on (user_email, tool_id)
    it('should reject duplicate user_favorites entries (Req 8.2)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 3, maxLength: 50 }).map(s => s.replace(/[^a-z0-9-]/gi, '-').toLowerCase()),
          async (email, toolId) => {
            const uniqueToolId = `test-${toolId}-${Date.now()}`;
            
            // First insert should succeed
            const { data: firstData, error: firstError } = await supabase.from('user_favorites').insert({
              user_email: email,
              tool_id: uniqueToolId,
              tool_name: 'Test Tool'
            }).select('id');

            expect(firstError).toBeNull();
            expect(firstData).not.toBeNull();
            
            if (firstData && firstData[0]) {
              testUserFavoriteIds.push(firstData[0].id);
            }

            // Second insert with same user_email and tool_id should fail
            const { error: secondError } = await supabase.from('user_favorites').insert({
              user_email: email,
              tool_id: uniqueToolId,
              tool_name: 'Test Tool 2'
            });

            expect(secondError).not.toBeNull();
            expect(secondError?.message).toMatch(/duplicate|unique|already exists/i);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should allow same user to favorite different tools (Req 8.2)', async () => {
      const email = `test-${Date.now()}@example.com`;
      const toolId1 = `test-tool-1-${Date.now()}`;
      const toolId2 = `test-tool-2-${Date.now()}`;

      // First favorite should succeed
      const { data: firstData, error: firstError } = await supabase.from('user_favorites').insert({
        user_email: email,
        tool_id: toolId1,
        tool_name: 'Test Tool 1'
      }).select('id');

      expect(firstError).toBeNull();
      if (firstData && firstData[0]) {
        testUserFavoriteIds.push(firstData[0].id);
      }

      // Second favorite with different tool_id should succeed
      const { data: secondData, error: secondError } = await supabase.from('user_favorites').insert({
        user_email: email,
        tool_id: toolId2,
        tool_name: 'Test Tool 2'
      }).select('id');

      expect(secondError).toBeNull();
      expect(secondData).not.toBeNull();
      if (secondData && secondData[0]) {
        testUserFavoriteIds.push(secondData[0].id);
      }
    });

    it('should allow different users to favorite same tool (Req 8.2)', async () => {
      const email1 = `test-user-1-${Date.now()}@example.com`;
      const email2 = `test-user-2-${Date.now()}@example.com`;
      const toolId = `test-tool-${Date.now()}`;

      // First user favorite should succeed
      const { data: firstData, error: firstError } = await supabase.from('user_favorites').insert({
        user_email: email1,
        tool_id: toolId,
        tool_name: 'Test Tool'
      }).select('id');

      expect(firstError).toBeNull();
      if (firstData && firstData[0]) {
        testUserFavoriteIds.push(firstData[0].id);
      }

      // Second user favorite with same tool_id should succeed
      const { data: secondData, error: secondError } = await supabase.from('user_favorites').insert({
        user_email: email2,
        tool_id: toolId,
        tool_name: 'Test Tool'
      }).select('id');

      expect(secondError).toBeNull();
      expect(secondData).not.toBeNull();
      if (secondData && secondData[0]) {
        testUserFavoriteIds.push(secondData[0].id);
      }
    });
  });
});
