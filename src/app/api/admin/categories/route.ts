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
import { createCategoriesRepository } from '@/lib/db/repositories';
import { categorySchema, validateFormData } from '@/lib/utils/admin-validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';
import type { Json } from '@/lib/supabase/types';

const log = createLogger('AdminCategoriesAPI');

/**
 * GET /api/admin/categories
 * 
 * Fetches all categories with tool counts.
 * Requirements: 5.1, 5.2
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit: adminRead (300 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminRead', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();

    const supabase = await createClient();
    const repo = createCategoriesRepository(supabase);

    // Get all categories with tool counts
    const categories = await repo.findAllWithToolCount();

    return NextResponse.json({
      data: categories,
      total: categories.length,
    });
  } catch (error) {
    log.error('Error fetching categories', error, { action: 'GET' });
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
      display_order,
      metadata: (validation.data.metadata as Json) || null,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    log.error('Error creating category', error, { action: 'POST' });
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
