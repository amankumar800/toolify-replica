/**
 * Admin Setup Script
 * 
 * Usage: npx tsx scripts/setup-admin.ts
 * 
 * This script:
 * 1. Creates an admin user if doesn't exist
 * 2. Sets role: 'admin' in user_metadata
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - ADMIN_EMAIL (optional, defaults to admin@aitoolsbook.com)
 * - ADMIN_PASSWORD (optional, defaults to Admin@123!Secure)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:');
    if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseServiceKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nMake sure your .env file contains these variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Admin credentials - can be overridden via environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@aitoolsbook.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123!Secure';

async function setupAdmin() {
    console.log('');
    console.log('🔧 Admin User Setup');
    console.log('═'.repeat(50));
    console.log('');
    console.log(`📧 Email:    ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
    console.log('');

    try {
        // Check if user already exists
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error('❌ Failed to list users:', listError.message);
            process.exit(1);
        }

        const existingAdmin = existingUsers?.users.find(u => u.email === ADMIN_EMAIL);

        if (existingAdmin) {
            console.log('ℹ️  User already exists. Updating to admin role...');

            // Update user metadata to set admin role
            const { error: updateError } = await supabase.auth.admin.updateUserById(
                existingAdmin.id,
                { user_metadata: { role: 'admin' } }
            );

            if (updateError) {
                console.error('❌ Failed to update user:', updateError.message);
                process.exit(1);
            }

            console.log('');
            console.log('✅ User promoted to admin successfully!');
            console.log(`   User ID: ${existingAdmin.id}`);
        } else {
            // Create new admin user
            console.log('📝 Creating new admin user...');

            const { data, error } = await supabase.auth.admin.createUser({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                email_confirm: true, // Auto-confirm email
                user_metadata: { role: 'admin' }
            });

            if (error) {
                console.error('❌ Failed to create admin user:', error.message);
                process.exit(1);
            }

            console.log('');
            console.log('✅ Admin user created successfully!');
            console.log(`   User ID: ${data.user.id}`);
        }

        console.log('');
        console.log('═'.repeat(50));
        console.log('📋 Admin Credentials:');
        console.log('─'.repeat(50));
        console.log(`   Email:    ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
        console.log('─'.repeat(50));
        console.log('');
        console.log('⚠️  IMPORTANT: Change the password after first login!');
        console.log('');
        console.log('🚀 You can now login at: /login');
        console.log('   Then access admin panel at: /admin');
        console.log('');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    }
}

setupAdmin();
