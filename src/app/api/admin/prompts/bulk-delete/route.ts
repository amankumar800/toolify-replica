/**
 * Admin Prompts Bulk Delete API Route
 *
 * POST /api/admin/prompts/bulk-delete - Delete multiple prompts
 *
 * Requirements: 8.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { bulkDeletePrompts } from '@/lib/services/prompts.service';

/**
 * POST /api/admin/prompts/bulk-delete
 *
 * Delete multiple prompts at once
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

    await bulkDeletePrompts(ids);

    return NextResponse.json({
      success: true,
      deletedCount: ids.length,
    });
  } catch (error) {
    console.error('Error bulk deleting prompts:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompts' },
      { status: 500 }
    );
  }
}
