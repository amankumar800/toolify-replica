/**
 * Property-based tests for tool mapper functions
 *
 * Tests Properties 12-14 from the design document:
 * - Property 12: Mapper snake_case to camelCase transformation
 * - Property 13: Mapper applies defaults for null values
 * - Property 14: Mapper round-trip preserves data
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  mapToolRowToTool,
  mapToolWithCategories,
  mapToolToInsert,
  TOOL_DEFAULTS,
} from '../tool.mapper';
import type { ToolRow, ToolWithCategories } from '../../repositories/tools.repository';

/**
 * Helper to generate a valid ToolRow with snake_case columns
 */
function createToolRow(overrides: Partial<ToolRow> = {}): ToolRow {
  return {
    id: 'test-id-123',
    name: 'Test Tool',
    slug: 'test-tool',
    description: 'A test description',
    short_description: 'Short desc',
    image_url: 'https://example.com/image.png',
    website_url: 'https://example.com',
    external_url: null,
    pricing: 'Free',
    tags: ['ai', 'test'],
    saved_count: 100,
    review_count: 50,
    review_score: 4.5,
    verified: true,
    is_new: false,
    is_featured: true,
    monthly_visits: 10000,
    change_percentage: 5.5,
    free_tier_details: null,
    metadata: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    ...overrides,
  };
}

