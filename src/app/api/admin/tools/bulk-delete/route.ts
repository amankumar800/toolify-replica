/**
 * Admin Tools Bulk Delete API Route
 *
 * POST /api/admin/tools/bulk-delete - Soft delete multiple tools
 *
 * Requirements: 3.7, 19.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { bulkSoftDeleteTools } from '@/lib/services/tools.service';
import { checkRateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminToolsBulkDeleteAPI');

/**
 * POST /api/admin/tools/bulk-delete
 *
 * Soft delete (archive) multiple tools
 * Requirements: 3.7, 19.2
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: bulkOperation (10 req/min) - stricter for bulk operations
    const rateLimitResponse = await checkRateLimit(request, { type: 'bulkOperation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
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
    log.error('Error bulk deleting tools', error, { action: 'POST' });
    return NextResponse.json(
      { error: 'Failed to delete tools' },
      { status: 500 }
    );
  }
}
