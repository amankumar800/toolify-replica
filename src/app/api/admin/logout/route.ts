/**
 * Admin Logout API Route
 * 
 * Handles POST requests for admin logout.
 * Clears the admin_session cookie and redirects to login page.
 * 
 * @module api/admin/logout
 */

import { NextResponse } from 'next/server';
import { COOKIE_NAME, COOKIE_PATH } from '@/lib/services/admin-auth.service';

/**
 * POST /api/admin/logout
 * 
 * Log out the current admin by clearing the session cookie.
 * 
 * Response:
 * - 302: Redirect to /admin/login
 * 
 * Requirements:
 * - 7.1: Clear admin_session cookie
 * - 7.2: Redirect to /admin/login
 * - 7.3: Provide logout endpoint at /api/admin/logout
 */
export async function POST() {
  // Create redirect response to /admin/login (Req 7.2)
  const response = NextResponse.redirect(new URL('/admin/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
  
  // Clear the admin_session cookie (Req 7.1)
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: COOKIE_PATH,
    maxAge: 0, // Expire immediately
  });

  return response;
}
