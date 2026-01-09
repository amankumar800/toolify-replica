/**
 * Admin Tool Permanent Delete API Route
 *
 * DELETE /api/admin/tools/[id]/permanent - Permanently delete a tool
 *
 * Requirements: 19.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { permanentlyDeleteTool } from '@/lib/services/tools.service';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminToolsPermanentDeleteAPI');

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/admin/tools/[id]/permanent
 *
 * Permanently delete a tool from the database
 * Requirements: 19.6
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    await permanentlyDeleteTool(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Error permanently deleting tool', error, { action: 'DELETE' });
    return NextResponse.json(
      { error: 'Failed to permanently delete tool' },
      { status: 500 }
    );
  }
}
