/**
 * Admin AI News Bulk Delete API Route
 *
 * POST /api/admin/news/bulk-delete - Bulk delete news items
 *
 * Requirements: 7.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { bulkDeleteNews } from '@/lib/services/news.service';

/**
 * POST /api/admin/news/bulk-delete
 *
 * Bulk delete news items
 * Requirements: 7.4
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ids must be a non-empty array' },
        { status: 400 }
      );
    }

    await bulkDeleteNews(ids);

    return NextResponse.json({
      success: true,
      affectedCount: ids.length,
    });
  } catch (error) {
    console.error('Error bulk deleting news:', error);
    return NextResponse.json(
      { error: 'Failed to delete news' },
      { status: 500 }
    );
  }
}
