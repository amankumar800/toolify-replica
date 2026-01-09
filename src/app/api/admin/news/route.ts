/**
 * Admin AI News API Routes
 *
 * Provides REST API endpoints for AI news management.
 *
 * GET /api/admin/news - List news with pagination, filtering, sorting
 * POST /api/admin/news - Create a new news item
 *
 * Requirements: 7.1-7.6, 7.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { listNews, createNews } from '@/lib/services/news.service';
import { aiNewsSchema } from '@/lib/utils/admin-validation';
import { checkRateLimit } from '@/lib/rate-limit';
import type { NewsFilters } from '@/lib/services/admin-crud.types';
import type { NewsCategory } from '@/lib/types/admin-forms';

/**
 * GET /api/admin/news
 *
 * List news with pagination, filtering, and sorting
 * Requirements: 7.1, 7.2, 7.3
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
    const filters: NewsFilters = {};

    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    const isPublished = searchParams.get('is_published');
    if (isPublished !== null && isPublished !== '') {
      filters.is_published = isPublished === 'true';
    }

    const category = searchParams.get('category');
    if (category) {
      filters.category = category as NewsCategory;
    }

    const result = await listNews({
      page,
      pageSize,
      sortBy,
      sortDirection,
      filters,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing news:', error);
    return NextResponse.json(
      { error: 'Failed to list news' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/news
 *
 * Create a new news item
 * Requirements: 7.6, 7.8
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const body = await request.json();

    // Convert published_at string to Date if present
    if (body.published_at && typeof body.published_at === 'string') {
      body.published_at = new Date(body.published_at);
    }

    // Validate input
    const validationResult = aiNewsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Convert Date back to ISO string for database
    const newsData = {
      ...validationResult.data,
      published_at: validationResult.data.published_at?.toISOString(),
    };

    // Create news
    const news = await createNews(newsData);

    return NextResponse.json(news, { status: 201 });
  } catch (error) {
    console.error('Error creating news:', error);
    return NextResponse.json(
      { error: 'Failed to create news' },
      { status: 500 }
    );
  }
}
