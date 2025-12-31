/**
 * Category Groups Reorder API Route
 *
 * Handles drag-drop reordering of category groups.
 *
 * Requirements: 4.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCategoryGroupsRepository } from '@/lib/db/repositories';

/**
 * POST /api/admin/category-groups/reorder
 * 
 * Updates display order for multiple category groups.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    if (!Array.isArray(body.orders)) {
      return NextResponse.json(
        { error: 'Invalid request: orders must be an array' },
        { status: 400 }
      );
    }

    // Validate each order item
    for (const item of body.orders) {
      if (!item.id || typeof item.display_order !== 'number') {
        return NextResponse.json(
          { error: 'Invalid order item: must have id and display_order' },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();
    const repo = createCategoryGroupsRepository(supabase);

    // Update display orders
    await repo.updateDisplayOrders(body.orders);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering category groups:', error);
    return NextResponse.json(
      { error: 'Failed to reorder category groups' },
      { status: 500 }
    );
  }
}
