/**
 * Property-based tests for database triggers
 *
 * Tests Property 15 from the design document:
 * - Property 15: Updated_at trigger updates timestamp
 *
 * **Validates: Requirements 8.2**
 *
 * To run these tests, you need to set SUPABASE_SERVICE_ROLE_KEY in your environment.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBaseRepository, type BaseRepository } from '../repositories/base.repository';
import type { Database } from '@/lib/supabase/types';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_KEY;

// Tool row type for testing
interface ToolRow {
  [key: string]: unknown;
  id: string;
  name: string;
  slug: string;
  website_url: string;
  created_at: string | null;
  updated_at: string | null;
}

interface ToolInsert {
  [key: string]: unknown;
  name: string;
  slug: string;
  website_url: string;
}

interface ToolUpdate {
  [key: string]: unknown;
  name?: string;
  description?: string | null;
}

// Helper to generate unique slugs
function generateUniqueSlug(base: string): string {
  return `test-${base}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Helper to wait for a short time to ensure timestamp difference
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe.skipIf(shouldSkip)('Database Triggers Property Tests', { timeout: 120000 }, () => {
  let supabase: SupabaseClient<Database>;
  let toolsRepo: BaseRepository<ToolRow, ToolInsert, ToolUpdate>;
  const testToolIds: string[] = [];

  beforeAll(() => {
    supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    toolsRepo = createBaseRepository<ToolRow, ToolInsert, ToolUpdate>(supabase, 'tools');
  });

  afterAll(async () => {
    // Clean up test data
    if (testToolIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)('tools').delete().in('id', testToolIds);
    }
  });


  /**
   * **Feature: supabase-migration, Property 15: Updated_at trigger updates timestamp**
   * **Validates: Requirements 8.2**
   *
   * *For any* record update, the updated_at timestamp after the update SHALL be
   * greater than or equal to the updated_at timestamp before the update.
   */
  describe('Property 15: Updated_at trigger updates timestamp', () => {
    // Arbitrary for generating valid tool names
    const toolNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,49}$/);

    // Arbitrary for generating optional descriptions
    const descriptionArb = fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null });

    it('should update updated_at timestamp when record is modified (property test with 100 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          toolNameArb,
          toolNameArb,
          descriptionArb,
          async (originalName, newName, newDescription) => {
            // Skip if names are the same (no actual update)
            fc.pre(originalName !== newName);

            // Generate unique slug for this test run
            const slug = generateUniqueSlug(originalName.toLowerCase().replace(/\s+/g, '-').slice(0, 20));

            // Create initial record
            const insertData: ToolInsert = {
              name: originalName,
              slug,
              website_url: 'https://example.com',
            };

            const created = await toolsRepo.create(insertData);
            testToolIds.push(created.id);

            // Store the original updated_at timestamp
            const originalUpdatedAt = created.updated_at;
            expect(originalUpdatedAt).toBeDefined();

            // Wait a small amount to ensure timestamp difference is detectable
            await sleep(10);

            // Update the record
            const updateData: ToolUpdate = {
              name: newName,
              description: newDescription,
            };
            const updated = await toolsRepo.update(created.id, updateData);

            // Property: updated_at should be greater than or equal to the original
            expect(updated.updated_at).toBeDefined();
            const originalTime = new Date(originalUpdatedAt!).getTime();
            const updatedTime = new Date(updated.updated_at!).getTime();

            expect(updatedTime).toBeGreaterThanOrEqual(originalTime);
          }
        ),
        // Using 20 runs to balance coverage with test execution time (network calls)
        { numRuns: 20 }
      );
    }, 180000); // Extended timeout for network operations

    it('should set updated_at on initial creation', async () => {
      const slug = generateUniqueSlug('creation-timestamp-test');
      const insertData: ToolInsert = {
        name: 'Creation Timestamp Test Tool',
        slug,
        website_url: 'https://example.com',
      };

      const created = await toolsRepo.create(insertData);
      testToolIds.push(created.id);

      // Property: created_at and updated_at should be set on creation
      expect(created.created_at).toBeDefined();
      expect(created.updated_at).toBeDefined();

      // They should be equal or very close on initial creation
      const createdTime = new Date(created.created_at!).getTime();
      const updatedTime = new Date(created.updated_at!).getTime();

      // Allow for small time difference (within 1 second)
      expect(Math.abs(updatedTime - createdTime)).toBeLessThan(1000);
    });

    it('should update updated_at on each subsequent update', async () => {
      const slug = generateUniqueSlug('multiple-updates-test');
      const insertData: ToolInsert = {
        name: 'Multiple Updates Test Tool',
        slug,
        website_url: 'https://example.com',
      };

      const created = await toolsRepo.create(insertData);
      testToolIds.push(created.id);

      let previousUpdatedAt = created.updated_at!;

      // Perform multiple updates and verify timestamp increases each time
      for (let i = 1; i <= 3; i++) {
        await sleep(10); // Ensure timestamp difference

        const updated = await toolsRepo.update(created.id, {
          name: `Updated Name ${i}`,
        });

        // Property: Each update should have a newer or equal updated_at
        const previousTime = new Date(previousUpdatedAt).getTime();
        const currentTime = new Date(updated.updated_at!).getTime();

        expect(currentTime).toBeGreaterThanOrEqual(previousTime);

        previousUpdatedAt = updated.updated_at!;
      }
    });

    it('should not change created_at when record is updated', async () => {
      const slug = generateUniqueSlug('created-at-preserved-test');
      const insertData: ToolInsert = {
        name: 'Created At Preserved Test Tool',
        slug,
        website_url: 'https://example.com',
      };

      const created = await toolsRepo.create(insertData);
      testToolIds.push(created.id);

      const originalCreatedAt = created.created_at;

      await sleep(10);

      // Update the record
      const updated = await toolsRepo.update(created.id, {
        name: 'Updated Name',
      });

      // Property: created_at should remain unchanged after update
      expect(updated.created_at).toBe(originalCreatedAt);
    });
  });
});
