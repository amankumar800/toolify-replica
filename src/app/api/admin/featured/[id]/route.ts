/**
 * Admin Featured Tool API Routes (Single Item)
 *
 * Provides REST API endpoints for single featured tool operations.
 *
 * GET /api/admin/featured/[id] - Get a single featured tool
 * PUT /api/admin/featured/[id] - Update a featured tool
 * DELETE /api/admin/featured/[id] - Delete a featured tool
 *
 * Requirements: 10.4, 10.5, 10.6, 10.7
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getFeaturedToolById,
  updateFeaturedTool,
  deleteFeaturedTool,
} from '@/lib/services/featured-tools.service';
import { featuredToolSchema } from '@/lib/utils/admin-validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/featured/[id]
 *
 * Get a single featured tool by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const featuredTool = await getFeaturedToolById(id);

    if (!featuredTool) {
      return NextResponse.json(
        { error: 'Featured tool not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(featuredTool);
  } catch (error) {
    console.error('Error fetching featured tool:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured tool' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/featured/[id]
 *
 * Update a featured tool
 * Requirements: 10.5, 10.6, 10.7
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Convert date strings to Date objects for validation
    if (body.start_date && typeof body.start_date === 'string') {
      body.start_date = new Date(body.start_date);
    }
    if (body.end_date && typeof body.end_date === 'string') {
      body.end_date = new Date(body.end_date);
    }

    // Validate input
    const validationResult = featuredToolSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Convert Date back to ISO string for database
    const featuredToolData = {
      ...validationResult.data,
      start_date: validationResult.data.start_date?.toISOString(),
      end_date: validationResult.data.end_date?.toISOString(),
    };

    // Update featured tool
    const featuredTool = await updateFeaturedTool(id, featuredToolData);

    return NextResponse.json(featuredTool);
  } catch (error) {
    console.error('Error updating featured tool:', error);
    return NextResponse.json(
      { error: 'Failed to update featured tool' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/featured/[id]
 *
 * Delete a featured tool
 * Requirements: 10.4
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteFeaturedTool(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting featured tool:', error);
    return NextResponse.json(
      { error: 'Failed to delete featured tool' },
      { status: 500 }
    );
  }
}
