/**
 * Property-Based Tests for Free AI Tools Data Models
 * 
 * **Feature: free-ai-tools, Property 3: JSON Serialization Round-Trip**
 * **Validates: Requirements 6.8, 6.9**
 * 
 * Tests that serializing data to JSON and parsing back produces equivalent objects.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  CategorySchema,
  SubcategorySchema,
  ToolSchema,
  FeaturedToolSchema,
  FAQItemSchema,
  ScrapingMetadataSchema,
  CategoryRefSchema,
  type Category,
  type Subcategory,
  type Tool,
  type FeaturedTool,
  type FAQItem,
  type ScrapingMetadata,
  type CategoryRef,
} from './free-ai-tools';

// =============================================================================
// Arbitraries (Generators) for Property-Based Testing
// =============================================================================

/**
 * Generates valid tool slugs: lowercase alphanumeric with hyphens, max 100 chars
 */
const toolSlugArbitrary = fc
  .stringMatching(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)
  .filter((s) => s.length >= 2 && s.length <= 100 && !s.includes('--'));

/**
 * Generates valid URLs
 */
const urlArbitrary = fc.webUrl();

/**
 * Generates valid ISO datetime strings
 * Uses integer timestamps to avoid invalid date issues
 */
const datetimeArbitrary = fc
  .integer({
    min: 0, // 1970-01-01
    max: 4102444800000, // 2100-01-01
  })
  .map((timestamp) => new Date(timestamp).toISOString());

/**
 * Generates CategoryRef objects
 */
const categoryRefArbitrary: fc.Arbitrary<CategoryRef> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  slug: fc.string({ minLength: 1, maxLength: 50 }).map((s) => s.toLowerCase().replace(/[^a-z0-9-]/g, '-')),
});


/**
 * Generates Tool objects
 */
const toolArbitrary: fc.Arbitrary<Tool> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  slug: toolSlugArbitrary,
  externalUrl: fc.option(urlArbitrary, { nil: null }),
  description: fc.string({ maxLength: 500 }),
  freeTierDetails: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  pricing: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  categoryIds: fc.array(fc.uuid(), { maxLength: 5 }),
});

/**
 * Generates Subcategory objects
 */
const subcategoryArbitrary: fc.Arbitrary<Subcategory> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  toolCount: fc.nat({ max: 1000 }),
  tools: fc.array(toolArbitrary, { maxLength: 10 }),
});

/**
 * Generates Category objects
 */
const categoryArbitrary: fc.Arbitrary<Category> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  slug: fc.string({ minLength: 1, maxLength: 50 }).map((s) => s.toLowerCase().replace(/[^a-z0-9-]/g, '-')),
  icon: fc.string({ maxLength: 50 }),
  description: fc.string({ maxLength: 500 }),
  toolCount: fc.nat({ max: 10000 }),
  subcategories: fc.array(subcategoryArbitrary, { maxLength: 5 }),
  previousCategory: fc.option(categoryRefArbitrary, { nil: null }),
  nextCategory: fc.option(categoryRefArbitrary, { nil: null }),
  createdAt: datetimeArbitrary,
  updatedAt: datetimeArbitrary,
});

/**
 * Generates FeaturedTool objects
 */
const featuredToolArbitrary: fc.Arbitrary<FeaturedTool> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  slug: fc.string({ minLength: 1, maxLength: 50 }).map((s) => s.toLowerCase().replace(/[^a-z0-9-]/g, '-')),
  imageUrl: urlArbitrary,
  description: fc.string({ maxLength: 500 }),
  badge: fc.option(fc.constantFrom('Free', 'New', 'Popular') as fc.Arbitrary<'Free' | 'New' | 'Popular'>, { nil: null }),
  displayOrder: fc.nat({ max: 100 }),
});

/**
 * Generates FAQItem objects
 */
const faqItemArbitrary: fc.Arbitrary<FAQItem> = fc.record({
  question: fc.string({ minLength: 1, maxLength: 500 }),
  answer: fc.string({ minLength: 1, maxLength: 2000 }),
});

/**
 * Generates ScrapingMetadata objects
 */
const scrapingMetadataArbitrary: fc.Arbitrary<ScrapingMetadata> = fc.record({
  lastScrapedAt: datetimeArbitrary,
  totalTools: fc.nat({ max: 100000 }),
  totalCategories: fc.nat({ max: 100 }),
  scrapeDurationMs: fc.nat({ max: 3600000 }),
  version: fc.string({ minLength: 1, maxLength: 20 }),
});

// =============================================================================
// Property-Based Tests
// =============================================================================

describe('Free AI Tools - JSON Serialization Round-Trip', () => {
  /**
   * **Feature: free-ai-tools, Property 3: JSON Serialization Round-Trip**
   * **Validates: Requirements 6.8, 6.9**
   * 
   * For any valid Category, Subcategory, Tool, or FeaturedTool object,
   * serializing to JSON with the pretty-printer and then parsing back
   * SHALL produce an equivalent object.
   */

  it('Tool: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(toolArbitrary, (tool) => {
        // Serialize with pretty-printing (2-space indentation per Requirement 6.8)
        const serialized = JSON.stringify(tool, null, 2);
        
        // Parse back
        const parsed = JSON.parse(serialized);
        
        // Validate against schema (Requirement 6.9)
        const validated = ToolSchema.parse(parsed);
        
        // Should be equivalent
        expect(validated).toEqual(tool);
      }),
      { numRuns: 100 }
    );
  });

  it('Subcategory: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(subcategoryArbitrary, (subcategory) => {
        const serialized = JSON.stringify(subcategory, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = SubcategorySchema.parse(parsed);
        expect(validated).toEqual(subcategory);
      }),
      { numRuns: 100 }
    );
  });

  it('Category: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(categoryArbitrary, (category) => {
        const serialized = JSON.stringify(category, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = CategorySchema.parse(parsed);
        expect(validated).toEqual(category);
      }),
      { numRuns: 100 }
    );
  });

  it('FeaturedTool: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(featuredToolArbitrary, (featuredTool) => {
        const serialized = JSON.stringify(featuredTool, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = FeaturedToolSchema.parse(parsed);
        expect(validated).toEqual(featuredTool);
      }),
      { numRuns: 100 }
    );
  });

  it('FAQItem: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(faqItemArbitrary, (faqItem) => {
        const serialized = JSON.stringify(faqItem, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = FAQItemSchema.parse(parsed);
        expect(validated).toEqual(faqItem);
      }),
      { numRuns: 100 }
    );
  });

  it('ScrapingMetadata: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(scrapingMetadataArbitrary, (metadata) => {
        const serialized = JSON.stringify(metadata, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = ScrapingMetadataSchema.parse(parsed);
        expect(validated).toEqual(metadata);
      }),
      { numRuns: 100 }
    );
  });

  it('CategoryRef: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(categoryRefArbitrary, (categoryRef) => {
        const serialized = JSON.stringify(categoryRef, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = CategoryRefSchema.parse(parsed);
        expect(validated).toEqual(categoryRef);
      }),
      { numRuns: 100 }
    );
  });
});
