/**
 * Admin Setup Script for Dedicated Admin Authentication
 *
 * This script creates or updates an admin user in the dedicated `admins` table,
 * completely independent from Supabase Auth.
 *
 * Usage: npx tsx scripts/setup-admin-user.ts
 *
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - ADMIN_EMAIL (required)
 * - ADMIN_PASSWORD (required)
 *
 * Password requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 *
 * @module setup-admin-user
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables from .env file
dotenv.config();

/**
 * Number of salt rounds for bcrypt hashing (matches password.ts)
 */
const SALT_ROUNDS = 12;

/**
 * Password validation requirements
 */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
const PASSWORD_NUMBER_REGEX = /[0-9]/;

/**
 * Validate password strength requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 */
function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }

  if (!PASSWORD_UPPERCASE_REGEX.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 uppercase letter' };
  }

  if (!PASSWORD_NUMBER_REGEX.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 number' };
  }

  return { valid: true };
}

/**
 * Hash password using bcrypt with 12 salt rounds
 */
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

async function setupAdminUser() {
  console.log('');
  console.log('🔧 Admin User Setup (Dedicated Auth)');
  console.log('═'.repeat(50));
  console.log('');

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Check required Supabase credentials
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables:');
    if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseServiceKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nMake sure your .env file contains these variables.');
    process.exit(1);
  }

  // Check required admin credentials
  if (!adminEmail || !adminPassword) {
    console.error('❌ Missing admin credentials:');
    if (!adminEmail) console.error('   - ADMIN_EMAIL');
    if (!adminPassword) console.error('   - ADMIN_PASSWORD');
    console.error('\nSet these environment variables in your .env file.');
    process.exit(1);
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(adminPassword);
  if (!passwordValidation.valid) {
    console.error(`❌ Password validation failed: ${passwordValidation.error}`);
    console.error('\nPassword requirements:');
    console.error('   - Minimum 8 characters');
    console.error('   - At least 1 uppercase letter');
    console.error('   - At least 1 number');
    process.exit(1);
  }

  console.log(`📧 Email: ${adminEmail}`);
  console.log(`🔑 Password: ${'*'.repeat(adminPassword.length)}`);
  console.log('');

  try {
    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Hash the password
    console.log('🔐 Hashing password with bcrypt (12 rounds)...');
    const passwordHash = await hashPassword(adminPassword);

    // Upsert admin record (create or update)
    console.log('📝 Upserting admin record...');
    const { data, error } = await supabase
      .from('admins')
      .upsert(
        {
          email: adminEmail,
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
      console.error('❌ Failed to upsert admin record:', error.message);
      process.exit(1);
    }

    console.log('');
    console.log('✅ Admin user setup completed successfully!');
    console.log('');
    console.log('═'.repeat(50));
    console.log('📋 Admin Details:');
    console.log('─'.repeat(50));
    console.log(`   ID:       ${data.id}`);
    console.log(`   Email:    ${data.email}`);
    console.log(`   Active:   ${data.is_active}`);
    console.log(`   Created:  ${data.created_at}`);
    console.log('─'.repeat(50));
    console.log('');
    console.log('🚀 You can now login at: /admin/login');
    console.log('');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

setupAdminUser();
