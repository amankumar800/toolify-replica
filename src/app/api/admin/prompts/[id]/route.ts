/**
 * Admin Single Prompt API Routes
 *
 * Provides REST API endpoints for individual prompt operations.
 *
 * GET /api/admin/prompts/[id] - Get a single prompt
 * PUT /api/admin/prompts/[id] - Update a prompt
 * DELETE /api/admin/prompts/[id] - Delete a prompt
 *
 * Requirements: 8.4, 8.5, 8.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { getPromptById, updatePrompt, deletePrompt } from '@/lib/services/prompts.service';
import { promptSchema } from '@/lib/utils/admin-validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminPromptsIdAPI');

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/prompts/[id]
 *
 * Get a single prompt by ID
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
    const prompt = await getPromptById(id);

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(prompt);
  } catch (error) {
    log.error('Error fetching prompt', error, { action: 'GET' });
    return NextResponse.json(
      { error: 'Failed to fetch prompt' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/prompts/[id]
 *
 * Update an existing prompt
 * Requirements: 8.4, 8.6
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

    // Validate input
    const validationResult = promptSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Update prompt
    const prompt = await updatePrompt(id, validationResult.data);

    return NextResponse.json(prompt);
  } catch (error) {
    log.error('Error updating prompt', error, { action: 'PUT' });
    return NextResponse.json(
      { error: 'Failed to update prompt' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/prompts/[id]
 *
 * Delete a prompt
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

    await deletePrompt(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Error deleting prompt', error, { action: 'DELETE' });
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}