describe('Tool Mapper Property Tests', () => {
  /**
   * **Feature: supabase-migration, Property 12: Mapper snake_case to camelCase transformation**
   * **Validates: Requirements 4.1, 4.5**
   *
   * *For any* database row with snake_case columns, the mapper SHALL produce an object
   * with equivalent camelCase properties where the values are preserved.
   */
  describe('Property 12: Mapper snake_case to camelCase transformation', () => {
    // Arbitrary for generating valid tool names
    const toolNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,49}$/);
    
    // Arbitrary for generating valid slugs
    const slugArb = fc.stringMatching(/^[a-z][a-z0-9-]{2,49}$/);
    
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

    it('should transform snake_case columns to camelCase properties (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          toolNameArb,
          slugArb,
          websiteUrlArb,
          descriptionArb,
          descriptionArb, // short_description
          pricingArb,
          reviewScoreArb,
          nonNegativeIntArb, // saved_count
          nonNegativeIntArb, // review_count
          booleanArb, // verified
          booleanArb, // is_new
          booleanArb, // is_featured
          tagsArb,
          (
            name,
            slug,
            websiteUrl,
            description,
            shortDescription,
            pricing,
            reviewScore,
            savedCount,
            reviewCount,
            verified,
            isNew,
            isFeatured,
            tags
          ) => {
            // Create a ToolRow with snake_case columns
            const row = createToolRow({
              name,
              slug,
              website_url: websiteUrl,
              description,
              short_description: shortDescription,
              pricing,
              review_score: reviewScore,
              saved_count: savedCount,
              review_count: reviewCount,
              verified,
              is_new: isNew,
              is_featured: isFeatured,
              tags,
            });

            // Map to application type
            const tool = mapToolRowToTool(row);

            // Property: snake_case columns should be transformed to camelCase properties
            // with values preserved
            expect(tool.name).toBe(name);
            expect(tool.slug).toBe(slug);
            expect(tool.websiteUrl).toBe(websiteUrl);
            expect(tool.description).toBe(description ?? TOOL_DEFAULTS.description);
            expect(tool.shortDescription).toBe(shortDescription ?? TOOL_DEFAULTS.shortDescription);
            expect(tool.pricing).toBe(pricing);
            expect(tool.reviewScore).toBeCloseTo(reviewScore, 5);
            expect(tool.savedCount).toBe(savedCount);
            expect(tool.reviewCount).toBe(reviewCount);
            expect(tool.verified).toBe(verified);
            expect(tool.isNew).toBe(isNew);
            expect(tool.isFeatured).toBe(isFeatured);
            expect(tool.tags).toEqual(tags);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly map image_url to image property', () => {
      const imageUrls = [
        'https://example.com/image.png',
        'https://cdn.example.com/tools/chatgpt.jpg',
        'https://images.example.org/ai-tool.webp',
      ];

      for (const imageUrl of imageUrls) {
        const row = createToolRow({ image_url: imageUrl });
        const tool = mapToolRowToTool(row);
        
        // Property: image_url should map to image
        expect(tool.image).toBe(imageUrl);
      }
    });

    it('should correctly map created_at to dateAdded property', () => {
      const timestamps = [
        '2024-01-01T00:00:00Z',
        '2023-06-15T12:30:45Z',
        '2025-12-31T23:59:59Z',
      ];

      for (const timestamp of timestamps) {
        const row = createToolRow({ created_at: timestamp });
        const tool = mapToolRowToTool(row);
        
        // Property: created_at should map to dateAdded
        expect(tool.dateAdded).toBe(timestamp);
      }
    });

    it('should correctly map monthly_visits and change_percentage', () => {
      fc.assert(
        fc.property(
          fc.option(fc.nat({ max: 10000000 }), { nil: null }),
          fc.option(fc.double({ min: -100, max: 100, noNaN: true }), { nil: null }),
          (monthlyVisits, changePercentage) => {
            const row = createToolRow({
              monthly_visits: monthlyVisits,
              change_percentage: changePercentage,
            });
            const tool = mapToolRowToTool(row);

            // Property: monthly_visits and change_percentage should map correctly
            expect(tool.monthlyVisits).toBe(monthlyVisits ?? undefined);
            expect(tool.changePercentage).toBe(changePercentage ?? undefined);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: supabase-migration, Property 13: Mapper applies defaults for null values**
   * **Validates: Requirements 4.2**
   *
   * *For any* database row with null values in optional fields, the mapper SHALL produce
   * an object with the specified default values.
   */
  describe('Property 13: Mapper applies defaults for null values', () => {
    it('should apply default description when null', () => {
      const row = createToolRow({ description: null });
      const tool = mapToolRowToTool(row);
      
      expect(tool.description).toBe(TOOL_DEFAULTS.description);
    });

    it('should apply default shortDescription when null', () => {
      const row = createToolRow({ short_description: null });
      const tool = mapToolRowToTool(row);
      
      expect(tool.shortDescription).toBe(TOOL_DEFAULTS.shortDescription);
    });

    it('should apply default image when null', () => {
      const row = createToolRow({ image_url: null });
      const tool = mapToolRowToTool(row);
      
      expect(tool.image).toBe(TOOL_DEFAULTS.image);
    });

    it('should apply default tags when null', () => {
      const row = createToolRow({ tags: null });
      const tool = mapToolRowToTool(row);
      
      expect(tool.tags).toEqual(TOOL_DEFAULTS.tags);
    });

    it('should apply default savedCount when null', () => {
      const row = createToolRow({ saved_count: null });
      const tool = mapToolRowToTool(row);
      
      expect(tool.savedCount).toBe(TOOL_DEFAULTS.savedCount);
    });

    it('should apply default reviewCount when null', () => {
      const row = createToolRow({ review_count: null });
      const tool = mapToolRowToTool(row);
      
      expect(tool.reviewCount).toBe(TOOL_DEFAULTS.reviewCount);
    });

    it('should apply default reviewScore when null', () => {
      const row = createToolRow({ review_score: null });
      const tool = mapToolRowToTool(row);
      
      expect(tool.reviewScore).toBe(TOOL_DEFAULTS.reviewScore);
    });

    it('should apply default verified when null', () => {
      const row = createToolRow({ verified: null });
      const tool = mapToolRowToTool(row);
      
      expect(tool.verified).toBe(TOOL_DEFAULTS.verified);
    });

    it('should apply default isNew when null', () => {
      const row = createToolRow({ is_new: null });
      const tool = mapToolRowToTool(row);
      
      expect(tool.isNew).toBe(TOOL_DEFAULTS.isNew);
    });

    it('should apply default isFeatured when null', () => {
      const row = createToolRow({ is_featured: null });
      const tool = mapToolRowToTool(row);
      
      expect(tool.isFeatured).toBe(TOOL_DEFAULTS.isFeatured);
    });

    it('should apply all defaults when all optional fields are null (property test with 100 runs)', () => {
      // Arbitrary for generating required fields only
      const toolNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,49}$/);
      const slugArb = fc.stringMatching(/^[a-z][a-z0-9-]{2,49}$/);
      const websiteUrlArb = fc.webUrl({ validSchemes: ['https'] });

      fc.assert(
        fc.property(
          toolNameArb,
          slugArb,
          websiteUrlArb,
          (name, slug, websiteUrl) => {
            // Create a row with all optional fields as null
            const row: ToolRow = {
              id: 'test-id',
              name,
              slug,
              description: null,
              short_description: null,
              image_url: null,
              website_url: websiteUrl,
              external_url: null,
              pricing: null, // Will default to 'Freemium'
              tags: null,
              saved_count: null,
              review_count: null,
              review_score: null,
              verified: null,
              is_new: null,
              is_featured: null,
              monthly_visits: null,
              change_percentage: null,
              free_tier_details: null,
              metadata: null,
              created_at: null,
              updated_at: null,
            };

            const tool = mapToolRowToTool(row);

            // Property: All defaults should be applied
            expect(tool.description).toBe(TOOL_DEFAULTS.description);
            expect(tool.shortDescription).toBe(TOOL_DEFAULTS.shortDescription);
            expect(tool.image).toBe(TOOL_DEFAULTS.image);
            expect(tool.tags).toEqual(TOOL_DEFAULTS.tags);
            expect(tool.savedCount).toBe(TOOL_DEFAULTS.savedCount);
            expect(tool.reviewCount).toBe(TOOL_DEFAULTS.reviewCount);
            expect(tool.reviewScore).toBe(TOOL_DEFAULTS.reviewScore);
            expect(tool.verified).toBe(TOOL_DEFAULTS.verified);
            expect(tool.isNew).toBe(TOOL_DEFAULTS.isNew);
            expect(tool.isFeatured).toBe(TOOL_DEFAULTS.isFeatured);
            expect(tool.pricing).toBe('Freemium'); // Default pricing
            
            // Required fields should be preserved
            expect(tool.name).toBe(name);
            expect(tool.slug).toBe(slug);
            expect(tool.websiteUrl).toBe(websiteUrl);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply default pricing when invalid value provided', () => {
      const invalidPricings = ['invalid', 'Unknown', '', 'free', 'PAID'];
      
      for (const pricing of invalidPricings) {
        const row = createToolRow({ pricing });
        const tool = mapToolRowToTool(row);
        
        // Property: Invalid pricing should default to 'Freemium'
        expect(tool.pricing).toBe('Freemium');
      }
    });
  });

  /**
   * **Feature: supabase-migration, Property 14: Mapper round-trip preserves data**
   * **Validates: Requirements 4.4**
   *
   * *For any* valid Tool object, mapToolToInsert followed by mapToolRowToTool
   * (after DB insert) SHALL produce an object with equivalent data to the original
   * (excluding auto-generated fields like id, created_at).
   */
  describe('Property 14: Mapper round-trip preserves data', () => {
    // Arbitrary for generating valid tool names
    const toolNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,49}$/);
    
    // Arbitrary for generating valid slugs
    const slugArb = fc.stringMatching(/^[a-z][a-z0-9-]{2,49}$/);
    
    // Arbitrary for generating valid website URLs
    const websiteUrlArb = fc.webUrl({ validSchemes: ['https'] });
    
    // Arbitrary for generating descriptions (non-empty to avoid default application)
    const descriptionArb = fc.string({ minLength: 1, maxLength: 200 });
    
    // Arbitrary for generating valid pricing values
    const pricingArb = fc.constantFrom('Free', 'Freemium', 'Paid', 'Free Trial', 'Contact for Pricing') as fc.Arbitrary<'Free' | 'Freemium' | 'Paid' | 'Free Trial' | 'Contact for Pricing'>;
    
    // Arbitrary for generating valid review scores (0-5)
    const reviewScoreArb = fc.double({ min: 0, max: 5, noNaN: true });
    
    // Arbitrary for generating non-negative integers
    const nonNegativeIntArb = fc.nat({ max: 10000 });
    
    // Arbitrary for generating boolean values
    const booleanArb = fc.boolean();
    
    // Arbitrary for generating tags array
    const tagsArb = fc.array(fc.stringMatching(/^[a-zA-Z0-9-]{1,20}$/), { minLength: 1, maxLength: 5 });
    
    // Arbitrary for generating image URLs
    const imageUrlArb = fc.webUrl({ validSchemes: ['https'] });

    it('should preserve data through mapToolToInsert -> DB -> mapToolRowToTool round-trip (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          toolNameArb,
          slugArb,
          websiteUrlArb,
          descriptionArb,
          descriptionArb, // shortDescription
          imageUrlArb,
          pricingArb,
          reviewScoreArb,
          nonNegativeIntArb, // savedCount
          nonNegativeIntArb, // reviewCount
          booleanArb, // verified
          booleanArb, // isNew
          booleanArb, // isFeatured
          tagsArb,
          (
            name,
            slug,
            websiteUrl,
            description,
            shortDescription,
            image,
            pricing,
            reviewScore,
            savedCount,
            reviewCount,
            verified,
            isNew,
            isFeatured,
            tags
          ) => {
            // Create an application Tool object (without id and dateAdded)
            const originalTool = {
              name,
              slug,
              websiteUrl,
              description,
              shortDescription,
              image,
              pricing,
              reviewScore,
              savedCount,
              reviewCount,
              verified,
              isNew,
              isFeatured,
              tags,
              categories: [] as string[],
            };

            // Map to insert format (camelCase -> snake_case)
            const insertData = mapToolToInsert(originalTool);

            // Simulate DB insert by creating a ToolRow from the insert data
            // (DB would add id, created_at, updated_at)
            const dbRow: ToolRow = {
              id: 'generated-id',
              name: insertData.name,
              slug: insertData.slug,
              description: insertData.description ?? null,
              short_description: insertData.short_description ?? null,
              image_url: insertData.image_url ?? null,
              website_url: insertData.website_url,
              external_url: insertData.external_url ?? null,
              pricing: insertData.pricing ?? null,
              tags: insertData.tags ?? null,
              saved_count: insertData.saved_count ?? null,
              review_count: insertData.review_count ?? null,
              review_score: insertData.review_score ?? null,
              verified: insertData.verified ?? null,
              is_new: insertData.is_new ?? null,
              is_featured: insertData.is_featured ?? null,
              monthly_visits: insertData.monthly_visits ?? null,
              change_percentage: insertData.change_percentage ?? null,
              free_tier_details: insertData.free_tier_details ?? null,
              metadata: insertData.metadata ?? null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            };

            // Map back to application type (snake_case -> camelCase)
            const resultTool = mapToolRowToTool(dbRow);

            // Property: Round-trip should preserve all data fields
            expect(resultTool.name).toBe(originalTool.name);
            expect(resultTool.slug).toBe(originalTool.slug);
            expect(resultTool.websiteUrl).toBe(originalTool.websiteUrl);
            expect(resultTool.description).toBe(originalTool.description);
            expect(resultTool.shortDescription).toBe(originalTool.shortDescription);
            expect(resultTool.image).toBe(originalTool.image);
            expect(resultTool.pricing).toBe(originalTool.pricing);
            expect(resultTool.reviewScore).toBeCloseTo(originalTool.reviewScore, 5);
            expect(resultTool.savedCount).toBe(originalTool.savedCount);
            expect(resultTool.reviewCount).toBe(originalTool.reviewCount);
            expect(resultTool.verified).toBe(originalTool.verified);
            expect(resultTool.isNew).toBe(originalTool.isNew);
            expect(resultTool.isFeatured).toBe(originalTool.isFeatured);
            expect(resultTool.tags).toEqual(originalTool.tags);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty strings correctly in round-trip', () => {
      const originalTool = {
        name: 'Test Tool',
        slug: 'test-tool',
        websiteUrl: 'https://example.com',
        description: '', // Empty string
        shortDescription: '', // Empty string
        image: 'https://example.com/image.png',
        pricing: 'Free' as const,
        reviewScore: 0,
        savedCount: 0,
        reviewCount: 0,
        verified: false,
        isNew: false,
        isFeatured: false,
        tags: [],
        categories: [] as string[],
      };

      const insertData = mapToolToInsert(originalTool);
      
      // Empty strings become null in insert
      expect(insertData.description).toBeNull();
      expect(insertData.short_description).toBeNull();

      // Simulate DB row with nulls
      const dbRow = createToolRow({
        name: insertData.name,
        slug: insertData.slug,
        website_url: insertData.website_url,
        description: null,
        short_description: null,
        image_url: insertData.image_url,
        pricing: insertData.pricing,
        tags: [],
      });

      const resultTool = mapToolRowToTool(dbRow);

      // Empty strings should become defaults after round-trip
      expect(resultTool.description).toBe(TOOL_DEFAULTS.description);
      expect(resultTool.shortDescription).toBe(TOOL_DEFAULTS.shortDescription);
    });
  });

  /**
   * Additional tests for mapToolWithCategories
   */
  describe('mapToolWithCategories', () => {
    it('should extract category names from joined relationship', () => {
      const rowWithCategories: ToolWithCategories = {
        ...createToolRow(),
        categories: [
          { name: 'AI Chatbots', slug: 'ai-chatbots' },
          { name: 'Productivity', slug: 'productivity' },
          { name: 'Writing', slug: 'writing' },
        ],
      };

      const tool = mapToolWithCategories(rowWithCategories);

      expect(tool.categories).toEqual(['AI Chatbots', 'Productivity', 'Writing']);
    });

    it('should handle empty categories array', () => {
      const rowWithCategories: ToolWithCategories = {
        ...createToolRow(),
        categories: [],
      };

      const tool = mapToolWithCategories(rowWithCategories);

      expect(tool.categories).toEqual([]);
    });

    it('should handle undefined categories', () => {
      const rowWithCategories: ToolWithCategories = {
        ...createToolRow(),
        categories: undefined as unknown as { name: string; slug: string }[],
      };

      const tool = mapToolWithCategories(rowWithCategories);

      expect(tool.categories).toEqual([]);
    });

    it('should preserve all other tool properties when mapping with categories', () => {
      const baseRow = createToolRow({
        name: 'Test Tool With Categories',
        slug: 'test-tool-with-categories',
        pricing: 'Paid',
        review_score: 4.8,
      });

      const rowWithCategories: ToolWithCategories = {
        ...baseRow,
        categories: [{ name: 'AI', slug: 'ai' }],
      };

      const tool = mapToolWithCategories(rowWithCategories);

      expect(tool.name).toBe('Test Tool With Categories');
      expect(tool.slug).toBe('test-tool-with-categories');
      expect(tool.pricing).toBe('Paid');
      expect(tool.reviewScore).toBe(4.8);
      expect(tool.categories).toEqual(['AI']);
    });
  });
});
