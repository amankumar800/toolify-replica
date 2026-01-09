/**
 * Admin User Item API Routes
 *
 * Provides REST API endpoints for individual admin user operations.
 *
 * GET /api/admin/admins/[id] - Get a single admin
 * PUT /api/admin/admins/[id] - Update an admin
 * DELETE /api/admin/admins/[id] - Delete an admin
 *
 * Requirements: 11.3, 11.4, 11.5, 11.9, 11.10
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { getAdminById, updateAdmin, deleteAdmin } from '@/lib/services/admins.service';
import { getAdminFromRequest } from '@/lib/services/admin-auth.service';
import { adminEditSchema } from '@/lib/utils/admin-validation';
import { checkRateLimit } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/admins/[id]
 *
 * Get a single admin by ID
 * Requirements: 11.5
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit: adminRead (300 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminRead', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const { id } = await params;
    const admin = await getAdminById(id);

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(admin);
  } catch (error) {
    console.error('Error fetching admin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/admins/[id]
 *
 * Update an admin
 * Requirements: 11.4, 11.10
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    // Get current admin to check for last active admin
    const currentAdmin = await getAdminById(id);
    if (!currentAdmin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Get the logged-in admin
    const loggedInAdmin = await getAdminFromRequest();

    // Validate input
    const validationResult = adminEditSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Update admin
    const admin = await updateAdmin(id, validationResult.data, loggedInAdmin?.id);

    return NextResponse.json(admin);
  } catch (error) {
    console.error('Error updating admin:', error);
    const message = error instanceof Error ? error.message : 'Failed to update admin';
    
    // Check for specific errors
    if (message.includes('already exists')) {
      return NextResponse.json(
        { error: message },
        { status: 409 }
      );
    }
    
    if (message.includes('last active admin')) {
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/admins/[id]
 *
 * Delete an admin
 * Requirements: 11.3, 11.9
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const { id } = await params;

    // Get the logged-in admin
    const loggedInAdmin = await getAdminFromRequest();
    if (!loggedInAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if admin exists
    const admin = await getAdminById(id);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    await deleteAdmin(id, loggedInAdmin.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting admin:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete admin';
    
    // Check for self-deletion error
    if (message.includes('own account')) {
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
