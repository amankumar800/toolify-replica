/**
 * Admin Reset Password API Route
 *
 * POST /api/admin/admins/[id]/reset-password - Reset admin password
 *
 * Requirements: 11.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { getAdminById, resetAdminPassword } from '@/lib/services/admins.service';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminAdminsResetPasswordAPI');

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/admins/[id]/reset-password
 *
 * Reset admin password and return the new password (displayed once)
 * Requirements: 11.7
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check if admin exists
    const admin = await getAdminById(id);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Reset password
    const newPassword = await resetAdminPassword(id);

    return NextResponse.json({
      success: true,
      newPassword,
      message: 'Password has been reset. Please save this password as it will only be shown once.',
    });
  } catch (error) {
    log.error('Error resetting password', error, { action: 'POST' });
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
