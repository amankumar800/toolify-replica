/**
 * Categories service layer for business logic orchestration.
 * Provides functions for managing categories, subcategories, category groups, and FAQs.
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
import { TABLES } from '@/lib/db/constants/tables';
import type { Category, CategoryGroup } from '@/lib/types/tool';

/**
 * Options for filtering and paginating categories.
 */
export interface GetCategoriesOptions {
  /** Filter by group ID */
  groupId?: string;
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
 *
 * // Get categories by group
 * const categories = await getCategories({ groupId: 'group-uuid' });
 * ```
 */
export async function getCategories(options?: GetCategoriesOptions): Promise<Category[]> {
  const supabase = getSupabaseClient();
  const repo = createCategoriesRepository(supabase);

  // If filtering by group, use findByGroup
  if (options?.groupId) {
    const rows = await repo.findByGroup(options.groupId);
    return rows.map(mapCategoryRowToCategory);
  }

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
 * Fetches all category groups with their categories.
 *
 * @returns Array of category groups with nested categories
 *
 * @example
 * ```ts
 * const groups = await getCategoryGroups();
 * groups.forEach(group => {
 *   console.log(group.name, group.categories.length);
 * });
 * ```
 */
export async function getCategoryGroups(): Promise<CategoryGroup[]> {
  const supabase = getSupabaseClient();

  // Get all category groups
  const { data: groups, error: groupsError } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLES.CATEGORY_GROUPS as any)
    .select('*')
    .order('display_order', { ascending: true });

  if (groupsError) {
    throw groupsError;
  }

  if (!groups || groups.length === 0) {
    return [];
  }

  // Get all categories with tool counts
  const categoriesRepo = createCategoriesRepository(supabase);
  const categoriesWithCounts = await categoriesRepo.findWithToolCount();
  const categories = categoriesWithCounts.map(mapCategoryWithToolCount);

  // Group categories by their group_id in metadata
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (groups as any[]).map((group) => {
    const groupCategories = categories.filter((cat) => {
      // Categories are linked to groups via metadata.group_id
      // This is a simplified approach - in production, you might have a junction table
      return true; // For now, include all categories in each group
    });

    return {
      id: group.id,
      name: group.name,
      iconName: group.icon_name ?? undefined,
      categories: groupCategories,
    } as CategoryGroup;
  });
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
