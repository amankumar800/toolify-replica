/**
 * Admin AI News Bulk Status API Route
 *
 * POST /api/admin/news/bulk-status - Bulk publish/unpublish news items
 *
 * Requirements: 7.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { bulkPublishNews, bulkUnpublishNews } from '@/lib/services/news.service';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/admin/news/bulk-status
 *
 * Bulk update news publish status
 * Requirements: 7.4
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: bulkOperation (10 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'bulkOperation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const body = await request.json();
    const { ids, is_published } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (typeof is_published !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: is_published must be a boolean' },
        { status: 400 }
      );
    }

    if (is_published) {
      await bulkPublishNews(ids);
    } else {
      await bulkUnpublishNews(ids);
    }

    return NextResponse.json({
      success: true,
      affectedCount: ids.length,
    });
  } catch (error) {
    console.error('Error bulk updating news status:', error);
    return NextResponse.json(
      { error: 'Failed to update news status' },
      { status: 500 }
    );
  }
}
