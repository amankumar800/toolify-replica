/**
 * Admin Featured Tools API Routes
 *
 * Provides REST API endpoints for featured tools management.
 *
 * GET /api/admin/featured - List featured tools with pagination, filtering, sorting
 * POST /api/admin/featured - Create a new featured tool
 *
 * Requirements: 10.1-10.5, 10.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { listFeaturedTools, createFeaturedTool } from '@/lib/services/featured-tools.service';
import { featuredToolSchema } from '@/lib/utils/admin-validation';
import type { FeaturedToolFilters, FeaturedToolStatus } from '@/lib/services/admin-crud.types';
import type { FeaturedPlacementType } from '@/lib/types/admin-forms';

/**
 * GET /api/admin/featured
 *
 * List featured tools with pagination, filtering, and sorting
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse pagination
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);

    // Parse sorting
    const sortBy = searchParams.get('sortBy') ?? 'created_at';
    const sortDirection = (searchParams.get('sortDirection') ?? 'desc') as 'asc' | 'desc';

    // Parse filters
    const filters: FeaturedToolFilters = {};

    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    const placementType = searchParams.get('placement_type');
    if (placementType) {
      filters.placement_type = placementType as FeaturedPlacementType;
    }

    const isSponsored = searchParams.get('is_sponsored');
    if (isSponsored !== null && isSponsored !== '') {
      filters.is_sponsored = isSponsored === 'true';
    }

    const status = searchParams.get('status');
    if (status) {
      filters.status = status as FeaturedToolStatus;
    }

    const result = await listFeaturedTools({
      page,
      pageSize,
      sortBy,
      sortDirection,
      filters,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing featured tools:', error);
    return NextResponse.json(
      { error: 'Failed to list featured tools' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/featured
 *
 * Create a new featured tool
 * Requirements: 10.5, 10.7
 */
export async function POST(request: NextRequest) {
  try {
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

    // Create featured tool
    const featuredTool = await createFeaturedTool(featuredToolData);

    return NextResponse.json(featuredTool, { status: 201 });
  } catch (error) {
    console.error('Error creating featured tool:', error);
    return NextResponse.json(
      { error: 'Failed to create featured tool' },
      { status: 500 }
    );
  }
}
