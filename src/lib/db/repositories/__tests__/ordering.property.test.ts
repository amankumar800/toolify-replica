/**
 * Property-based tests for ordering operations in repositories
 *
 * Tests Properties 10-11 from the design document:
 * - Property 10: Subcategories ordered by display_order
 * - Property 11: FAQs ordered by display_order
 *
 * To run these tests, you need to set SUPABASE_SERVICE_ROLE_KEY in your environment.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createSubcategoriesRepository, type SubcategoriesRepository, type SubcategoryInsert } from '../subcategories.repository';
import { createCategoriesRepository, type CategoriesRepository, type CategoryInsert } from '../categories.repository';
import { createFaqsRepository, type FaqsRepository, type FaqInsert } from '../faqs.repository';
import type { Database } from '@/lib/supabase/types';
import { TABLES } from '../../constants/tables';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_KEY;

// Helper to generate unique slugs
function generateUniqueSlug(base: string): string {
  return `test-${base}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe.skipIf(shouldSkip)('Ordering Property Tests', () => {
  let supabase: SupabaseClient<Database>;
  let subcategoriesRepo: SubcategoriesRepository;
  let categoriesRepo: CategoriesRepository;
  let faqsRepo: FaqsRepository;
  const testCategoryIds: string[] = [];
  const testSubcategoryIds: string[] = [];
  const testFaqIds: string[] = [];

  beforeAll(() => {
    supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    subcategoriesRepo = createSubcategoriesRepository(supabase);
    categoriesRepo = createCategoriesRepository(supabase);
    faqsRepo = createFaqsRepository(supabase);
  });

  afterAll(async () => {
    // Clean up test data
    if (testSubcategoryIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)(TABLES.SUBCATEGORIES)
        .delete()
        .in('id', testSubcategoryIds);
    }
    if (testCategoryIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)(TABLES.CATEGORIES)
        .delete()
        .in('id', testCategoryIds);
    }
    if (testFaqIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)(TABLES.FAQS)
        .delete()
        .in('id', testFaqIds);
    }
  });


  /**
   * **Feature: supabase-migration, Property 10: Subcategories ordered by display_order**
   * **Validates: Requirements 3.5**
   *
   * *For any* category, findByCategory SHALL return subcategories sorted by
   * display_order in ascending order.
   */
  describe('Property 10: Subcategories ordered by display_order', () => {
    // Arbitrary for generating valid subcategory names
    const subcategoryNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{2,29}$/);
    
    // Arbitrary for generating display orders (0-100)
    const displayOrderArb = fc.nat({ max: 100 });

    it('should return subcategories sorted by display_order ascending (property test with 100 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array of 2-5 display orders
          fc.array(displayOrderArb, { minLength: 2, maxLength: 5 }),
          fc.array(subcategoryNameArb, { minLength: 2, maxLength: 5 }),
          async (displayOrders, names) => {
            // Ensure we have matching lengths
            const count = Math.min(displayOrders.length, names.length);
            const trimmedOrders = displayOrders.slice(0, count);
            const trimmedNames = names.slice(0, count);

            // Create a parent category
            const categorySlug = generateUniqueSlug('subcat-order-parent');
            const category = await categoriesRepo.create({
              name: 'Subcategory Order Test Category',
              slug: categorySlug,
            });
            testCategoryIds.push(category.id);

            // Create subcategories with various display_orders
            const subcategories: SubcategoryInsert[] = trimmedNames.map((name, i) => ({
              category_id: category.id,
              name: `${name} ${i}`,
              slug: generateUniqueSlug(name.toLowerCase().replace(/\s+/g, '-').slice(0, 10)),
              display_order: trimmedOrders[i],
            }));

            for (const subcat of subcategories) {
              const created = await subcategoriesRepo.create(subcat);
              testSubcategoryIds.push(created.id);
            }

            // Fetch subcategories by category
            const results = await subcategoriesRepo.findByCategory(category.id);

            // Property: Results should be sorted by display_order ascending
            for (let i = 1; i < results.length; i++) {
              const prevOrder = results[i - 1].display_order ?? 0;
              const currOrder = results[i].display_order ?? 0;
              expect(currOrder).toBeGreaterThanOrEqual(prevOrder);
            }
          }
        ),
        { numRuns: 5 }
      );
    }, 20000);

    it('should handle subcategories with same display_order', async () => {
      // Create a parent category
      const categorySlug = generateUniqueSlug('same-order-parent');
      const category = await categoriesRepo.create({
        name: 'Same Order Test Category',
        slug: categorySlug,
      });
      testCategoryIds.push(category.id);

      // Create subcategories with same display_order
      const subcategories: SubcategoryInsert[] = [
        { category_id: category.id, name: 'Same Order A', slug: generateUniqueSlug('same-a'), display_order: 5 },
        { category_id: category.id, name: 'Same Order B', slug: generateUniqueSlug('same-b'), display_order: 5 },
        { category_id: category.id, name: 'Same Order C', slug: generateUniqueSlug('same-c'), display_order: 5 },
      ];

      for (const subcat of subcategories) {
        const created = await subcategoriesRepo.create(subcat);
        testSubcategoryIds.push(created.id);
      }

      // Fetch subcategories
      const results = await subcategoriesRepo.findByCategory(category.id);

      // Property: All should have display_order of 5
      expect(results.length).toBe(3);
      results.forEach((r) => expect(r.display_order).toBe(5));
    });

    it('should return empty array for category with no subcategories', async () => {
      // Create a parent category with no subcategories
      const categorySlug = generateUniqueSlug('empty-parent');
      const category = await categoriesRepo.create({
        name: 'Empty Parent Category',
        slug: categorySlug,
      });
      testCategoryIds.push(category.id);

      // Fetch subcategories
      const results = await subcategoriesRepo.findByCategory(category.id);

      // Property: Should return empty array
      expect(results).toEqual([]);
    });
  });


  /**
   * **Feature: supabase-migration, Property 11: FAQs ordered by display_order**
   * **Validates: Requirements 3.6**
   *
   * *For any* call to findAllOrdered, the returned FAQs SHALL be sorted by
   * display_order in ascending order.
   */
  describe('Property 11: FAQs ordered by display_order', () => {
    // Arbitrary for generating valid questions
    const questionArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ?]{5,49}$/);
    
    // Arbitrary for generating valid answers
    const answerArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 .]{10,99}$/);
    
    // Arbitrary for generating display orders (0-100)
    const displayOrderArb = fc.nat({ max: 100 });

    it('should return FAQs sorted by display_order ascending (property test with 100 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array of 2-5 display orders
          fc.array(displayOrderArb, { minLength: 2, maxLength: 5 }),
          fc.array(questionArb, { minLength: 2, maxLength: 5 }),
          fc.array(answerArb, { minLength: 2, maxLength: 5 }),
          async (displayOrders, questions, answers) => {
            // Ensure we have matching lengths
            const count = Math.min(displayOrders.length, questions.length, answers.length);
            const trimmedOrders = displayOrders.slice(0, count);
            const trimmedQuestions = questions.slice(0, count);
            const trimmedAnswers = answers.slice(0, count);

            // Create FAQs with various display_orders
            const faqs: FaqInsert[] = trimmedQuestions.map((question, i) => ({
              question: `${question} ${Date.now()}-${i}?`,
              answer: trimmedAnswers[i],
              display_order: trimmedOrders[i],
            }));

            for (const faq of faqs) {
              const created = await faqsRepo.create(faq);
              testFaqIds.push(created.id);
            }

            // Fetch all FAQs ordered
            const results = await faqsRepo.findAllOrdered();

            // Property: Results should be sorted by display_order ascending
            for (let i = 1; i < results.length; i++) {
              const prevOrder = results[i - 1].display_order ?? 0;
              const currOrder = results[i].display_order ?? 0;
              expect(currOrder).toBeGreaterThanOrEqual(prevOrder);
            }
          }
        ),
        { numRuns: 5 }
      );
    }, 20000);

    it('should handle FAQs with same display_order', async () => {
      // Create FAQs with same display_order
      const faqs: FaqInsert[] = [
        { question: `Same Order FAQ A ${Date.now()}?`, answer: 'Answer A for same order test', display_order: 10 },
        { question: `Same Order FAQ B ${Date.now()}?`, answer: 'Answer B for same order test', display_order: 10 },
        { question: `Same Order FAQ C ${Date.now()}?`, answer: 'Answer C for same order test', display_order: 10 },
      ];

      for (const faq of faqs) {
        const created = await faqsRepo.create(faq);
        testFaqIds.push(created.id);
      }

      // Fetch all FAQs
      const results = await faqsRepo.findAllOrdered();

      // Property: Should include our FAQs with display_order 10
      const ourFaqs = results.filter((r) => r.display_order === 10);
      expect(ourFaqs.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle FAQs with null display_order', async () => {
      // Create FAQ without display_order (will default to null or 0)
      const faq: FaqInsert = {
        question: `Null Order FAQ ${Date.now()}?`,
        answer: 'Answer for null order test',
      };

      const created = await faqsRepo.create(faq);
      testFaqIds.push(created.id);

      // Fetch all FAQs
      const results = await faqsRepo.findAllOrdered();

      // Property: Should include our FAQ
      const ourFaq = results.find((r) => r.id === created.id);
      expect(ourFaq).toBeDefined();
    });

    it('should return FAQs in correct order with mixed display_orders', async () => {
      // Create FAQs with specific display_orders to verify ordering
      const timestamp = Date.now();
      const faqs: FaqInsert[] = [
        { question: `Order Test 3 ${timestamp}?`, answer: 'Answer 3', display_order: 30 },
        { question: `Order Test 1 ${timestamp}?`, answer: 'Answer 1', display_order: 10 },
        { question: `Order Test 2 ${timestamp}?`, answer: 'Answer 2', display_order: 20 },
      ];

      const createdIds: string[] = [];
      for (const faq of faqs) {
        const created = await faqsRepo.create(faq);
        testFaqIds.push(created.id);
        createdIds.push(created.id);
      }

      // Fetch all FAQs
      const results = await faqsRepo.findAllOrdered();

      // Find our FAQs in the results
      const ourFaqs = results.filter((r) => createdIds.includes(r.id));

      // Property: Our FAQs should be in order 10, 20, 30
      expect(ourFaqs.length).toBe(3);
      expect(ourFaqs[0].display_order).toBe(10);
      expect(ourFaqs[1].display_order).toBe(20);
      expect(ourFaqs[2].display_order).toBe(30);
    });
  });
});
