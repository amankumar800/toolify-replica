import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Singleton Supabase client instance for browser.
 * Reusing the same instance prevents creating multiple connections.
 */
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Creates a Supabase client for use in Client Components (browser).
 * Uses singleton pattern to prevent multiple client instances.
 * 
 * This client runs in the browser and is suitable for:
 * - Client-side data fetching
 * - Real-time subscriptions
 * - Client-side authentication flows
 * 
 * @example
 * ```tsx
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 * 
 * export function MyComponent() {
 *   const supabase = createClient()
 *   // Use supabase client...
 * }
 * ```
 */
export function createClient() {
  if (browserClient) {
    return browserClient
  }

  browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return browserClient
}
