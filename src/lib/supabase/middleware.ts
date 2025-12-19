import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Updates the Supabase session by refreshing the auth token.
 * Call this in your middleware to keep Supabase Auth sessions fresh.
 * 
 * Note: This is only needed if you're using Supabase Auth.
 * If you're using next-auth (like this project currently does),
 * you can skip this unless you migrate to Supabase Auth.
 * 
 * @example
 * ```ts
 * // In src/middleware.ts
 * import { updateSession } from '@/lib/supabase/middleware'
 * 
 * export async function middleware(request: NextRequest) {
 *   // Your existing middleware logic...
 *   
 *   // Add Supabase session refresh
 *   return await updateSession(request)
 * }
 * ```
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshing the auth token
  // IMPORTANT: Do not remove this line - it refreshes the session
  await supabase.auth.getUser()

  return supabaseResponse
}
