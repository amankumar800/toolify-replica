/**
 * Admin Tools API Routes
 *
 * Provides REST API endpoints for tools management.
 *
 * GET /api/admin/tools - List tools with pagination, filtering, sorting
 * POST /api/admin/tools - Create a new tool
 *
 * Requirements: 3.1-3.5, 3.8, 3.10, 3.11
 */

import { NextRequest, NextResponse } from 'next/server';
import { listTools, createTool, getAllCategories } from '@/lib/services/tools.service';
import { toolSchema } from '@/lib/utils/admin-validation';
import type { ToolFilters } from '@/lib/services/admin-crud.types';
import type { ToolStatus, ToolPricing } from '@/lib/types/admin-forms';
import type { Json } from '@/lib/supabase/types';

/**
 * GET /api/admin/tools
 *
 * List tools with pagination, filtering, and sorting
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
    const filters: ToolFilters = {};

    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    const status = searchParams.get('status');
    if (status) {
      filters.status = status as ToolStatus;
    }

    const pricing = searchParams.get('pricing');
    if (pricing) {
      filters.pricing = pricing as ToolPricing;
    }

    const isFeatured = searchParams.get('is_featured');
    if (isFeatured !== null) {
      filters.is_featured = isFeatured === 'true';
    }

    const includeArchived = searchParams.get('includeArchived');
    if (includeArchived === 'true') {
      filters.includeArchived = true;
    }

    const result = await listTools({
      page,
      pageSize,
      sortBy,
      sortDirection,
      filters,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing tools:', error);
    return NextResponse.json(
      { error: 'Failed to list tools' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/tools
 *
 * Create a new tool
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = toolSchema.safeParse(body);
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

    // Create tool
    const tool = await createTool(toolData, category_ids);

    return NextResponse.json(tool, { status: 201 });
  } catch (error) {
    console.error('Error creating tool:', error);
    return NextResponse.json(
      { error: 'Failed to create tool' },
      { status: 500 }
    );
  }
}
