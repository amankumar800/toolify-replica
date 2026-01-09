/**
 * Category API Routes (by ID)
 *
 * Handles individual category operations including cascade delete.
 *
 * Requirements: 5.4, 5.5, 5.6, 5.7, 5.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { createClient } from '@/lib/supabase/server';
import { createCategoriesRepository, createCategoryGroupsRepository, createSubcategoriesRepository } from '@/lib/db/repositories';
import { categorySchema, validateFormData } from '@/lib/utils/admin-validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { TABLES } from '@/lib/db/constants/tables';
import type { Json } from '@/lib/supabase/types';
import { createLogger } from '@/lib/logger';

const log = createLogger('CategoriesAPI');

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/categories/[id]
 * 
 * Fetches a single category by ID with group info and tool count.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit: adminRead (300 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminRead', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();
    const repo = createCategoriesRepository(supabase);

    const category = await repo.findWithGroup(id);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get tool count for this category
    const categoriesWithToolCount = await repo.findWithToolCount();
    const categoryWithCount = categoriesWithToolCount.find((c) => (c as { id?: string }).id === id);
    const tool_count = categoryWithCount?.computed_tool_count ?? 0;

    return NextResponse.json({
      ...category,
      tool_count,
    });
  } catch (error) {
    log.error('Error fetching category', error, { action: 'GET' });
    return NextResponse.json(
      { error: 'Category not found' },
      { status: 404 }
    );
  }
}

/**
 * PUT /api/admin/categories/[id]
 * 
 * Updates a category.
 * Requirements: 5.5
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
    const validation = validateFormData(categorySchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const repo = createCategoriesRepository(supabase);

    // Check for duplicate slug (excluding current category)
    const existingBySlug = await repo.findBySlug(validation.data.slug);
    if (existingBySlug && existingBySlug.id !== id) {
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

    // Update the category
    const category = await repo.update(id, {
      name: validation.data.name,
      slug: validation.data.slug,
      description: validation.data.description || null,
      icon: validation.data.icon || null,
      group_id: validation.data.group_id || null,
      display_order: validation.data.display_order,
      metadata: (validation.data.metadata as Json) || null,
    });

    return NextResponse.json(category);
  } catch (error) {
    log.error('Error updating category', error, { action: 'PUT' });
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/categories/[id]
 * 
 * Deletes a category with cascade delete of subcategories and tool_categories.
 * Requirements: 5.7, 5.8
 * 
 * Property 14: Category Cascade Delete
 * For any category being deleted, all related subcategories and tool_categories 
 * entries SHALL be cascade deleted.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();
    const categoriesRepo = createCategoriesRepository(supabase);
    const subcategoriesRepo = createSubcategoriesRepository(supabase);

    // Get the category to verify it exists
    const category = await categoriesRepo.findById(id);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get affected records for the warning
    const subcategories = await subcategoriesRepo.findByCategory(id);
    
    // Get tool_categories count
    const { count: toolCategoriesCount, error: countError } = await supabase
      .from(TABLES.TOOL_CATEGORIES)
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    if (countError) {
      log.error('Error counting tool_categories', countError, { action: 'DELETE', data: { categoryId: id } });
    }

    // Return affected records info if there are any
    const affectedRecords = {
      subcategories: subcategories.map((s) => ({ id: s.id, name: s.name, slug: s.slug })),
      tool_categories_count: toolCategoriesCount ?? 0,
    };

    // Delete tool_categories entries first
    const { error: toolCatError } = await supabase
      .from(TABLES.TOOL_CATEGORIES)
      .delete()
      .eq('category_id', id);

    if (toolCatError) {
      log.error('Error deleting tool_categories', toolCatError, { action: 'DELETE', data: { categoryId: id } });
      return NextResponse.json(
        { error: 'Failed to delete tool category associations' },
        { status: 500 }
      );
    }

    // Delete subcategories
    for (const subcategory of subcategories) {
      await subcategoriesRepo.delete(subcategory.id);
    }

    // Delete the category
    await categoriesRepo.delete(id);

    return NextResponse.json({
      success: true,
      deleted: {
        category: { id, name: category.name },
        subcategories: affectedRecords.subcategories.length,
        tool_categories: affectedRecords.tool_categories_count,
      },
    });
  } catch (error) {
    log.error('Error deleting category', error, { action: 'DELETE' });
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
