/**
 * Admins repository for dedicated admin authentication.
 * Provides data access for admin credentials and login tracking.
 *
 * @module admins.repository
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { DatabaseError } from '../errors';

/**
 * Admin record type from database.
 */
export interface AdminRecord {
  id: string;
  email: string;
  password_hash: string;
  is_active: boolean | null;
  last_login_at: string | null;
  failed_login_attempts: number | null;
  locked_until: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Admin insert type for creating new admins.
 */
export interface AdminInsert {
  email: string;
  password_hash: string;
  is_active?: boolean;
}

/**
 * Lockout duration in milliseconds (15 minutes).
 */
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

/**
 * Maximum failed login attempts before lockout.
 */
export const MAX_FAILED_ATTEMPTS = 5;

/**
 * Admins repository interface.
 */
export interface AdminsRepository {
  /**
   * Find an admin by email address.
   * @param email - Admin email to search for
   * @returns Admin record or null if not found
   */
  findByEmail(email: string): Promise<AdminRecord | null>;

  /**
   * Record a successful login.
   * Updates last_login_at and resets failed_login_attempts to 0.
   * @param id - Admin ID
   */
  recordSuccessfulLogin(id: string): Promise<void>;

  /**
   * Record a failed login attempt.
   * Increments failed_login_attempts by 1.
   * @param id - Admin ID
   * @returns New failed login attempt count
   */
  recordFailedLogin(id: string): Promise<number>;

  /**
   * Lock an admin account for 15 minutes.
   * Sets locked_until to current time + 15 minutes.
   * @param id - Admin ID
   */
  lockAccount(id: string): Promise<void>;

  /**
   * Create or update an admin record.
   * If admin with email exists, updates password_hash.
   * Otherwise creates new admin.
   * @param email - Admin email
   * @param passwordHash - bcrypt hashed password
   * @returns Created or updated admin record
   */
  upsertAdmin(email: string, passwordHash: string): Promise<AdminRecord>;
}

/**
 * Check if an admin account is currently locked.
 * Pure function that doesn't require database access.
 * @param admin - Admin record to check
 * @returns true if account is locked, false otherwise
 */
export function isAccountLocked(admin: AdminRecord): boolean {
  if (!admin.locked_until) {
    return false;
  }
  const lockedUntil = new Date(admin.locked_until);
  return lockedUntil > new Date();
}

/**
 * Table name for admins.
 */
const TABLE_NAME = 'admins';

/**
 * Creates an admins repository with authentication-specific operations.
 *
 * @param supabase - Supabase client instance (should be admin client with service role)
 * @returns Admins repository
 *
 * @example
 * ```ts
 * import { createAdminClient } from '@/lib/supabase/admin';
 * const supabase = createAdminClient();
 * const adminsRepo = createAdminsRepository(supabase);
 * const admin = await adminsRepo.findByEmail('admin@example.com');
 * ```
 */
export function createAdminsRepository(
  supabase: SupabaseClient<Database>
): AdminsRepository {
  /**
   * Helper to wrap Supabase errors in DatabaseError.
   */
  function wrapError(error: unknown, operation: string): DatabaseError {
    const message = error instanceof Error ? error.message : String(error);
    return new DatabaseError(operation, TABLE_NAME, message, error);
  }

  return {
    async findByEmail(email: string): Promise<AdminRecord | null> {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        throw wrapError(error, 'findByEmail');
      }

      return data as AdminRecord | null;
    },

    async recordSuccessfulLogin(id: string): Promise<void> {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({
          last_login_at: new Date().toISOString(),
          failed_login_attempts: 0,
          locked_until: null,
        })
        .eq('id', id);

      if (error) {
        throw wrapError(error, 'recordSuccessfulLogin');
      }
    },

    async recordFailedLogin(id: string): Promise<number> {
      // First, get current failed_login_attempts
      const { data: admin, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select('failed_login_attempts')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw wrapError(fetchError, 'recordFailedLogin');
      }

      const currentAttempts = admin?.failed_login_attempts ?? 0;
      const newAttempts = currentAttempts + 1;

      // Update with incremented value
      const { error: updateError } = await supabase
        .from(TABLE_NAME)
        .update({ failed_login_attempts: newAttempts })
        .eq('id', id);

      if (updateError) {
        throw wrapError(updateError, 'recordFailedLogin');
      }

      return newAttempts;
    },

    async lockAccount(id: string): Promise<void> {
      const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();

      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ locked_until: lockedUntil })
        .eq('id', id);

      if (error) {
        throw wrapError(error, 'lockAccount');
      }
    },

    async upsertAdmin(email: string, passwordHash: string): Promise<AdminRecord> {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .upsert(
          {
            email,
            password_hash: passwordHash,
            is_active: true,
            failed_login_attempts: 0,
            locked_until: null,
          },
          { onConflict: 'email' }
        )
        .select()
        .single();

      if (error) {
        throw wrapError(error, 'upsertAdmin');
      }

      return data as AdminRecord;
    },
  };
}
