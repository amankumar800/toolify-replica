/**
 * Subcategory API Routes (by ID)
 *
 * Handles individual subcategory operations.
 *
 * Requirements: 6.4, 6.5, 6.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSubcategoriesRepository, createCategoriesRepository } from '@/lib/db/repositories';
import { subcategorySchema, validateFormData } from '@/lib/utils/admin-validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/subcategories/[id]
 * 
 * Fetches a single subcategory by ID with parent category info.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const subcategoriesRepo = createSubcategoriesRepository(supabase);
    const categoriesRepo = createCategoriesRepository(supabase);

    const subcategory = await subcategoriesRepo.findById(id);
    if (!subcategory) {
      return NextResponse.json(
        { error: 'Subcategory not found' },
        { status: 404 }
      );
    }

    // Get parent category info
    let category = null;
    if (subcategory.category_id) {
      try {
        category = await categoriesRepo.findById(subcategory.category_id);
      } catch {
        // Category might have been deleted
      }
    }

    return NextResponse.json({
      ...subcategory,
      category,
    });
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    return NextResponse.json(
      { error: 'Subcategory not found' },
      { status: 404 }
    );
  }
}

/**
 * PUT /api/admin/subcategories/[id]
 * 
 * Updates a subcategory.
 * Requirements: 6.5
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    // Check if subcategory exists
    const existing = await subcategoriesRepo.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Subcategory not found' },
        { status: 404 }
      );
    }

    // Validate category_id exists
    try {
      await categoriesRepo.findById(validation.data.category_id);
    } catch {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Check for duplicate slug within the same category (excluding current subcategory)
    const existingSubcategories = await subcategoriesRepo.findByCategory(validation.data.category_id);
    const duplicateSlug = existingSubcategories.find(
      (s) => s.slug === validation.data.slug && s.id !== id
    );
    if (duplicateSlug) {
      return NextResponse.json(
        { error: 'A subcategory with this slug already exists in this category' },
        { status: 409 }
      );
    }

    // Update the subcategory
    const subcategory = await subcategoriesRepo.update(id, {
      name: validation.data.name,
      slug: validation.data.slug,
      category_id: validation.data.category_id,
      display_order: validation.data.display_order,
    });

    return NextResponse.json(subcategory);
  } catch (error) {
    console.error('Error updating subcategory:', error);
    return NextResponse.json(
      { error: 'Failed to update subcategory' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/subcategories/[id]
 * 
 * Deletes a subcategory.
 * Requirements: 6.4
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const subcategoriesRepo = createSubcategoriesRepository(supabase);

    // Get the subcategory to verify it exists
    const subcategory = await subcategoriesRepo.findById(id);
    if (!subcategory) {
      return NextResponse.json(
        { error: 'Subcategory not found' },
        { status: 404 }
      );
    }

    // Delete the subcategory
    await subcategoriesRepo.delete(id);

    return NextResponse.json({
      success: true,
      deleted: {
        subcategory: { id, name: subcategory.name },
      },
    });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    return NextResponse.json(
      { error: 'Failed to delete subcategory' },
      { status: 500 }
    );
  }
}
