/**
 * Property-based tests for unique constraints
 * 
 * **Feature: supabase-migration, Property 17: Unique constraints prevent duplicates**
 * **Validates: Requirements 15.2**
 * 
 * To run these tests, you need to set SUPABASE_SERVICE_ROLE_KEY in your environment.
 * Get it from: https://supabase.com/dashboard/project/sxepzgwkbsynilkronsj/settings/api
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

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  });

  afterAll(async () => {
    // Clean up test data in reverse order of dependencies
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
   * **Feature: supabase-migration, Property 17: Unique constraints prevent duplicates**
   * **Validates: Requirements 15.2**
   * 
   * *For any* attempt to insert a record with a slug that already exists, 
   * the database SHALL reject the insert with a constraint violation error.
   */
  describe('Property 17: Unique constraints prevent duplicates', () => {
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
  });
});
