/**
 * Categories API Routes
 *
 * Handles CRUD operations for categories.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { createClient } from '@/lib/supabase/server';
import { createCategoriesRepository, createCategoryGroupsRepository } from '@/lib/db/repositories';
import { categorySchema, validateFormData } from '@/lib/utils/admin-validation';
import { checkRateLimit } from '@/lib/rate-limit';
import type { Json } from '@/lib/supabase/types';

/**
 * GET /api/admin/categories
 * 
 * Fetches all categories with group info and tool counts.
 * Supports filtering by group_id.
 * Requirements: 5.1, 5.2
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit: adminRead (300 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminRead', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('group_id');

    const supabase = await createClient();
    const repo = createCategoriesRepository(supabase);

    // Get all categories with groups and tool counts
    const categories = await repo.findAllWithGroupsAndToolCount();

    // Filter by group_id if provided
    const filteredCategories = groupId
      ? categories.filter((cat) => (cat as { group_id?: string }).group_id === groupId)
      : categories;

    return NextResponse.json({
      data: filteredCategories,
      total: filteredCategories.length,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/categories
 * 
 * Creates a new category.
 * Requirements: 5.5
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const body = await request.json();

    // Validate form data
    const validation = validateFormData(categorySchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const repo = createCategoriesRepository(supabase);

    // Check for duplicate slug
    const existingBySlug = await repo.findBySlug(validation.data.slug);
    if (existingBySlug) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 409 }
      );
    }

    // Validate group_id if provided
    if (validation.data.group_id) {
      const groupsRepo = createCategoryGroupsRepository(supabase);
      try {
        await groupsRepo.findById(validation.data.group_id);
      } catch {
        return NextResponse.json(
          { error: 'Invalid group ID' },
          { status: 400 }
        );
      }
    }

    // Get next display order if not provided
    let display_order = validation.data.display_order;
    if (display_order === undefined) {
      const allCategories = await repo.findAll();
      const maxOrder = allCategories.reduce(
        (max, cat) => Math.max(max, cat.display_order ?? 0),
        0
      );
      display_order = maxOrder + 1;
    }

    // Create the category
    const category = await repo.create({
      name: validation.data.name,
      slug: validation.data.slug,
      description: validation.data.description || null,
      icon: validation.data.icon || null,
      group_id: validation.data.group_id || null,
      display_order,
      metadata: (validation.data.metadata as Json) || null,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
