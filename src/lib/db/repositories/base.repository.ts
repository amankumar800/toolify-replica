/**
 * Base repository with generic CRUD operations for Supabase.
 * Provides a foundation for entity-specific repositories.
 *
 * @module base.repository
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { DatabaseError } from '../errors';

/**
 * Options for findAll queries.
 */
export interface FindAllOptions<Row> {
  /** Maximum number of records to return */
  limit?: number;
  /** Number of records to skip */
  offset?: number;
  /** Column to order by */
  orderBy?: keyof Row;
  /** Sort direction (default: false = descending) */
  ascending?: boolean;
}

/**
 * Base repository interface with common CRUD operations.
 */
export interface BaseRepository<Row, Insert, Update> {
  /**
   * Find all records with optional pagination and sorting.
   */
  findAll(options?: FindAllOptions<Row>): Promise<Row[]>;

  /**
   * Find a record by ID.
   * @throws {DatabaseError} If record not found or query fails
   */
  findById(id: string): Promise<Row>;

  /**
   * Find a record by a specific column value.
   * @returns The record or null if not found
   */
  findBy<K extends keyof Row>(column: K, value: Row[K]): Promise<Row | null>;

  /**
   * Create a new record.
   * @returns The created record with generated ID
   */
  create(data: Insert): Promise<Row>;

  /**
   * Update an existing record.
   * @returns The updated record
   */
  update(id: string, data: Update): Promise<Row>;

  /**
   * Delete a record by ID.
   */
  delete(id: string): Promise<void>;

  /**
   * Insert or update a record based on conflict column.
   * @param onConflict - Column to check for conflicts (default: 'id')
   */
  upsert(data: Insert, onConflict?: string): Promise<Row>;

  /**
   * Count total records in the table.
   */
  count(): Promise<number>;
}


/**
 * Creates a base repository for a specific table.
 *
 * @param supabase - Supabase client instance
 * @param tableName - Name of the database table
 * @returns Repository with CRUD operations
 *
 * @example
 * ```ts
 * const toolsRepo = createBaseRepository<ToolRow, ToolInsert, ToolUpdate>(
 *   supabase,
 *   'tools'
 * );
 * const tools = await toolsRepo.findAll({ limit: 10 });
 * ```
 */
export function createBaseRepository<
  Row extends Record<string, unknown>,
  Insert extends Record<string, unknown>,
  Update extends Record<string, unknown>
>(
  supabase: SupabaseClient<Database>,
  tableName: string
): BaseRepository<Row, Insert, Update> {
  /**
   * Helper to wrap Supabase errors in DatabaseError.
   */
  function wrapError(
    error: unknown,
    operation: string
  ): DatabaseError {
    const message = error instanceof Error ? error.message : String(error);
    return new DatabaseError(operation, tableName, message, error);
  }

  return {
    async findAll(options?: FindAllOptions<Row>): Promise<Row[]> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase.from(tableName as any).select('*');

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy as string, {
          ascending: options.ascending ?? false,
        });
      }

      // Apply pagination using range
      if (options?.limit !== undefined) {
        const offset = options.offset ?? 0;
        const to = offset + options.limit - 1;
        query = query.range(offset, to);
      } else if (options?.offset !== undefined) {
        // If only offset is provided, use range from offset
        query = query.range(options.offset, options.offset + 999);
      }

      const { data, error } = await query;

      if (error) {
        throw wrapError(error, 'findAll');
      }

      return (data ?? []) as unknown as Row[];
    },

    async findById(id: string): Promise<Row> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw wrapError(error, 'findById');
      }

      return data as unknown as Row;
    },

    async findBy<K extends keyof Row>(
      column: K,
      value: Row[K]
    ): Promise<Row | null> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .eq(column as string, value as string)
        .maybeSingle();

      if (error) {
        throw wrapError(error, 'findBy');
      }

      return data as unknown as Row | null;
    },

    async create(insertData: Insert): Promise<Row> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .insert(insertData as Record<string, unknown>)
        .select()
        .single();

      if (error) {
        throw wrapError(error, 'create');
      }

      return data as unknown as Row;
    },

    async update(id: string, updateData: Update): Promise<Row> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .update(updateData as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw wrapError(error, 'update');
      }

      return data as unknown as Row;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .delete()
        .eq('id', id);

      if (error) {
        throw wrapError(error, 'delete');
      }
    },

    async upsert(insertData: Insert, onConflict: string = 'id'): Promise<Row> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .upsert(insertData as Record<string, unknown>, { onConflict })
        .select()
        .single();

      if (error) {
        throw wrapError(error, 'upsert');
      }

      return data as unknown as Row;
    },

    async count(): Promise<number> {
      const { count, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw wrapError(error, 'count');
      }

      return count ?? 0;
    },
  };
}
