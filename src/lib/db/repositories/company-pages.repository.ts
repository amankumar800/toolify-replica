/**
 * Company Pages repository for managing company information pages.
 * Provides data access for About Us, Contact, Privacy Policy, and Terms of Service pages.
 *
 * @module company-pages.repository
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, CompanyPageRow, CompanyPageSlug } from '@/lib/supabase/types';
import { DatabaseError } from '../errors';
import { TABLES } from '../constants/tables';

/**
 * Company page insert type for creating new pages.
 */
export type CompanyPageInsert = {
  slug: CompanyPageSlug;
  title: string;
  content?: string;
};

/**
 * Company page update type for partial updates.
 */
export type CompanyPageUpdate = {
  title?: string;
  content?: string;
};

/**
 * Company pages repository interface.
 */
export interface CompanyPagesRepository {
  /**
   * Find all company pages ordered by slug.
   */
  findAll(): Promise<CompanyPageRow[]>;

  /**
   * Find a company page by its unique slug.
   * @param slug - The page slug (about, contact, privacy, terms)
   * @returns The company page or null if not found
   */
  findBySlug(slug: string): Promise<CompanyPageRow | null>;

  /**
   * Update a company page by slug.
   * @param slug - The page slug to update
   * @param data - The data to update (title and/or content)
   * @returns The updated company page
   * @throws {DatabaseError} If update fails or page not found
   */
  update(slug: string, data: CompanyPageUpdate): Promise<CompanyPageRow>;
}

/**
 * Creates a company pages repository.
 *
 * @param supabase - Supabase client instance
 * @returns Company pages repository with CRUD operations
 *
 * @example
 * ```ts
 * const companyPagesRepo = createCompanyPagesRepository(supabase);
 * const aboutPage = await companyPagesRepo.findBySlug('about');
 * ```
 */
export function createCompanyPagesRepository(
  supabase: SupabaseClient<Database>
): CompanyPagesRepository {
  const tableName = TABLES.COMPANY_PAGES;

  /**
   * Helper to wrap Supabase errors in DatabaseError.
   */
  function wrapError(error: unknown, operation: string): DatabaseError {
    const message = error instanceof Error ? error.message : String(error);
    return new DatabaseError(operation, tableName, message, error);
  }

  return {
    async findAll(): Promise<CompanyPageRow[]> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .order('slug', { ascending: true });

      if (error) {
        throw wrapError(error, 'findAll');
      }

      return (data ?? []) as unknown as CompanyPageRow[];
    },

    async findBySlug(slug: string): Promise<CompanyPageRow | null> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        throw wrapError(error, 'findBySlug');
      }

      return data as unknown as CompanyPageRow | null;
    },

    async update(slug: string, updateData: CompanyPageUpdate): Promise<CompanyPageRow> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .update(updateData as Record<string, unknown>)
        .eq('slug', slug)
        .select()
        .single();

      if (error) {
        throw wrapError(error, 'update');
      }

      return data as unknown as CompanyPageRow;
    },
  };
}
