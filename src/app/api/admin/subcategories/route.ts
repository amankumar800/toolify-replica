/**
 * Subcategories API Routes
 *
 * Handles CRUD operations for subcategories.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { createClient } from '@/lib/supabase/server';
import { createSubcategoriesRepository, createCategoriesRepository } from '@/lib/db/repositories';
import { subcategorySchema, validateFormData } from '@/lib/utils/admin-validation';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/admin/subcategories
 * 
 * Fetches all subcategories with parent category info.
 * Supports filtering by category_id.
 * Requirements: 6.1, 6.2
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit: adminRead (300 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminRead', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');

    const supabase = await createClient();
    const subcategoriesRepo = createSubcategoriesRepository(supabase);
    const categoriesRepo = createCategoriesRepository(supabase);

    // Get all subcategories
    let subcategories;
    if (categoryId) {
      subcategories = await subcategoriesRepo.findByCategory(categoryId);
    } else {
      subcategories = await subcategoriesRepo.findAll();
    }

    // Get all categories for parent info
    const categories = await categoriesRepo.findAll();
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // Enrich subcategories with parent category info
    const enrichedSubcategories = subcategories.map((sub) => ({
      ...sub,
      category: sub.category_id ? categoryMap.get(sub.category_id) || null : null,
    }));

    // Sort by display_order
    enrichedSubcategories.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

    return NextResponse.json({
      data: enrichedSubcategories,
      total: enrichedSubcategories.length,
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subcategories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/subcategories
 * 
 * Creates a new subcategory.
 * Requirements: 6.5
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const body = await request.json();

    // Validate form data
    const validation = validateFormData(subcategorySchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const subcategoriesRepo = createSubcategoriesRepository(supabase);
    const categoriesRepo = createCategoriesRepository(supabase);

    // Validate category_id exists
    try {
      await categoriesRepo.findById(validation.data.category_id);
    } catch {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Check for duplicate slug within the same category
    const existingSubcategories = await subcategoriesRepo.findByCategory(validation.data.category_id);
    const duplicateSlug = existingSubcategories.find((s) => s.slug === validation.data.slug);
    if (duplicateSlug) {
      return NextResponse.json(
        { error: 'A subcategory with this slug already exists in this category' },
        { status: 409 }
      );
    }

    // Get next display order if not provided
    let display_order = validation.data.display_order;
    if (display_order === undefined) {
      const maxOrder = existingSubcategories.reduce(
        (max, sub) => Math.max(max, sub.display_order ?? 0),
        0
      );
      display_order = maxOrder + 1;
    }

    // Create the subcategory
    const subcategory = await subcategoriesRepo.create({
      name: validation.data.name,
      slug: validation.data.slug,
      category_id: validation.data.category_id,
      display_order,
    });

    return NextResponse.json(subcategory, { status: 201 });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    return NextResponse.json(
      { error: 'Failed to create subcategory' },
      { status: 500 }
    );
  }
}
