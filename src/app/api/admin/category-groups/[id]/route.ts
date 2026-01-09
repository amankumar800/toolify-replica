/**
 * Category Group API Routes (by ID)
 *
 * Handles individual category group operations.
 *
 * Requirements: 4.3, 4.4, 4.5, 4.6, 4.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { createClient } from '@/lib/supabase/server';
import { createCategoryGroupsRepository } from '@/lib/db/repositories';
import { categoryGroupSchema, validateFormData } from '@/lib/utils/admin-validation';
import { checkRateLimit } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/category-groups/[id]
 * 
 * Fetches a single category group by ID.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit: adminRead (300 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminRead', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();
    const repo = createCategoryGroupsRepository(supabase);

    const group = await repo.findById(id);
    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching category group:', error);
    return NextResponse.json(
      { error: 'Category group not found' },
      { status: 404 }
    );
  }
}


/**
 * PUT /api/admin/category-groups/[id]
 * 
 * Updates a category group.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const { id } = await params;
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

    // Check for duplicate name (excluding current group)
    const existing = await repo.findByName(validation.data.name);
    if (existing && existing.id !== id) {
      return NextResponse.json(
        { error: 'A category group with this name already exists' },
        { status: 409 }
      );
    }

    // Update the category group
    const group = await repo.update(id, {
      name: validation.data.name,
      icon_name: validation.data.icon_name || null,
      display_order: validation.data.display_order,
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error updating category group:', error);
    return NextResponse.json(
      { error: 'Failed to update category group' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/category-groups/[id]
 * 
 * Deletes a category group (only if no categories are assigned).
 * Requirements: 4.5, 4.6, 4.7
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();
    const repo = createCategoryGroupsRepository(supabase);

    // Check if group can be deleted
    const { canDelete, categories } = await repo.canDelete(id);

    if (!canDelete) {
      return NextResponse.json(
        {
          error: 'Cannot delete category group with assigned categories',
          categories: categories,
        },
        { status: 400 }
      );
    }

    // Delete the category group
    await repo.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category group:', error);
    return NextResponse.json(
      { error: 'Failed to delete category group' },
      { status: 500 }
    );
  }
}
