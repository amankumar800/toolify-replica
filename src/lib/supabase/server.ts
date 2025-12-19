import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * Creates a Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * This client handles cookie-based session management automatically.
 * 
 * @example
 * ```tsx
 * // In a Server Component
 * import { createClient } from '@/lib/supabase/server'
 * 
 * export default async function Page() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('posts').select()
 *   return <div>{JSON.stringify(data)}</div>
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // In a Server Action
 * 'use server'
 * import { createClient } from '@/lib/supabase/server'
 * 
 * export async function createPost(formData: FormData) {
 *   const supabase = await createClient()
 *   await supabase.from('posts').insert({ title: formData.get('title') })
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}
