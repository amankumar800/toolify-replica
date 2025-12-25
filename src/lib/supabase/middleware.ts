import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'

/**
 * Result of updating the Supabase session
 */
export interface UpdateSessionResult {
  /** The NextResponse with updated cookies */
  response: NextResponse
  /** The authenticated user, or null if not authenticated */
  user: User | null
  /** Error message if session refresh failed */
  error?: string
}

/**
 * Updates the Supabase session by refreshing the auth token.
 * Call this in your middleware to keep Supabase Auth sessions fresh.
 * 
 * This function:
 * 1. Creates a Supabase server client with cookie handlers
 * 2. Calls getUser() to validate and refresh the session
 * 3. Updates both request and response cookies with refreshed session
 * 4. Clears cookies if session refresh fails due to expired tokens
 * 
 * @example
 * ```ts
 * // In src/middleware.ts
 * import { updateSession } from '@/lib/supabase/middleware'
 * 
 * export async function middleware(request: NextRequest) {
 *   const { response, user, error } = await updateSession(request)
 *   
 *   // Check if user is authenticated for protected routes
 *   if (!user && request.nextUrl.pathname.startsWith('/admin')) {
 *     return NextResponse.redirect(new URL('/login', request.url))
 *   }
 *   
 *   return response
 * }
 * ```
 */
export async function updateSession(request: NextRequest): Promise<UpdateSessionResult> {
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
          // Update request cookies for downstream handlers
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Create new response with updated request
          supabaseResponse = NextResponse.next({
            request,
          })
          // Set cookies on response for browser
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshing the auth token using getUser() for secure validation
  // IMPORTANT: getUser() validates the JWT with Supabase Auth server
  // This is more secure than getSession() which only reads from cookies
  const { data: { user }, error } = await supabase.auth.getUser()

  // If there's an error (e.g., expired token), the setAll callback above
  // will have already been called to clear/update the cookies
  if (error) {
    return {
      response: supabaseResponse,
      user: null,
      error: error.message
    }
  }

  return {
    response: supabaseResponse,
    user: user ?? null
  }
}
