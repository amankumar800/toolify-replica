/**
 * User favorites repository with specialized queries for the user_favorites table.
 * Extends base repository with user favorite-specific operations.
 *
 * @module user-favorites.repository
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  UserFavoriteRow as GeneratedUserFavoriteRow,
  UserFavoriteInsert as GeneratedUserFavoriteInsert,
  UserFavoriteUpdate as GeneratedUserFavoriteUpdate,
} from '@/lib/supabase/types';
import { DatabaseError } from '../errors';
import { TABLES } from '../constants/tables';
import {
  createBaseRepository,
  type BaseRepository,
} from './base.repository';

/**
 * User favorite row type from database.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type UserFavoriteRow = GeneratedUserFavoriteRow & { [key: string]: unknown };

/**
 * User favorite insert type for creating new favorites.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type UserFavoriteInsert = GeneratedUserFavoriteInsert & { [key: string]: unknown };

/**
 * User favorite update type for partial updates.
 * Uses auto-generated types from Supabase with index signature for compatibility.
 */
export type UserFavoriteUpdate = GeneratedUserFavoriteUpdate & { [key: string]: unknown };

/**
 * Maximum number of shortcuts allowed per user.
 * Enforced by database trigger.
 */
export const MAX_SHORTCUTS_PER_USER = 20;

/**
 * User favorites repository interface extending base repository.
 */
export interface UserFavoritesRepository
  extends BaseRepository<UserFavoriteRow, UserFavoriteInsert, UserFavoriteUpdate> {
  /** Find all favorites for a user */
  findByUser(userEmail: string): Promise<UserFavoriteRow[]>;
  /** Find all shortcuts for a user */
  findShortcuts(userEmail: string): Promise<UserFavoriteRow[]>;
  /** Check if a tool is favorited by a user */
  isFavorited(userEmail: string, toolId: string): Promise<boolean>;
  /** Add a tool to user's favorites */
  addFavorite(userEmail: string, toolId: string, toolName?: string, categoryId?: string): Promise<UserFavoriteRow>;
  /** Remove a tool from user's favorites */
  removeFavorite(userEmail: string, toolId: string): Promise<void>;
  /** Toggle favorite status for a tool */
  toggleFavorite(userEmail: string, toolId: string, toolName?: string, categoryId?: string): Promise<boolean>;
  /** Set a favorite as a shortcut */
  setAsShortcut(userEmail: string, toolId: string): Promise<UserFavoriteRow>;
  /** Remove shortcut status from a favorite */
  removeShortcut(userEmail: string, toolId: string): Promise<UserFavoriteRow>;
  /** Update shortcut display order */
  reorderShortcuts(userEmail: string, toolIds: string[]): Promise<void>;
  /** Update custom icon color for a favorite */
  updateIconColor(userEmail: string, toolId: string, color: string | null): Promise<UserFavoriteRow>;
  /** Count shortcuts for a user */
  countShortcuts(userEmail: string): Promise<number>;
}


/**
 * Creates a user favorites repository with specialized queries.
 *
 * @param supabase - Supabase client instance
 * @returns User favorites repository with CRUD and specialized operations
 *
 * @example
 * ```ts
 * const favoritesRepo = createUserFavoritesRepository(supabase);
 * const favorites = await favoritesRepo.findByUser('user@example.com');
 * ```
 */
export function createUserFavoritesRepository(
  supabase: SupabaseClient<Database>
): UserFavoritesRepository {
  const tableName = TABLES.USER_FAVORITES;
  const baseRepo = createBaseRepository<UserFavoriteRow, UserFavoriteInsert, UserFavoriteUpdate>(
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

    async findByUser(userEmail: string): Promise<UserFavoriteRow[]> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });

      if (error) {
        throw wrapError(error, 'findByUser');
      }

      return (data ?? []) as unknown as UserFavoriteRow[];
    },

    async findShortcuts(userEmail: string): Promise<UserFavoriteRow[]> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*')
        .eq('user_email', userEmail)
        .eq('is_shortcut', true)
        .order('display_order', { ascending: true });

      if (error) {
        throw wrapError(error, 'findShortcuts');
      }

      return (data ?? []) as unknown as UserFavoriteRow[];
    },

    async isFavorited(userEmail: string, toolId: string): Promise<boolean> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('id')
        .eq('user_email', userEmail)
        .eq('tool_id', toolId)
        .maybeSingle();

      if (error) {
        throw wrapError(error, 'isFavorited');
      }

      return data !== null;
    },

    async addFavorite(
      userEmail: string,
      toolId: string,
      toolName?: string,
      categoryId?: string
    ): Promise<UserFavoriteRow> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .insert({
          user_email: userEmail,
          tool_id: toolId,
          tool_name: toolName,
          category_id: categoryId,
          is_shortcut: false,
          display_order: 0,
        })
        .select()
        .single();

      if (error) {
        throw wrapError(error, 'addFavorite');
      }

      return data as unknown as UserFavoriteRow;
    },

    async removeFavorite(userEmail: string, toolId: string): Promise<void> {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .delete()
        .eq('user_email', userEmail)
        .eq('tool_id', toolId);

      if (error) {
        throw wrapError(error, 'removeFavorite');
      }
    },

    async toggleFavorite(
      userEmail: string,
      toolId: string,
      toolName?: string,
      categoryId?: string
    ): Promise<boolean> {
      const isFav = await this.isFavorited(userEmail, toolId);

      if (isFav) {
        await this.removeFavorite(userEmail, toolId);
        return false;
      } else {
        await this.addFavorite(userEmail, toolId, toolName, categoryId);
        return true;
      }
    },

    async setAsShortcut(userEmail: string, toolId: string): Promise<UserFavoriteRow> {
      // The database trigger will enforce the 20 shortcut limit
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .update({ is_shortcut: true })
        .eq('user_email', userEmail)
        .eq('tool_id', toolId)
        .select()
        .single();

      if (error) {
        throw wrapError(error, 'setAsShortcut');
      }

      return data as unknown as UserFavoriteRow;
    },

    async removeShortcut(userEmail: string, toolId: string): Promise<UserFavoriteRow> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .update({ is_shortcut: false })
        .eq('user_email', userEmail)
        .eq('tool_id', toolId)
        .select()
        .single();

      if (error) {
        throw wrapError(error, 'removeShortcut');
      }

      return data as unknown as UserFavoriteRow;
    },

    async reorderShortcuts(userEmail: string, toolIds: string[]): Promise<void> {
      // Update display_order for each shortcut based on position in array
      for (let i = 0; i < toolIds.length; i++) {
        const { error } = await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from(tableName as any)
          .update({ display_order: i })
          .eq('user_email', userEmail)
          .eq('tool_id', toolIds[i])
          .eq('is_shortcut', true);

        if (error) {
          throw wrapError(error, 'reorderShortcuts');
        }
      }
    },

    async updateIconColor(
      userEmail: string,
      toolId: string,
      color: string | null
    ): Promise<UserFavoriteRow> {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .update({ custom_icon_color: color })
        .eq('user_email', userEmail)
        .eq('tool_id', toolId)
        .select()
        .single();

      if (error) {
        throw wrapError(error, 'updateIconColor');
      }

      return data as unknown as UserFavoriteRow;
    },

    async countShortcuts(userEmail: string): Promise<number> {
      const { count, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .select('*', { count: 'exact', head: true })
        .eq('user_email', userEmail)
        .eq('is_shortcut', true);

      if (error) {
        throw wrapError(error, 'countShortcuts');
      }

      return count ?? 0;
    },
  };
}
