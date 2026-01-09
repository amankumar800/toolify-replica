/**
 * Admin Tool Restore API Route
 *
 * POST /api/admin/tools/[id]/restore - Restore an archived tool
 *
 * Requirements: 19.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { restoreTool } from '@/lib/services/tools.service';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminToolsRestoreAPI');

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/tools/[id]/restore
 *
 * Restore an archived tool (change status to draft)
 * Requirements: 19.5
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    const tool = await restoreTool(id);

    return NextResponse.json(tool);
  } catch (error) {
    log.error('Error restoring tool', error, { action: 'POST' });
    return NextResponse.json(
      { error: 'Failed to restore tool' },
      { status: 500 }
    );
  }
}
