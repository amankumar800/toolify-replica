/**
 * Admin Prompts API Routes
 *
 * Provides REST API endpoints for Midjourney prompts management.
 *
 * GET /api/admin/prompts - List prompts with pagination, filtering, sorting
 * POST /api/admin/prompts - Create a new prompt
 *
 * Requirements: 8.1-8.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { listPrompts, createPrompt } from '@/lib/services/prompts.service';
import { promptSchema } from '@/lib/utils/admin-validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';
import type { PromptFilters } from '@/lib/services/admin-crud.types';
import type { PromptType } from '@/lib/types/admin-forms';

const log = createLogger('AdminPromptsAPI');

/**
 * GET /api/admin/prompts
 *
 * List prompts with pagination, filtering, and sorting
 * Requirements: 8.1, 8.2, 8.3
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit: adminRead (300 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminRead', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const searchParams = request.nextUrl.searchParams;

    // Parse pagination
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);

    // Parse sorting
    const sortBy = searchParams.get('sortBy') ?? 'created_at';
    const sortDirection = (searchParams.get('sortDirection') ?? 'desc') as 'asc' | 'desc';

    // Parse filters
    const filters: PromptFilters = {};

    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    // Requirements: 8.2 - Filter by type (sref/prompt)
    const type = searchParams.get('type');
    if (type) {
      filters.type = type as PromptType;
    }

    const result = await listPrompts({
      page,
      pageSize,
      sortBy,
      sortDirection,
      filters,
    });

    return NextResponse.json(result);
  } catch (error) {
    log.error('Error listing prompts', error, { action: 'GET' });
    return NextResponse.json(
      { error: 'Failed to list prompts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/prompts
 *
 * Create a new prompt
 * Requirements: 8.4, 8.6
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const body = await request.json();

    // Validate input
    const validationResult = promptSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Create prompt
    const prompt = await createPrompt(validationResult.data);

    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    log.error('Error creating prompt', error, { action: 'POST' });
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    );
  }
}
