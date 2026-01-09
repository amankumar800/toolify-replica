/**
 * Admin Prompts Bulk Delete API Route
 *
 * POST /api/admin/prompts/bulk-delete - Delete multiple prompts
 *
 * Requirements: 8.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { bulkDeletePrompts } from '@/lib/services/prompts.service';
import { checkRateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminPromptsBulkDeleteAPI');

/**
 * POST /api/admin/prompts/bulk-delete
 *
 * Delete multiple prompts at once
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: bulkOperation (10 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'bulkOperation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
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
    log.error('Error bulk deleting prompts', error, { action: 'POST' });
    return NextResponse.json(
      { error: 'Failed to delete prompts' },
      { status: 500 }
    );
  }
}
