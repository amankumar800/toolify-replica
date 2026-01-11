/**
 * Categories service layer for business logic orchestration.
 * Provides functions for managing categories, subcategories, and FAQs.
 *
 * @module categories.service
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createCategoriesRepository } from '@/lib/db/repositories/categories.repository';
import { createSubcategoriesRepository } from '@/lib/db/repositories/subcategories.repository';
import { createFaqsRepository } from '@/lib/db/repositories/faqs.repository';
import {
  mapCategoryRowToCategory,
  mapCategoryWithToolCount,
} from '@/lib/db/mappers/category.mapper';
import { mapSubcategoryRowToSubcategory } from '@/lib/db/mappers/subcategory.mapper';
import type { Category } from '@/lib/types/tool';

/**
 * Options for filtering and paginating categories.
 */
export interface GetCategoriesOptions {
  /** Include computed tool counts from junction table */
  withToolCount?: boolean;
  /** Maximum number of results */
  limit?: number;
  /** Number of results to skip */
  offset?: number;
}

/**
 * Subcategory type for service layer.
 */
export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  toolCount: number;
  displayOrder: number;
}

/**
 * FAQ type for service layer.
 */
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  displayOrder: number;
}

/**
 * Creates a Supabase admin client instance.
 */
function getSupabaseClient() {
  return createAdminClient();
}


/**
 * Fetches categories with optional filtering and tool counts.
 *
 * @param options - Filtering and pagination options
 * @returns Array of categories
 *
 * @example
 * ```ts
 * // Get all categories with tool counts
 * const categories = await getCategories({ withToolCount: true });
 * ```
 */
export async function getCategories(options?: GetCategoriesOptions): Promise<Category[]> {
  const supabase = getSupabaseClient();
  const repo = createCategoriesRepository(supabase);

  // If requesting tool counts, use findWithToolCount
  if (options?.withToolCount) {
    const rows = await repo.findWithToolCount();
    return rows.map(mapCategoryWithToolCount);
  }

  // Otherwise, get all categories
  const rows = await repo.findAll({
    limit: options?.limit,
    offset: options?.offset,
    orderBy: 'display_order',
    ascending: true,
  });

  return rows.map(mapCategoryRowToCategory);
}

/**
 * Fetches a single category by its slug.
 *
 * @param slug - URL-friendly identifier
 * @returns The category or null if not found
 *
 * @example
 * ```ts
 * const category = await getCategoryBySlug('ai-chatbots');
 * if (category) {
 *   console.log(category.name); // 'AI Chatbots'
 * }
 * ```
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = getSupabaseClient();
  const repo = createCategoriesRepository(supabase);
  const row = await repo.findBySlug(slug);

  if (!row) {
    return null;
  }

  return mapCategoryRowToCategory(row);
}


/**
 * Fetches subcategories for a specific category.
 *
 * @param categoryId - Parent category ID
 * @returns Array of subcategories ordered by display_order
 *
 * @example
 * ```ts
 * const subcategories = await getSubcategories('category-uuid');
 * ```
 */
export async function getSubcategories(categoryId: string): Promise<Subcategory[]> {
  const supabase = getSupabaseClient();
  const repo = createSubcategoriesRepository(supabase);
  const rows = await repo.findByCategory(categoryId);

  return rows.map(mapSubcategoryRowToSubcategory);
}

/**
 * Fetches all FAQs ordered by display_order.
 *
 * @returns Array of FAQs
 *
 * @example
 * ```ts
 * const faqs = await getFaqs();
 * faqs.forEach(faq => {
 *   console.log(faq.question, faq.answer);
 * });
 * ```
 */
export async function getFaqs(): Promise<FAQ[]> {
  const supabase = getSupabaseClient();
  const repo = createFaqsRepository(supabase);
  const rows = await repo.findAllOrdered();

  return rows.map((row) => ({
    id: row.id,
    question: row.question,
    answer: row.answer,
    displayOrder: row.display_order ?? 0,
  }));
}
