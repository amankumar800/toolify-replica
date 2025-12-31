/**
 * Admin Tools Bulk Status Update API Route
 *
 * POST /api/admin/tools/bulk-status - Update status for multiple tools
 *
 * Requirements: 3.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { bulkUpdateToolStatus } from '@/lib/services/tools.service';
import type { ToolStatus } from '@/lib/types/admin-forms';

/**
 * POST /api/admin/tools/bulk-status
 *
 * Update status for multiple tools
 * Requirements: 3.7
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, status } = body as { ids: string[]; status: ToolStatus };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No tool IDs provided' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'No status provided' },
        { status: 400 }
      );
    }

    await bulkUpdateToolStatus(ids, status);

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error('Error bulk updating tools:', error);
    return NextResponse.json(
      { error: 'Failed to update tools' },
      { status: 500 }
    );
  }
}
