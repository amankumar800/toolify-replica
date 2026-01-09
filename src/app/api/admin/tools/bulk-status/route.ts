/**
 * Admin Tools Bulk Status Update API Route
 *
 * POST /api/admin/tools/bulk-status - Update status for multiple tools
 *
 * Requirements: 3.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { bulkUpdateToolStatus } from '@/lib/services/tools.service';
import { checkRateLimit } from '@/lib/rate-limit';
import type { ToolStatus } from '@/lib/types/admin-forms';

/**
 * POST /api/admin/tools/bulk-status
 *
 * Update status for multiple tools
 * Requirements: 3.7
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: bulkOperation (10 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'bulkOperation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
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
