/**
 * Admin Tool API Routes (Single Tool)
 *
 * Provides REST API endpoints for single tool operations.
 *
 * GET /api/admin/tools/[id] - Get a single tool
 * PUT /api/admin/tools/[id] - Update a tool
 * DELETE /api/admin/tools/[id] - Soft delete a tool (archive)
 *
 * Requirements: 3.8, 3.9, 3.10, 3.11, 19.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { getToolById, updateTool, softDeleteTool } from '@/lib/services/tools.service';
import { toolSchema } from '@/lib/utils/admin-validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';
import type { Json } from '@/lib/supabase/types';

const log = createLogger('AdminToolsIdAPI');

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/tools/[id]
 *
 * Get a single tool by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit: adminRead (300 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminRead', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    // Parallelize auth and params (both independent after rate limit passes)
    const [, { id }] = await Promise.all([
      requireAdmin(),
      params
    ]);

    // Fetch data only after security checks pass
    const tool = await getToolById(id);

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tool);
  } catch (error) {
    log.error('Error fetching tool', error, { action: 'GET' });
    return NextResponse.json(
      { error: 'Failed to fetch tool' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/tools/[id]
 *
 * Update a tool
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    // Parallelize auth, params, and body parsing (all independent after rate limit)
    const [, { id }, body] = await Promise.all([
      requireAdmin(),
      params,
      request.json()
    ]);

    // Validate input (partial validation for updates)
    const validationResult = toolSchema.partial().safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { category_ids, ...toolDataRaw } = validationResult.data;

    // Cast metadata to Json type for Supabase compatibility
    const toolData = {
      ...toolDataRaw,
      metadata: toolDataRaw.metadata as Json | undefined,
    };

    // Update tool
    const tool = await updateTool(id, toolData, category_ids);

    return NextResponse.json(tool);
  } catch (error) {
    log.error('Error updating tool', error, { action: 'PUT' });
    return NextResponse.json(
      { error: 'Failed to update tool' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/tools/[id]
 *
 * Soft delete a tool (change status to archived)
 * Requirements: 19.2
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    // Parallelize auth and params (both independent after rate limit passes)
    const [, { id }] = await Promise.all([
      requireAdmin(),
      params
    ]);

    // Soft delete (archive)
    await softDeleteTool(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Error deleting tool', error, { action: 'DELETE' });
    return NextResponse.json(
      { error: 'Failed to delete tool' },
      { status: 500 }
    );
  }
}
