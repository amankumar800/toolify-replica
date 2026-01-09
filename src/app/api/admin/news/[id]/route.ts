/**
 * Admin AI News Item API Routes
 *
 * Provides REST API endpoints for individual news item operations.
 *
 * GET /api/admin/news/[id] - Get a single news item
 * PUT /api/admin/news/[id] - Update a news item
 * DELETE /api/admin/news/[id] - Delete a news item
 *
 * Requirements: 7.5, 7.6, 7.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { getNewsById, updateNews, deleteNews } from '@/lib/services/news.service';
import { aiNewsSchema } from '@/lib/utils/admin-validation';
import { checkRateLimit } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/news/[id]
 *
 * Get a single news item by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit: adminRead (300 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminRead', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const { id } = await params;
    const news = await getNewsById(id);

    if (!news) {
      return NextResponse.json(
        { error: 'News item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/news/[id]
 *
 * Update a news item
 * Requirements: 7.6, 7.8
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    // Get current news item to check is_published state
    const currentNews = await getNewsById(id);
    if (!currentNews) {
      return NextResponse.json(
        { error: 'News item not found' },
        { status: 404 }
      );
    }

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

    // Update news with previous is_published state for timestamp logic
    const news = await updateNews(id, newsData, currentNews.is_published ?? false);

    return NextResponse.json(news);
  } catch (error) {
    console.error('Error updating news:', error);
    return NextResponse.json(
      { error: 'Failed to update news' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/news/[id]
 *
 * Delete a news item
 * Requirements: 7.5
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const { id } = await params;

    // Check if news exists
    const news = await getNewsById(id);
    if (!news) {
      return NextResponse.json(
        { error: 'News item not found' },
        { status: 404 }
      );
    }

    await deleteNews(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting news:', error);
    return NextResponse.json(
      { error: 'Failed to delete news' },
      { status: 500 }
    );
  }
}
