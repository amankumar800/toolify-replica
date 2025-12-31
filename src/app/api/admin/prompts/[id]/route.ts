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
import { getPromptById, updatePrompt, deletePrompt } from '@/lib/services/prompts.service';
import { promptSchema } from '@/lib/utils/admin-validation';

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
    const { id } = await params;
    const prompt = await getPromptById(id);

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(prompt);
  } catch (error) {
    console.error('Error fetching prompt:', error);
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
    const { id } = await params;
    const body = await request.json();

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
    console.error('Error updating prompt:', error);
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
    const { id } = await params;
    await deletePrompt(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}
