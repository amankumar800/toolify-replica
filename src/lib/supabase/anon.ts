import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Creates an anonymous Supabase client for public read-only queries.
 * This client does NOT use cookies and can be safely used inside unstable_cache().
 * 
 * Use this for:
 * - Public data fetching that doesn't require authentication
 * - Cached queries where cookies() cannot be called
 * 
 * Do NOT use this for:
 * - Authenticated operations
 * - Admin operations
 * - Any operation that requires user context
 */
export function createAnonClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
