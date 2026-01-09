/**
 * Admin Users API Routes
 *
 * Provides REST API endpoints for admin user management.
 *
 * GET /api/admin/admins - List admins with pagination, filtering, sorting
 * POST /api/admin/admins - Create a new admin
 *
 * Requirements: 11.1, 11.4, 11.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { listAdmins, createAdmin } from '@/lib/services/admins.service';
import { adminCreateSchema } from '@/lib/utils/admin-validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';
import type { AdminFilters } from '@/lib/services/admin-crud.types';

const log = createLogger('AdminAdminsAPI');

/**
 * GET /api/admin/admins
 *
 * List admins with pagination, filtering, and sorting
 * Requirements: 11.1
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit: adminRead (300 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminRead', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const searchParams = request.nextUrl.searchParams;

    // Parse pagination
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);

    // Parse sorting
    const sortBy = searchParams.get('sortBy') ?? 'created_at';
    const sortDirection = (searchParams.get('sortDirection') ?? 'desc') as 'asc' | 'desc';

    // Parse filters
    const filters: AdminFilters = {};

    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    const result = await listAdmins({
      page,
      pageSize,
      sortBy,
      sortDirection,
      filters,
    });

    return NextResponse.json(result);
  } catch (error) {
    log.error('Error listing admins', error, { action: 'GET' });
    return NextResponse.json(
      { error: 'Failed to list admins' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/admins
 *
 * Create a new admin
 * Requirements: 11.4, 11.6
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const body = await request.json();

    // Validate input
    const validationResult = adminCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Create admin
    const admin = await createAdmin(validationResult.data);

    return NextResponse.json(admin, { status: 201 });
  } catch (error) {
    log.error('Error creating admin', error, { action: 'POST' });
    const message = error instanceof Error ? error.message : 'Failed to create admin';
    
    // Check for duplicate email error
    if (message.includes('already exists')) {
      return NextResponse.json(
        { error: message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
