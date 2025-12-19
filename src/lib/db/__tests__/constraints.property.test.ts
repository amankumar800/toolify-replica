/**
 * Property-based tests for database constraints
 * 
 * **Feature: supabase-migration, Property 18: Check constraints enforce valid ranges**
 * **Validates: Requirements 15.3**
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

describe.skipIf(shouldSkip)('Database Check Constraints', { timeout: 120000 }, () => {
  let supabase: SupabaseClient;
  const testToolIds: string[] = [];

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testToolIds.length > 0) {
      await supabase.from('tools').delete().in('id', testToolIds);
    }
  });

  /**
   * **Feature: supabase-migration, Property 18: Check constraints enforce valid ranges**
   * **Validates: Requirements 15.3**
   * 
   * *For any* tool insert or update, review_score values outside [0, 5] SHALL be rejected by the database.
   */
  describe('Property 18: Check constraints enforce valid ranges', () => {
    it('should reject review_score values below 0', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Use values within DECIMAL(2,1) range but below 0
          fc.double({ min: -9.9, max: -0.1 }),
          async (invalidScore) => {
            // Round to 1 decimal place to match DECIMAL(2,1)
            const roundedScore = Math.round(invalidScore * 10) / 10;
            const { error } = await supabase.from('tools').insert({
              name: 'Test Tool',
              slug: `test-tool-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              website_url: 'https://example.com',
              review_score: roundedScore
            });

            expect(error).not.toBeNull();
            // Check constraint violation
            expect(error?.message).toMatch(/check|violates/i);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject review_score values above 5', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Use values within DECIMAL(2,1) range but above 5
          fc.double({ min: 5.1, max: 9.9 }),
          async (invalidScore) => {
            // Round to 1 decimal place to match DECIMAL(2,1)
            const roundedScore = Math.round(invalidScore * 10) / 10;
            const { error } = await supabase.from('tools').insert({
              name: 'Test Tool',
              slug: `test-tool-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              website_url: 'https://example.com',
              review_score: roundedScore
            });

            expect(error).not.toBeNull();
            // Check constraint violation
            expect(error?.message).toMatch(/check|violates/i);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should accept review_score values within [0, 5]', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: 0, max: 5 }),
          async (validScore) => {
            // Round to 1 decimal place to match DECIMAL(2,1)
            const roundedScore = Math.round(validScore * 10) / 10;
            const slug = `test-tool-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            
            const { data, error } = await supabase.from('tools').insert({
              name: 'Test Tool',
              slug,
              website_url: 'https://example.com',
              review_score: roundedScore
            }).select('id');

            expect(error).toBeNull();
            expect(data).not.toBeNull();
            
            // Track for cleanup
            if (data && data[0]) {
              testToolIds.push(data[0].id);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject negative saved_count values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: -1000, max: -1 }),
          async (invalidCount) => {
            const { error } = await supabase.from('tools').insert({
              name: 'Test Tool',
              slug: `test-tool-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              website_url: 'https://example.com',
              saved_count: invalidCount
            });

            expect(error).not.toBeNull();
            expect(error?.message).toContain('check');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject negative review_count values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: -1000, max: -1 }),
          async (invalidCount) => {
            const { error } = await supabase.from('tools').insert({
              name: 'Test Tool',
              slug: `test-tool-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              website_url: 'https://example.com',
              review_count: invalidCount
            });

            expect(error).not.toBeNull();
            expect(error?.message).toContain('check');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject invalid pricing values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(
            s => !['Free', 'Freemium', 'Paid', 'Free Trial', 'Contact for Pricing'].includes(s)
          ),
          async (invalidPricing) => {
            const { error } = await supabase.from('tools').insert({
              name: 'Test Tool',
              slug: `test-tool-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              website_url: 'https://example.com',
              pricing: invalidPricing
            });

            expect(error).not.toBeNull();
            expect(error?.message).toContain('check');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should accept valid pricing values', async () => {
      const validPricingValues = ['Free', 'Freemium', 'Paid', 'Free Trial', 'Contact for Pricing'];
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...validPricingValues),
          async (validPricing) => {
            const slug = `test-tool-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            
            const { data, error } = await supabase.from('tools').insert({
              name: 'Test Tool',
              slug,
              website_url: 'https://example.com',
              pricing: validPricing
            }).select('id');

            expect(error).toBeNull();
            expect(data).not.toBeNull();
            
            // Track for cleanup
            if (data && data[0]) {
              testToolIds.push(data[0].id);
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
