import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Singleton anonymous client instance.
 * Reusing the same instance is more efficient for serverless.
 */
let anonClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

/**
 * Creates an anonymous Supabase client for public read-only queries.
 * Uses singleton pattern for efficiency in serverless environments.
 * 
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
  if (anonClient) {
    return anonClient
  }

  anonClient = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return anonClient
}
