/**
 * FAQs repository with specialized queries for the faqs table.
 * Extends base repository with FAQ-specific operations.
 *
 * @module faqs.repository
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  FaqRow as GeneratedFaqRow,
  FaqInsert as GeneratedFaqInsert,
  FaqUpdate as GeneratedFaqUpdate,
} from '@/lib/supabase/types';
import { DatabaseError } from '../errors';
import { TABLES } from '../constants/tables';
import {
  createBaseRepository,
  type BaseRepository,
} from './base.repository';

/**
 * FAQ row type from database.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type FaqRow = GeneratedFaqRow & { [key: string]: unknown };

/**
 * FAQ insert type for creating new FAQs.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type FaqInsert = GeneratedFaqInsert & { [key: string]: unknown };

/**
 * FAQ update type for partial updates.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type FaqUpdate = GeneratedFaqUpdate & { [key: string]: unknown };

/**
 * FAQs repository interface extending base repository.
 */
export interface FaqsRepository
  extends BaseRepository<FaqRow, FaqInsert, FaqUpdate> {
  /** Find all FAQs ordered by display_order ascending */
  findAllOrdered(): Promise<FaqRow[]>;
}

/**
 * Creates a FAQs repository with specialized queries.
 *
 * @param supabase - Supabase client instance
 * @returns FAQs repository with CRUD and specialized operations
 *
 * @example
 * ```ts
 * const faqsRepo = createFaqsRepository(supabase);
 * const faqs = await faqsRepo.findAllOrdered();
 * ```
 */
export function createFaqsRepository(
  supabase: SupabaseClient<Database>
): FaqsRepository {
  const tableName = TABLES.FAQS;
  const baseRepo = createBaseRepository<FaqRow, FaqInsert, FaqUpdate>(
    supabase,
    tableName
  );

  /**
   * Helper to wrap Supabase errors in DatabaseError.
   */
  function wrapError(error: unknown, operation: string): DatabaseError {
    const message = error instanceof Error ? error.message : String(error);
    return new DatabaseError(operation, tableName, message, error);
  }

  return {
    // Inherit base repository methods
    ...baseRepo,

    async findAllOrdered(): Promise<FaqRow[]> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        throw wrapError(error, 'findAllOrdered');
      }

      return (data ?? []) as unknown as FaqRow[];
    },
  };
}
