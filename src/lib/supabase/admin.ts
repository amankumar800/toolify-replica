import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Creates a Supabase client with SERVICE ROLE key.
 * 
 * ⚠️ WARNING: This client bypasses all Row Level Security (RLS) policies.
 * ONLY use this server-side for admin operations that require elevated privileges.
 * 
 * NEVER expose this client to the browser or client-side code.
 * NEVER import this module in Client Components.
 * 
 * Use cases:
 * - Data migration scripts
 * - Admin dashboard operations
 * - Scraper database writes
 * - Background jobs that need to bypass RLS
 * 
 * @example
 * ```ts
 * // In a server action or API route
 * import { createAdminClient } from '@/lib/supabase/admin'
 * 
 * export async function adminOperation() {
 *   const supabase = createAdminClient()
 *   // This bypasses RLS - use with caution
 *   await supabase.from('tools').insert({ name: 'New Tool', ... })
 * }
 * ```
 * 
 * @throws {Error} If SUPABASE_SERVICE_ROLE_KEY environment variable is missing
 * @returns Supabase client with service role privileges
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing Supabase admin credentials: NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials: SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
