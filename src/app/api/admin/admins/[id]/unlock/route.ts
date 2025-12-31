/**
 * Admin Unlock API Route
 *
 * POST /api/admin/admins/[id]/unlock - Unlock a locked admin account
 *
 * Requirements: 11.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminById, unlockAdmin } from '@/lib/services/admins.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/admins/[id]/unlock
 *
 * Unlock an admin account by clearing locked_until and resetting failed_login_attempts
 * Requirements: 11.8
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if admin exists
    const admin = await getAdminById(id);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Check if admin is actually locked
    if (admin.status !== 'locked') {
      return NextResponse.json(
        { error: 'Admin account is not locked' },
        { status: 400 }
      );
    }

    // Unlock admin
    const unlockedAdmin = await unlockAdmin(id);

    return NextResponse.json({
      success: true,
      admin: unlockedAdmin,
      message: 'Admin account has been unlocked',
    });
  } catch (error) {
    console.error('Error unlocking admin:', error);
    return NextResponse.json(
      { error: 'Failed to unlock admin' },
      { status: 500 }
    );
  }
}
