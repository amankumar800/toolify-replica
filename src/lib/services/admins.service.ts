/**
 * Admins Service
 *
 * Handles all admin user management operations including listing,
 * creating, updating, and deleting admin accounts.
 *
 * Requirements: 11.1-11.10
 *
 * @module admins.service
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createAdminsRepository, type AdminRecord } from '@/lib/db/repositories/admins.repository';
import { hashPassword } from '@/lib/utils/password';
import type { AdminFilters, ListResponse, PaginationParams, SortParams } from './admin-crud.types';

// ============================================================================
// Types
// ============================================================================

/**
 * Admin status for display
 */
export type AdminStatus = 'active' | 'inactive' | 'locked';

/**
 * Admin list item with computed status
 */
export interface AdminListItem {
  id: string;
  email: string;
  status: AdminStatus;
  is_active: boolean;
  last_login_at: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
  created_at: string | null;
}

/**
 * Admin detail for edit form
 */
export interface AdminDetail extends AdminListItem {
  updated_at: string | null;
}

/**
 * Admin create data
 */
export interface AdminCreateData {
  email: string;
  password: string;
  is_active?: boolean;
}

/**
 * Admin update data
 */
export interface AdminUpdateData {
  email?: string;
  password?: string;
  is_active?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate admin status based on is_active and locked_until
 * Requirements: 11.2
 *
 * Property 18: Admin Status Badge
 * - Green for active (is_active=true, locked_until=null or past)
 * - Gray for inactive (is_active=false)
 * - Red for locked (locked_until > now)
 */
export function calculateAdminStatus(admin: AdminRecord): AdminStatus {
  // Check if locked first (takes priority)
  if (admin.locked_until) {
    const lockedUntil = new Date(admin.locked_until);
    if (lockedUntil > new Date()) {
      return 'locked';
    }
  }

  // Check if inactive
  if (admin.is_active === false) {
    return 'inactive';
  }

  // Default to active
  return 'active';
}

/**
 * Map admin record to list item with computed status
 */
function mapToListItem(admin: AdminRecord): AdminListItem {
  return {
    id: admin.id,
    email: admin.email,
    status: calculateAdminStatus(admin),
    is_active: admin.is_active ?? true,
    last_login_at: admin.last_login_at,
    failed_login_attempts: admin.failed_login_attempts ?? 0,
    locked_until: admin.locked_until,
    created_at: admin.created_at,
  };
}

/**
 * Map admin record to detail
 */
function mapToDetail(admin: AdminRecord): AdminDetail {
  return {
    ...mapToListItem(admin),
    updated_at: admin.updated_at,
  };
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * List admins with pagination, sorting, and filtering
 * Requirements: 11.1
 */
export async function listAdmins(params: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: AdminFilters;
}): Promise<ListResponse<AdminListItem>> {
  const {
    page = 1,
    pageSize = 20,
    sortBy = 'created_at',
    sortDirection = 'desc',
    filters = {},
  } = params;

  const supabase = createAdminClient();

  // Build query
  let query = supabase
    .from('admins')
    .select('*', { count: 'exact' });

  // Apply search filter
  if (filters.search) {
    query = query.ilike('email', `%${filters.search}%`);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortDirection === 'asc' });

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list admins: ${error.message}`);
  }

  const total = count ?? 0;
  const admins = (data ?? []).map(mapToListItem);

  return {
    data: admins,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get admin by ID
 */
export async function getAdminById(id: string): Promise<AdminDetail | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get admin: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapToDetail(data as AdminRecord);
}

/**
 * Create a new admin
 * Requirements: 11.4, 11.6
 *
 * Property 19: Password Hashing
 * Password is hashed using bcrypt before storage
 */
export async function createAdmin(data: AdminCreateData): Promise<AdminDetail> {
  const supabase = createAdminClient();

  // Hash password
  const passwordHash = await hashPassword(data.password);

  const { data: admin, error } = await supabase
    .from('admins')
    .insert({
      email: data.email,
      password_hash: passwordHash,
      is_active: data.is_active ?? true,
      failed_login_attempts: 0,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('An admin with this email already exists');
    }
    throw new Error(`Failed to create admin: ${error.message}`);
  }

  return mapToDetail(admin as AdminRecord);
}

/**
 * Update an admin
 * Requirements: 11.4, 11.10
 */
export async function updateAdmin(
  id: string,
  data: AdminUpdateData,
  currentAdminId?: string
): Promise<AdminDetail> {
  const supabase = createAdminClient();

  // If deactivating, check if this is the last active admin
  if (data.is_active === false) {
    const { count, error: countError } = await supabase
      .from('admins')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .neq('id', id);

    if (countError) {
      throw new Error(`Failed to check active admins: ${countError.message}`);
    }

    if ((count ?? 0) === 0) {
      throw new Error('Cannot deactivate the last active admin');
    }
  }

  // Build update object
  const updateData: Record<string, unknown> = {};

  if (data.email !== undefined) {
    updateData.email = data.email;
  }

  if (data.is_active !== undefined) {
    updateData.is_active = data.is_active;
  }

  if (data.password) {
    updateData.password_hash = await hashPassword(data.password);
  }

  const { data: admin, error } = await supabase
    .from('admins')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('An admin with this email already exists');
    }
    throw new Error(`Failed to update admin: ${error.message}`);
  }

  return mapToDetail(admin as AdminRecord);
}

/**
 * Delete an admin
 * Requirements: 11.3, 11.9
 */
export async function deleteAdmin(id: string, currentAdminId: string): Promise<void> {
  // Prevent self-deletion
  if (id === currentAdminId) {
    throw new Error('Cannot delete your own account');
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('admins')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete admin: ${error.message}`);
  }
}

/**
 * Reset admin password
 * Requirements: 11.7
 *
 * Generates a new random password and returns it (displayed once to user)
 */
export async function resetAdminPassword(id: string): Promise<string> {
  const supabase = createAdminClient();

  // Generate a random password
  const newPassword = generateRandomPassword();

  // Hash and update
  const passwordHash = await hashPassword(newPassword);

  const { error } = await supabase
    .from('admins')
    .update({ password_hash: passwordHash })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to reset password: ${error.message}`);
  }

  return newPassword;
}

/**
 * Unlock an admin account
 * Requirements: 11.8
 *
 * Clears locked_until and resets failed_login_attempts to 0
 */
export async function unlockAdmin(id: string): Promise<AdminDetail> {
  const supabase = createAdminClient();

  const { data: admin, error } = await supabase
    .from('admins')
    .update({
      locked_until: null,
      failed_login_attempts: 0,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to unlock admin: ${error.message}`);
  }

  return mapToDetail(admin as AdminRecord);
}

/**
 * Get count of active admins
 */
export async function getActiveAdminCount(): Promise<number> {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from('admins')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to count active admins: ${error.message}`);
  }

  return count ?? 0;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a random password that meets requirements:
 * - At least 12 characters
 * - Contains uppercase, lowercase, numbers, and special characters
 */
function generateRandomPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';

  // Ensure at least one of each type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest with random characters
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
