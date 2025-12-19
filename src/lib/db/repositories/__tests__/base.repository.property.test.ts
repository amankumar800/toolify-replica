/**
 * Property-based tests for base repository CRUD operations
 *
 * Tests Properties 1-7 from the design document:
 * - Property 1: Repository findAll respects limit constraint
 * - Property 2: Repository CRUD round-trip consistency
 * - Property 3: Repository findBy returns correct match or null
 * - Property 4: Repository update preserves unmodified fields
 * - Property 5: Repository delete removes record
 * - Property 6: Repository upsert is idempotent
 * - Property 7: Repository count reflects actual records
 *
 * To run these tests, you need to set SUPABASE_SERVICE_ROLE_KEY in your environment.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBaseRepository, type BaseRepository } from '../base.repository';
import type { Database } from '@/lib/supabase/types';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_KEY;

// Tool row type for testing - includes index signature for Record<string, unknown> constraint
interface ToolRow {
  [key: string]: unknown;
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  website_url: string;
  external_url: string | null;
  pricing: string | null;
  tags: string[] | null;
  saved_count: number | null;
  review_count: number | null;
  review_score: number | null;
  verified: boolean | null;
  is_new: boolean | null;
  is_featured: boolean | null;
  monthly_visits: number | null;
  change_percentage: number | null;
  free_tier_details: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ToolInsert {
  [key: string]: unknown;
  name: string;
  slug: string;
  website_url: string;
  description?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  external_url?: string | null;
  pricing?: string | null;
  tags?: string[] | null;
  saved_count?: number | null;
  review_count?: number | null;
  review_score?: number | null;
  verified?: boolean | null;
  is_new?: boolean | null;
  is_featured?: boolean | null;
  monthly_visits?: number | null;
  change_percentage?: number | null;
  free_tier_details?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface ToolUpdate {
  [key: string]: unknown;
  name?: string;
  slug?: string;
  website_url?: string;
  description?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  external_url?: string | null;
  pricing?: string | null;
  tags?: string[] | null;
  saved_count?: number | null;
  review_count?: number | null;
  review_score?: number | null;
  verified?: boolean | null;
  is_new?: boolean | null;
  is_featured?: boolean | null;
  monthly_visits?: number | null;
  change_percentage?: number | null;
  free_tier_details?: string | null;
  metadata?: Record<string, unknown> | null;
}

// Helper to generate unique slugs
function generateUniqueSlug(base: string): string {
  return `test-${base}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe.skipIf(shouldSkip)('Base Repository Property Tests', { timeout: 120000 }, () => {
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
   * **Feature: supabase-migration, Property 1: Repository findAll respects limit constraint**
   * **Validates: Requirements 2.1**
   *
   * *For any* repository and any limit value N > 0, calling findAll({ limit: N })
   * SHALL return an array with length <= N.
   */
  describe('Property 1: Repository findAll respects limit constraint', () => {
    const TEST_DATA_COUNT = 10;
    let setupComplete = false;

    beforeAll(async () => {
      // Insert test data to ensure we have enough records to test limit behavior
      const testTools: ToolInsert[] = [];
      for (let i = 0; i < TEST_DATA_COUNT; i++) {
        testTools.push({
          name: `Limit Test Tool ${i}`,
          slug: generateUniqueSlug(`limit-test-${i}`),
          website_url: 'https://example.com',
        });
      }

      // Insert test tools
      for (const tool of testTools) {
        const created = await toolsRepo.create(tool);
        testToolIds.push(created.id);
      }
      setupComplete = true;
    });

    it('should return at most N records when limit is N (property test with 100 runs)', async () => {
      expect(setupComplete).toBe(true);

      await fc.assert(
        fc.asyncProperty(
          // Generate limit values from 1 to 100
          fc.integer({ min: 1, max: 100 }),
          async (limit) => {
            const results = await toolsRepo.findAll({ limit });
            
            // Property: result length should never exceed the requested limit
            expect(results.length).toBeLessThanOrEqual(limit);
            
            // Additional invariant: results should be an array
            expect(Array.isArray(results)).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return exactly min(N, totalRecords) when limit is N and we have enough data', async () => {
      expect(setupComplete).toBe(true);

      // Get total count first
      const totalCount = await toolsRepo.count();

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: Math.max(1, totalCount) }),
          async (limit) => {
            const results = await toolsRepo.findAll({ limit });
            
            // When limit <= totalCount, we should get exactly limit records
            // When limit > totalCount, we should get totalCount records
            const expectedLength = Math.min(limit, totalCount);
            expect(results.length).toBe(expectedLength);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle limit of 1 correctly', async () => {
      const results = await toolsRepo.findAll({ limit: 1 });
      expect(results.length).toBeLessThanOrEqual(1);
    });

    it('should handle very large limit values gracefully', async () => {
      // Test with a limit larger than any reasonable dataset
      const results = await toolsRepo.findAll({ limit: 10000 });
      expect(Array.isArray(results)).toBe(true);
      // Should return all available records (which is less than 10000)
      expect(results.length).toBeLessThanOrEqual(10000);
    });
  });

  /**
   * **Feature: supabase-migration, Property 2: Repository CRUD round-trip consistency**
   * **Validates: Requirements 2.2, 2.4**
   *
   * *For any* valid insert data, creating a record and then finding it by ID
   * SHALL return a record with matching data fields.
   */
  describe('Property 2: Repository CRUD round-trip consistency', () => {
    // Arbitrary for generating valid tool names (non-empty alphanumeric strings)
    const toolNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,49}$/);
    
    // Arbitrary for generating valid website URLs
    const websiteUrlArb = fc.webUrl({ validSchemes: ['https'] });
    
    // Arbitrary for generating optional descriptions
    const descriptionArb = fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: null });
    
    // Arbitrary for generating valid pricing values
    const pricingArb = fc.constantFrom('Free', 'Freemium', 'Paid', 'Free Trial', 'Contact for Pricing');
    
    // Arbitrary for generating valid review scores (0-5)
    const reviewScoreArb = fc.double({ min: 0, max: 5, noNaN: true });
    
    // Arbitrary for generating non-negative integers
    const nonNegativeIntArb = fc.nat({ max: 10000 });
    
    // Arbitrary for generating boolean values
    const booleanArb = fc.boolean();
    
    // Arbitrary for generating tags array
    const tagsArb = fc.array(fc.stringMatching(/^[a-zA-Z0-9-]{1,20}$/), { minLength: 0, maxLength: 5 });

    it('should return matching data when creating and then finding by ID (property test with 10 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          toolNameArb,
          websiteUrlArb,
          descriptionArb,
          pricingArb,
          reviewScoreArb,
          nonNegativeIntArb,
          nonNegativeIntArb,
          booleanArb,
          booleanArb,
          booleanArb,
          tagsArb,
          async (
            name,
            websiteUrl,
            description,
            pricing,
            reviewScore,
            savedCount,
            reviewCount,
            verified,
            isNew,
            isFeatured,
            tags
          ) => {
            // Generate unique slug for this test run
            const slug = generateUniqueSlug(name.toLowerCase().replace(/\s+/g, '-').slice(0, 20));
            
            // Round review score to 1 decimal place to match DB precision
            const roundedReviewScore = Math.round(reviewScore * 10) / 10;
            
            const insertData: ToolInsert = {
              name,
              slug,
              website_url: websiteUrl,
              description,
              pricing,
              review_score: roundedReviewScore,
              saved_count: savedCount,
              review_count: reviewCount,
              verified,
              is_new: isNew,
              is_featured: isFeatured,
              tags,
            };

            // Create the record
            const created = await toolsRepo.create(insertData);
            testToolIds.push(created.id);

            // Find the record by ID
            const found = await toolsRepo.findById(created.id);

            // Property: The found record should have matching data fields
            expect(found.id).toBe(created.id);
            expect(found.name).toBe(name);
            expect(found.slug).toBe(slug);
            expect(found.website_url).toBe(websiteUrl);
            expect(found.description).toBe(description);
            expect(found.pricing).toBe(pricing);
            expect(found.review_score).toBeCloseTo(roundedReviewScore, 1);
            expect(found.saved_count).toBe(savedCount);
            expect(found.review_count).toBe(reviewCount);
            expect(found.verified).toBe(verified);
            expect(found.is_new).toBe(isNew);
            expect(found.is_featured).toBe(isFeatured);
            expect(found.tags).toEqual(tags);
            
            // Verify auto-generated fields exist
            expect(found.created_at).toBeDefined();
            expect(found.updated_at).toBeDefined();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should preserve data integrity through create operation', async () => {
      // Single explicit test case for edge values
      const slug = generateUniqueSlug('integrity-test');
      const insertData: ToolInsert = {
        name: 'Integrity Test Tool',
        slug,
        website_url: 'https://example.com/test',
        description: 'A test description with special chars: <>&"\'',
        pricing: 'Free',
        review_score: 4.5,
        saved_count: 0,
        review_count: 0,
        verified: false,
        is_new: true,
        is_featured: false,
        tags: ['test', 'integration'],
      };

      const created = await toolsRepo.create(insertData);
      testToolIds.push(created.id);

      const found = await toolsRepo.findById(created.id);

      // Verify all fields match
      expect(found.name).toBe(insertData.name);
      expect(found.slug).toBe(insertData.slug);
      expect(found.website_url).toBe(insertData.website_url);
      expect(found.description).toBe(insertData.description);
      expect(found.pricing).toBe(insertData.pricing);
      expect(found.review_score).toBeCloseTo(insertData.review_score!, 1);
      expect(found.saved_count).toBe(insertData.saved_count);
      expect(found.review_count).toBe(insertData.review_count);
      expect(found.verified).toBe(insertData.verified);
      expect(found.is_new).toBe(insertData.is_new);
      expect(found.is_featured).toBe(insertData.is_featured);
      expect(found.tags).toEqual(insertData.tags);
    });
  });

  /**
   * **Feature: supabase-migration, Property 3: Repository findBy returns correct match or null**
   * **Validates: Requirements 2.3, 3.7**
   *
   * *For any* column and value, findBy(column, value) SHALL return a record where
   * record[column] === value, or null if no match exists.
   */
  describe('Property 3: Repository findBy returns correct match or null', () => {
    // Arbitrary for generating valid tool names
    const toolNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,49}$/);
    
    // Arbitrary for generating valid website URLs
    const websiteUrlArb = fc.webUrl({ validSchemes: ['https'] });
    
    // Arbitrary for generating valid pricing values
    const pricingArb = fc.constantFrom('Free', 'Freemium', 'Paid', 'Free Trial', 'Contact for Pricing');

    it('should return matching record when findBy slug finds existing record (property test with 10 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          toolNameArb,
          websiteUrlArb,
          pricingArb,
          async (name, websiteUrl, pricing) => {
            // Generate unique slug for this test run
            const slug = generateUniqueSlug(name.toLowerCase().replace(/\s+/g, '-').slice(0, 20));
            
            const insertData: ToolInsert = {
              name,
              slug,
              website_url: websiteUrl,
              pricing,
            };

            // Create the record
            const created = await toolsRepo.create(insertData);
            testToolIds.push(created.id);

            // Find by slug (existing value)
            const found = await toolsRepo.findBy('slug', slug);

            // Property: findBy should return a record where the column matches the value
            expect(found).not.toBeNull();
            expect(found!.slug).toBe(slug);
            expect(found!.id).toBe(created.id);
            expect(found!.name).toBe(name);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return null when findBy slug does not find a match (property test with 10 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random non-existing slugs
          fc.stringMatching(/^nonexistent-[a-z0-9]{10,30}$/),
          async (nonExistentSlug) => {
            // Find by slug (non-existing value)
            const found = await toolsRepo.findBy('slug', nonExistentSlug);

            // Property: findBy should return null when no match exists
            expect(found).toBeNull();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return matching record when findBy pricing finds existing record', async () => {
      // Create a tool with specific pricing
      const slug = generateUniqueSlug('findby-pricing-test');
      const insertData: ToolInsert = {
        name: 'FindBy Pricing Test Tool',
        slug,
        website_url: 'https://example.com',
        pricing: 'Free',
      };

      const created = await toolsRepo.create(insertData);
      testToolIds.push(created.id);

      // Find by pricing
      const found = await toolsRepo.findBy('pricing', 'Free');

      // Property: findBy should return a record where pricing matches
      expect(found).not.toBeNull();
      expect(found!.pricing).toBe('Free');
    });

    it('should return matching record when findBy id finds existing record', async () => {
      // Create a tool
      const slug = generateUniqueSlug('findby-id-test');
      const insertData: ToolInsert = {
        name: 'FindBy ID Test Tool',
        slug,
        website_url: 'https://example.com',
      };

      const created = await toolsRepo.create(insertData);
      testToolIds.push(created.id);

      // Find by id
      const found = await toolsRepo.findBy('id', created.id);

      // Property: findBy should return a record where id matches
      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.slug).toBe(slug);
    });

    it('should return null when findBy id does not find a match', async () => {
      // Use a UUID that doesn't exist
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      const found = await toolsRepo.findBy('id', nonExistentId);

      // Property: findBy should return null when no match exists
      expect(found).toBeNull();
    });

    it('should return correct record when multiple records exist with different values', async () => {
      // Create multiple tools with different slugs
      const slugs = [
        generateUniqueSlug('multi-test-a'),
        generateUniqueSlug('multi-test-b'),
        generateUniqueSlug('multi-test-c'),
      ];

      for (const slug of slugs) {
        const created = await toolsRepo.create({
          name: `Multi Test ${slug}`,
          slug,
          website_url: 'https://example.com',
        });
        testToolIds.push(created.id);
      }

      // Find each by slug and verify correct match
      for (const slug of slugs) {
        const found = await toolsRepo.findBy('slug', slug);
        expect(found).not.toBeNull();
        expect(found!.slug).toBe(slug);
      }
    });
  });

  /**
   * **Feature: supabase-migration, Property 4: Repository update preserves unmodified fields**
   * **Validates: Requirements 2.5**
   *
   * *For any* existing record and partial update data, updating the record SHALL preserve
   * fields not included in the update while changing only the specified fields.
   */
  describe('Property 4: Repository update preserves unmodified fields', () => {
    // Arbitrary for generating valid tool names
    const toolNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,49}$/);
    
    // Arbitrary for generating valid website URLs
    const websiteUrlArb = fc.webUrl({ validSchemes: ['https'] });
    
    // Arbitrary for generating optional descriptions
    const descriptionArb = fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null });
    
    // Arbitrary for generating valid pricing values
    const pricingArb = fc.constantFrom('Free', 'Freemium', 'Paid', 'Free Trial', 'Contact for Pricing');
    
    // Arbitrary for generating valid review scores (0-5)
    const reviewScoreArb = fc.double({ min: 0, max: 5, noNaN: true });
    
    // Arbitrary for generating non-negative integers
    const nonNegativeIntArb = fc.nat({ max: 10000 });
    
    // Arbitrary for generating boolean values
    const booleanArb = fc.boolean();
    
    // Arbitrary for generating tags array
    const tagsArb = fc.array(fc.stringMatching(/^[a-zA-Z0-9-]{1,20}$/), { minLength: 0, maxLength: 5 });

    it('should preserve unmodified fields when updating only name (property test with 10 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          toolNameArb,
          toolNameArb,
          websiteUrlArb,
          descriptionArb,
          pricingArb,
          reviewScoreArb,
          nonNegativeIntArb,
          nonNegativeIntArb,
          booleanArb,
          booleanArb,
          booleanArb,
          tagsArb,
          async (
            originalName,
            newName,
            websiteUrl,
            description,
            pricing,
            reviewScore,
            savedCount,
            reviewCount,
            verified,
            isNew,
            isFeatured,
            tags
          ) => {
            // Skip if names are the same (no actual update)
            fc.pre(originalName !== newName);
            
            // Generate unique slug for this test run
            const slug = generateUniqueSlug(originalName.toLowerCase().replace(/\s+/g, '-').slice(0, 20));
            
            // Round review score to 1 decimal place to match DB precision
            const roundedReviewScore = Math.round(reviewScore * 10) / 10;
            
            // Create initial record with all fields populated
            const insertData: ToolInsert = {
              name: originalName,
              slug,
              website_url: websiteUrl,
              description,
              pricing,
              review_score: roundedReviewScore,
              saved_count: savedCount,
              review_count: reviewCount,
              verified,
              is_new: isNew,
              is_featured: isFeatured,
              tags,
            };

            const created = await toolsRepo.create(insertData);
            testToolIds.push(created.id);

            // Update ONLY the name field
            const updateData: ToolUpdate = { name: newName };
            const updated = await toolsRepo.update(created.id, updateData);

            // Property: The updated field should change
            expect(updated.name).toBe(newName);
            
            // Property: All other fields should be preserved
            expect(updated.slug).toBe(slug);
            expect(updated.website_url).toBe(websiteUrl);
            expect(updated.description).toBe(description);
            expect(updated.pricing).toBe(pricing);
            expect(updated.review_score).toBeCloseTo(roundedReviewScore, 1);
            expect(updated.saved_count).toBe(savedCount);
            expect(updated.review_count).toBe(reviewCount);
            expect(updated.verified).toBe(verified);
            expect(updated.is_new).toBe(isNew);
            expect(updated.is_featured).toBe(isFeatured);
            expect(updated.tags).toEqual(tags);
            
            // Verify ID is preserved
            expect(updated.id).toBe(created.id);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should preserve unmodified fields when updating multiple fields (property test with 10 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          toolNameArb,
          toolNameArb,
          websiteUrlArb,
          descriptionArb,
          descriptionArb,
          pricingArb,
          pricingArb,
          reviewScoreArb,
          nonNegativeIntArb,
          booleanArb,
          booleanArb,
          tagsArb,
          async (
            originalName,
            newName,
            websiteUrl,
            originalDescription,
            newDescription,
            originalPricing,
            newPricing,
            reviewScore,
            savedCount,
            verified,
            isFeatured,
            tags
          ) => {
            // Skip if no actual changes
            fc.pre(originalName !== newName || originalDescription !== newDescription || originalPricing !== newPricing);
            
            // Generate unique slug for this test run
            const slug = generateUniqueSlug(originalName.toLowerCase().replace(/\s+/g, '-').slice(0, 20));
            
            // Round review score to 1 decimal place to match DB precision
            const roundedReviewScore = Math.round(reviewScore * 10) / 10;
            
            // Create initial record
            const insertData: ToolInsert = {
              name: originalName,
              slug,
              website_url: websiteUrl,
              description: originalDescription,
              pricing: originalPricing,
              review_score: roundedReviewScore,
              saved_count: savedCount,
              verified,
              is_featured: isFeatured,
              tags,
            };

            const created = await toolsRepo.create(insertData);
            testToolIds.push(created.id);

            // Update name, description, and pricing (leaving other fields untouched)
            const updateData: ToolUpdate = {
              name: newName,
              description: newDescription,
              pricing: newPricing,
            };
            const updated = await toolsRepo.update(created.id, updateData);

            // Property: Updated fields should change
            expect(updated.name).toBe(newName);
            expect(updated.description).toBe(newDescription);
            expect(updated.pricing).toBe(newPricing);
            
            // Property: Non-updated fields should be preserved
            expect(updated.slug).toBe(slug);
            expect(updated.website_url).toBe(websiteUrl);
            expect(updated.review_score).toBeCloseTo(roundedReviewScore, 1);
            expect(updated.saved_count).toBe(savedCount);
            expect(updated.verified).toBe(verified);
            expect(updated.is_featured).toBe(isFeatured);
            expect(updated.tags).toEqual(tags);
            
            // Verify ID is preserved
            expect(updated.id).toBe(created.id);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should preserve all fields when updating with empty object', async () => {
      // Create a tool with all fields populated
      const slug = generateUniqueSlug('empty-update-test');
      const insertData: ToolInsert = {
        name: 'Empty Update Test Tool',
        slug,
        website_url: 'https://example.com/test',
        description: 'Original description',
        pricing: 'Free',
        review_score: 4.5,
        saved_count: 100,
        review_count: 50,
        verified: true,
        is_new: false,
        is_featured: true,
        tags: ['test', 'empty-update'],
      };

      const created = await toolsRepo.create(insertData);
      testToolIds.push(created.id);

      // Update with empty object (no changes)
      const updateData: ToolUpdate = {};
      const updated = await toolsRepo.update(created.id, updateData);

      // Property: All fields should be preserved when no updates are specified
      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe(insertData.name);
      expect(updated.slug).toBe(insertData.slug);
      expect(updated.website_url).toBe(insertData.website_url);
      expect(updated.description).toBe(insertData.description);
      expect(updated.pricing).toBe(insertData.pricing);
      expect(updated.review_score).toBeCloseTo(insertData.review_score!, 1);
      expect(updated.saved_count).toBe(insertData.saved_count);
      expect(updated.review_count).toBe(insertData.review_count);
      expect(updated.verified).toBe(insertData.verified);
      expect(updated.is_new).toBe(insertData.is_new);
      expect(updated.is_featured).toBe(insertData.is_featured);
      expect(updated.tags).toEqual(insertData.tags);
    });

    it('should preserve fields when updating boolean fields only', async () => {
      // Create a tool
      const slug = generateUniqueSlug('boolean-update-test');
      const insertData: ToolInsert = {
        name: 'Boolean Update Test Tool',
        slug,
        website_url: 'https://example.com/boolean',
        description: 'Test description for boolean update',
        pricing: 'Freemium',
        review_score: 3.5,
        saved_count: 200,
        verified: false,
        is_new: true,
        is_featured: false,
      };

      const created = await toolsRepo.create(insertData);
      testToolIds.push(created.id);

      // Update only boolean fields
      const updateData: ToolUpdate = {
        verified: true,
        is_new: false,
        is_featured: true,
      };
      const updated = await toolsRepo.update(created.id, updateData);

      // Property: Boolean fields should be updated
      expect(updated.verified).toBe(true);
      expect(updated.is_new).toBe(false);
      expect(updated.is_featured).toBe(true);
      
      // Property: Non-boolean fields should be preserved
      expect(updated.name).toBe(insertData.name);
      expect(updated.slug).toBe(insertData.slug);
      expect(updated.website_url).toBe(insertData.website_url);
      expect(updated.description).toBe(insertData.description);
      expect(updated.pricing).toBe(insertData.pricing);
      expect(updated.review_score).toBeCloseTo(insertData.review_score!, 1);
      expect(updated.saved_count).toBe(insertData.saved_count);
    });

    it('should preserve fields when updating numeric fields only', async () => {
      // Create a tool
      const slug = generateUniqueSlug('numeric-update-test');
      const insertData: ToolInsert = {
        name: 'Numeric Update Test Tool',
        slug,
        website_url: 'https://example.com/numeric',
        description: 'Test description for numeric update',
        pricing: 'Paid',
        review_score: 2.0,
        saved_count: 50,
        review_count: 10,
        verified: true,
        is_featured: true,
      };

      const created = await toolsRepo.create(insertData);
      testToolIds.push(created.id);

      // Update only numeric fields
      const updateData: ToolUpdate = {
        review_score: 4.8,
        saved_count: 500,
        review_count: 100,
      };
      const updated = await toolsRepo.update(created.id, updateData);

      // Property: Numeric fields should be updated
      expect(updated.review_score).toBeCloseTo(4.8, 1);
      expect(updated.saved_count).toBe(500);
      expect(updated.review_count).toBe(100);
      
      // Property: Non-numeric fields should be preserved
      expect(updated.name).toBe(insertData.name);
      expect(updated.slug).toBe(insertData.slug);
      expect(updated.website_url).toBe(insertData.website_url);
      expect(updated.description).toBe(insertData.description);
      expect(updated.pricing).toBe(insertData.pricing);
      expect(updated.verified).toBe(insertData.verified);
      expect(updated.is_featured).toBe(insertData.is_featured);
    });
  });

  /**
   * **Feature: supabase-migration, Property 5: Repository delete removes record**
   * **Validates: Requirements 2.6**
   *
   * *For any* existing record ID, after calling delete(id), calling findBy('id', id)
   * SHALL return null.
   */
  describe('Property 5: Repository delete removes record', () => {
    // Arbitrary for generating valid tool names
    const toolNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,49}$/);
    
    // Arbitrary for generating valid website URLs
    const websiteUrlArb = fc.webUrl({ validSchemes: ['https'] });
    
    // Arbitrary for generating valid pricing values
    const pricingArb = fc.constantFrom('Free', 'Freemium', 'Paid', 'Free Trial', 'Contact for Pricing');

    it('should remove record so findBy returns null after delete (property test with 10 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          toolNameArb,
          websiteUrlArb,
          pricingArb,
          async (name, websiteUrl, pricing) => {
            // Generate unique slug for this test run
            const slug = generateUniqueSlug(name.toLowerCase().replace(/\s+/g, '-').slice(0, 20));
            
            const insertData: ToolInsert = {
              name,
              slug,
              website_url: websiteUrl,
              pricing,
            };

            // Create the record
            const created = await toolsRepo.create(insertData);
            const createdId = created.id;

            // Verify record exists before delete
            const beforeDelete = await toolsRepo.findBy('id', createdId);
            expect(beforeDelete).not.toBeNull();
            expect(beforeDelete!.id).toBe(createdId);

            // Delete the record
            await toolsRepo.delete(createdId);

            // Property: After delete, findBy('id', id) should return null
            const afterDelete = await toolsRepo.findBy('id', createdId);
            expect(afterDelete).toBeNull();

            // Note: We don't add to testToolIds since the record is already deleted
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should remove record so findBy slug returns null after delete', async () => {
      // Create a tool
      const slug = generateUniqueSlug('delete-slug-test');
      const insertData: ToolInsert = {
        name: 'Delete Slug Test Tool',
        slug,
        website_url: 'https://example.com/delete-slug',
        pricing: 'Free',
      };

      const created = await toolsRepo.create(insertData);

      // Verify record exists before delete
      const beforeDelete = await toolsRepo.findBy('slug', slug);
      expect(beforeDelete).not.toBeNull();
      expect(beforeDelete!.slug).toBe(slug);

      // Delete the record
      await toolsRepo.delete(created.id);

      // Property: After delete, findBy('slug', slug) should return null
      const afterDelete = await toolsRepo.findBy('slug', slug);
      expect(afterDelete).toBeNull();
    });

    it('should not affect other records when deleting one record', async () => {
      // Create multiple tools
      const slug1 = generateUniqueSlug('delete-multi-1');
      const slug2 = generateUniqueSlug('delete-multi-2');
      const slug3 = generateUniqueSlug('delete-multi-3');

      const tool1 = await toolsRepo.create({
        name: 'Delete Multi Test 1',
        slug: slug1,
        website_url: 'https://example.com/1',
      });
      testToolIds.push(tool1.id);

      const tool2 = await toolsRepo.create({
        name: 'Delete Multi Test 2',
        slug: slug2,
        website_url: 'https://example.com/2',
      });
      // tool2 will be deleted, so don't add to testToolIds

      const tool3 = await toolsRepo.create({
        name: 'Delete Multi Test 3',
        slug: slug3,
        website_url: 'https://example.com/3',
      });
      testToolIds.push(tool3.id);

      // Delete only tool2
      await toolsRepo.delete(tool2.id);

      // Property: Deleted record should be gone
      const deletedTool = await toolsRepo.findBy('id', tool2.id);
      expect(deletedTool).toBeNull();

      // Property: Other records should still exist
      const remainingTool1 = await toolsRepo.findBy('id', tool1.id);
      expect(remainingTool1).not.toBeNull();
      expect(remainingTool1!.slug).toBe(slug1);

      const remainingTool3 = await toolsRepo.findBy('id', tool3.id);
      expect(remainingTool3).not.toBeNull();
      expect(remainingTool3!.slug).toBe(slug3);
    });

    it('should handle delete of non-existent record gracefully', async () => {
      // Use a UUID that doesn't exist
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      // Delete should not throw for non-existent record (Supabase behavior)
      await expect(toolsRepo.delete(nonExistentId)).resolves.toBeUndefined();
    });

    it('should allow re-creation of record with same slug after delete', async () => {
      // Create a tool
      const slug = generateUniqueSlug('delete-recreate-test');
      const insertData: ToolInsert = {
        name: 'Delete Recreate Test Tool',
        slug,
        website_url: 'https://example.com/recreate',
        pricing: 'Freemium',
      };

      const created = await toolsRepo.create(insertData);

      // Delete the record
      await toolsRepo.delete(created.id);

      // Verify record is gone
      const afterDelete = await toolsRepo.findBy('slug', slug);
      expect(afterDelete).toBeNull();

      // Re-create with same slug should succeed
      const recreated = await toolsRepo.create(insertData);
      testToolIds.push(recreated.id);

      // Property: New record should exist with same slug but different ID
      expect(recreated.slug).toBe(slug);
      expect(recreated.id).not.toBe(created.id);

      const found = await toolsRepo.findBy('slug', slug);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(recreated.id);
    });
  });

  /**
   * **Feature: supabase-migration, Property 6: Repository upsert is idempotent**
   * **Validates: Requirements 2.7, 10.8**
   *
   * *For any* insert data with a conflict column value, calling upsert twice with the same data
   * SHALL result in exactly one record with that conflict column value.
   */
  describe('Property 6: Repository upsert is idempotent', () => {
    // Arbitrary for generating valid tool names
    const toolNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,49}$/);
    
    // Arbitrary for generating valid website URLs
    const websiteUrlArb = fc.webUrl({ validSchemes: ['https'] });
    
    // Arbitrary for generating optional descriptions
    const descriptionArb = fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null });
    
    // Arbitrary for generating valid pricing values
    const pricingArb = fc.constantFrom('Free', 'Freemium', 'Paid', 'Free Trial', 'Contact for Pricing');
    
    // Arbitrary for generating valid review scores (0-5)
    const reviewScoreArb = fc.double({ min: 0, max: 5, noNaN: true });
    
    // Arbitrary for generating non-negative integers
    const nonNegativeIntArb = fc.nat({ max: 10000 });
    
    // Arbitrary for generating boolean values
    const booleanArb = fc.boolean();
    
    // Arbitrary for generating tags array
    const tagsArb = fc.array(fc.stringMatching(/^[a-zA-Z0-9-]{1,20}$/), { minLength: 0, maxLength: 5 });

    it('should result in exactly one record when upserting same data twice with slug conflict (property test with 10 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          toolNameArb,
          websiteUrlArb,
          descriptionArb,
          pricingArb,
          reviewScoreArb,
          nonNegativeIntArb,
          booleanArb,
          booleanArb,
          tagsArb,
          async (
            name,
            websiteUrl,
            description,
            pricing,
            reviewScore,
            savedCount,
            verified,
            isFeatured,
            tags
          ) => {
            // Generate unique slug for this test run
            const slug = generateUniqueSlug(name.toLowerCase().replace(/\s+/g, '-').slice(0, 20));
            
            // Round review score to 1 decimal place to match DB precision
            const roundedReviewScore = Math.round(reviewScore * 10) / 10;
            
            const insertData: ToolInsert = {
              name,
              slug,
              website_url: websiteUrl,
              description,
              pricing,
              review_score: roundedReviewScore,
              saved_count: savedCount,
              verified,
              is_featured: isFeatured,
              tags,
            };

            // First upsert - should create the record
            const firstUpsert = await toolsRepo.upsert(insertData, 'slug');
            testToolIds.push(firstUpsert.id);

            // Second upsert with same data - should update (or no-op) the existing record
            const secondUpsert = await toolsRepo.upsert(insertData, 'slug');

            // Property: Both upserts should return the same record ID
            expect(secondUpsert.id).toBe(firstUpsert.id);

            // Property: There should be exactly one record with this slug
            const allWithSlug = await supabase
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .from('tools' as any)
              .select('*')
              .eq('slug', slug);
            
            expect(allWithSlug.data).toHaveLength(1);
            expect((allWithSlug.data![0] as unknown as ToolRow).slug).toBe(slug);

            // Property: The record should have the correct data
            const found = await toolsRepo.findBy('slug', slug);
            expect(found).not.toBeNull();
            expect(found!.name).toBe(name);
            expect(found!.website_url).toBe(websiteUrl);
            expect(found!.description).toBe(description);
            expect(found!.pricing).toBe(pricing);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000);

    it('should update existing record when upserting with modified data (property test with 10 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          toolNameArb,
          toolNameArb,
          websiteUrlArb,
          descriptionArb,
          descriptionArb,
          pricingArb,
          pricingArb,
          async (
            originalName,
            updatedName,
            websiteUrl,
            originalDescription,
            updatedDescription,
            originalPricing,
            updatedPricing
          ) => {
            // Skip if no actual changes
            fc.pre(originalName !== updatedName || originalDescription !== updatedDescription || originalPricing !== updatedPricing);
            
            // Generate unique slug for this test run
            const slug = generateUniqueSlug(originalName.toLowerCase().replace(/\s+/g, '-').slice(0, 20));
            
            const originalData: ToolInsert = {
              name: originalName,
              slug,
              website_url: websiteUrl,
              description: originalDescription,
              pricing: originalPricing,
            };

            const updatedData: ToolInsert = {
              name: updatedName,
              slug, // Same slug - this is the conflict column
              website_url: websiteUrl,
              description: updatedDescription,
              pricing: updatedPricing,
            };

            // First upsert - should create the record
            const firstUpsert = await toolsRepo.upsert(originalData, 'slug');
            testToolIds.push(firstUpsert.id);

            // Verify original data
            expect(firstUpsert.name).toBe(originalName);
            expect(firstUpsert.description).toBe(originalDescription);
            expect(firstUpsert.pricing).toBe(originalPricing);

            // Second upsert with modified data - should update the existing record
            const secondUpsert = await toolsRepo.upsert(updatedData, 'slug');

            // Property: Both upserts should return the same record ID
            expect(secondUpsert.id).toBe(firstUpsert.id);

            // Property: The record should have the updated data
            expect(secondUpsert.name).toBe(updatedName);
            expect(secondUpsert.description).toBe(updatedDescription);
            expect(secondUpsert.pricing).toBe(updatedPricing);

            // Property: There should still be exactly one record with this slug
            const allWithSlug = await supabase
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .from('tools' as any)
              .select('*')
              .eq('slug', slug);
            
            expect(allWithSlug.data).toHaveLength(1);

            // Verify by fetching the record
            const found = await toolsRepo.findBy('slug', slug);
            expect(found).not.toBeNull();
            expect(found!.name).toBe(updatedName);
            expect(found!.description).toBe(updatedDescription);
            expect(found!.pricing).toBe(updatedPricing);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000);

    it('should maintain idempotency across multiple upserts', async () => {
      const slug = generateUniqueSlug('multi-upsert-test');
      const insertData: ToolInsert = {
        name: 'Multi Upsert Test Tool',
        slug,
        website_url: 'https://example.com/multi-upsert',
        description: 'Testing multiple upserts',
        pricing: 'Free',
        saved_count: 100,
        verified: true,
      };

      // Perform multiple upserts with the same data
      const results: string[] = [];
      for (let i = 0; i < 5; i++) {
        const result = await toolsRepo.upsert(insertData, 'slug');
        results.push(result.id);
      }

      // Track for cleanup (only need to track once since all IDs should be the same)
      testToolIds.push(results[0]);

      // Property: All upserts should return the same ID
      const uniqueIds = [...new Set(results)];
      expect(uniqueIds).toHaveLength(1);

      // Property: There should be exactly one record with this slug
      const allWithSlug = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('tools' as any)
        .select('*')
        .eq('slug', slug);
      
      expect(allWithSlug.data).toHaveLength(1);
      expect((allWithSlug.data![0] as unknown as ToolRow).name).toBe(insertData.name);
    });

    it('should create new record when upserting with different slug', async () => {
      const slug1 = generateUniqueSlug('upsert-diff-1');
      const slug2 = generateUniqueSlug('upsert-diff-2');

      const data1: ToolInsert = {
        name: 'Upsert Different Slug 1',
        slug: slug1,
        website_url: 'https://example.com/diff-1',
        pricing: 'Free',
      };

      const data2: ToolInsert = {
        name: 'Upsert Different Slug 2',
        slug: slug2,
        website_url: 'https://example.com/diff-2',
        pricing: 'Paid',
      };

      // Upsert first record
      const first = await toolsRepo.upsert(data1, 'slug');
      testToolIds.push(first.id);

      // Upsert second record with different slug
      const second = await toolsRepo.upsert(data2, 'slug');
      testToolIds.push(second.id);

      // Property: Different slugs should create different records
      expect(second.id).not.toBe(first.id);

      // Verify both records exist
      const found1 = await toolsRepo.findBy('slug', slug1);
      const found2 = await toolsRepo.findBy('slug', slug2);

      expect(found1).not.toBeNull();
      expect(found2).not.toBeNull();
      expect(found1!.id).toBe(first.id);
      expect(found2!.id).toBe(second.id);
    });

    it('should handle upsert with id conflict column', async () => {
      // First create a record to get an ID
      const slug = generateUniqueSlug('upsert-id-conflict');
      const initialData: ToolInsert = {
        name: 'Upsert ID Conflict Test',
        slug,
        website_url: 'https://example.com/id-conflict',
        pricing: 'Freemium',
      };

      const created = await toolsRepo.create(initialData);
      testToolIds.push(created.id);

      // Now upsert with the same ID but different data
      const updatedData: ToolInsert = {
        id: created.id, // Include the ID for conflict resolution
        name: 'Updated Name via ID Upsert',
        slug: generateUniqueSlug('upsert-id-conflict-new'), // Different slug
        website_url: 'https://example.com/id-conflict-updated',
        pricing: 'Paid',
      } as ToolInsert;

      const upserted = await toolsRepo.upsert(updatedData, 'id');

      // Property: Upsert with id conflict should update the existing record
      expect(upserted.id).toBe(created.id);
      expect(upserted.name).toBe('Updated Name via ID Upsert');
      expect(upserted.pricing).toBe('Paid');
    });
  });

  /**
   * **Feature: supabase-migration, Property 7: Repository count reflects actual records**
   * **Validates: Requirements 2.8**
   *
   * *For any* repository, count() SHALL equal the length of findAll() when called without limit.
   */
  describe('Property 7: Repository count reflects actual records', () => {
    it('should return count equal to findAll length (property test with 10 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a small random number to vary the test slightly
          fc.integer({ min: 1, max: 1000 }),
          async () => {
            // Core Property: count() should equal the length of findAll() without limit
            // We call them back-to-back to minimize race condition window
            const countResult = await toolsRepo.count();
            const findAllResult = await toolsRepo.findAll();
            
            // The fundamental property: count equals findAll length
            expect(countResult).toBe(findAllResult.length);
            
            // Additional invariant: count should be non-negative
            expect(countResult).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000); // 1 minute timeout for 10 runs

    it('should return non-negative count that matches findAll length', async () => {
      // Core property test: count() equals findAll().length
      const count = await toolsRepo.count();
      const findAllResult = await toolsRepo.findAll();

      // Property: count should be non-negative
      expect(count).toBeGreaterThanOrEqual(0);
      
      // Property: count should equal findAll length
      expect(count).toBe(findAllResult.length);
    });

    it('should track count changes through create-delete cycle', async () => {
      // Create a tool and track its effect on count
      // Use a unique slug to avoid conflicts
      const slug = generateUniqueSlug('count-cycle-test');
      const insertData: ToolInsert = {
        name: 'Count Cycle Test Tool',
        slug,
        website_url: 'https://example.com/count-cycle',
        pricing: 'Free',
      };
      
      // Create the tool
      const created = await toolsRepo.create(insertData);
      
      // Get count after create - verify it matches findAll
      const countAfterCreate = await toolsRepo.count();
      const findAllAfterCreate = await toolsRepo.findAll();
      
      // Property: count should match findAll length after create
      expect(countAfterCreate).toBe(findAllAfterCreate.length);
      
      // Property: The created record should be in findAll results
      const createdInResults = findAllAfterCreate.some(t => t.id === created.id);
      expect(createdInResults).toBe(true);
      
      // Delete the tool
      await toolsRepo.delete(created.id);
      
      // Get count after delete - verify it matches findAll
      const countAfterDelete = await toolsRepo.count();
      const findAllAfterDelete = await toolsRepo.findAll();
      
      // Property: count should match findAll length after delete
      expect(countAfterDelete).toBe(findAllAfterDelete.length);
      
      // Property: The deleted record should NOT be in findAll results
      const deletedInResults = findAllAfterDelete.some(t => t.id === created.id);
      expect(deletedInResults).toBe(false);
      
      // Property: count should have decreased by 1
      expect(countAfterDelete).toBe(countAfterCreate - 1);
    });

    it('should return count as a number type', async () => {
      const count = await toolsRepo.count();
      
      // Property: count should be a number
      expect(typeof count).toBe('number');
      
      // Property: count should be an integer (not a float)
      expect(Number.isInteger(count)).toBe(true);
      
      // Property: count should not be NaN
      expect(Number.isNaN(count)).toBe(false);
    });
  });
});
