import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

/**
 * Auth callback route handler for Supabase Auth.
 * Handles two authentication flows:
 * 
 * 1. Code Exchange (OAuth/Magic Links):
 *    - Receives `code` query parameter
 *    - Exchanges code for session via exchangeCodeForSession
 * 
 * 2. OTP Token Verification (Email Confirmation):
 *    - Receives `token_hash` and `type` query parameters
 *    - Verifies OTP token via verifyOtp
 * 
 * @param request - The incoming request
 * @returns Redirect response to destination or login with error
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  // Extract query parameters
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next')

  // Validate next param to prevent open redirect vulnerabilities
  // Only allow relative paths starting with '/'
  const redirectTo = next?.startsWith('/') ? next : '/'

  // Helper for error redirects
  const errorRedirect = (error: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`)

  // Flow 1: Code Exchange (OAuth/Magic Link)
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return errorRedirect('exchange_failed')
    }

    return NextResponse.redirect(`${origin}${redirectTo}`)
  }

  // Flow 2: OTP Token Verification (Email Confirmation)
  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    })

    if (error) {
      return errorRedirect('verification_failed')
    }

    return NextResponse.redirect(`${origin}${redirectTo}`)
  }

  // No valid parameters provided
  return errorRedirect('missing_code')
}
