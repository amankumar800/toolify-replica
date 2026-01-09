/**
 * Admin Login API Route
 * 
 * Handles POST requests for admin authentication.
 * 
 * Flow:
 * 1. Validate request body (email and password required)
 * 2. Validate email format
 * 3. Authenticate via admin auth service
 * 4. Set httpOnly cookie on success
 * 5. Return appropriate response
 * 
 * @module api/admin/login
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  loginAdmin,
  COOKIE_NAME,
  getAdminCookieOptions,
  ERROR_ACCOUNT_LOCKED,
} from '@/lib/services/admin-auth.service';
import { validateEmail } from '@/lib/utils/validation';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/admin/login
 * 
 * Authenticate an admin user with email and password.
 * 
 * Request body:
 * - email: string (required)
 * - password: string (required)
 * 
 * Response:
 * - 200: { success: true } - Login successful, cookie set
 * - 400: { success: false, error: string } - Validation error
 * - 401: { success: false, error: string } - Invalid credentials
 * - 423: { success: false, error: string } - Account locked
 * - 500: { success: false, error: string } - Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Apply strict rate limiting for login attempts (5 per 15 minutes per IP)
    const rateLimitResponse = await checkRateLimit(request, {
      type: 'login',
      useAuth: false, // Use IP-based limiting for login
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parse JSON body
    let body: { email?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // Validate required fields (Req 8.4 - generic messages)
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format before processing (Req 2.6)
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { success: false, error: emailValidation.error },
        { status: 400 }
      );
    }

    // Attempt login via admin auth service (Req 2.2, 2.3)
    const result = await loginAdmin(email, password);

    if (!result.success) {
      // Use 423 for locked accounts, 401 for other auth failures
      const status = result.error === ERROR_ACCOUNT_LOCKED ? 423 : 401;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    // Success - set httpOnly, secure, sameSite=strict cookie (Req 3.3)
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, result.token!, getAdminCookieOptions());
    
    return response;
  } catch (error) {
    // Log error internally but return generic message (Req 8.4)
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
