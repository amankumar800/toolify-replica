/**
 * Category Groups API Routes
 *
 * Handles CRUD operations for category groups.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { createClient } from '@/lib/supabase/server';
import { createCategoryGroupsRepository } from '@/lib/db/repositories';
import { categoryGroupSchema, validateFormData } from '@/lib/utils/admin-validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminCategoryGroupsAPI');

/**
 * GET /api/admin/category-groups
 * 
 * Fetches all category groups with category counts.
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit: adminRead (300 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminRead', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const supabase = await createClient();
    const repo = createCategoryGroupsRepository(supabase);

    const groups = await repo.findAllWithCategoryCount();

    return NextResponse.json({
      data: groups,
      total: groups.length,
    });
  } catch (error) {
    log.error('Error fetching category groups', error, { action: 'GET' });
    return NextResponse.json(
      { error: 'Failed to fetch category groups' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/category-groups
 * 
 * Creates a new category group.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const body = await request.json();

    // Validate form data
    const validation = validateFormData(categoryGroupSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const repo = createCategoryGroupsRepository(supabase);

    // Check for duplicate name
    const existing = await repo.findByName(validation.data.name);
    if (existing) {
      return NextResponse.json(
        { error: 'A category group with this name already exists' },
        { status: 409 }
      );
    }

    // Get next display order if not provided
    const display_order = validation.data.display_order ?? await repo.getNextDisplayOrder();

    // Create the category group
    const group = await repo.create({
      name: validation.data.name,
      icon_name: validation.data.icon_name || null,
      display_order,
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    log.error('Error creating category group', error, { action: 'POST' });
    return NextResponse.json(
      { error: 'Failed to create category group' },
      { status: 500 }
    );
  }
}
