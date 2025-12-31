/**
 * Admin Tools Bulk Delete API Route
 *
 * POST /api/admin/tools/bulk-delete - Soft delete multiple tools
 *
 * Requirements: 3.7, 19.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { bulkSoftDeleteTools } from '@/lib/services/tools.service';

/**
 * POST /api/admin/tools/bulk-delete
 *
 * Soft delete (archive) multiple tools
 * Requirements: 3.7, 19.2
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No tool IDs provided' },
        { status: 400 }
      );
    }

    await bulkSoftDeleteTools(ids);

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error('Error bulk deleting tools:', error);
    return NextResponse.json(
      { error: 'Failed to delete tools' },
      { status: 500 }
    );
  }
}
