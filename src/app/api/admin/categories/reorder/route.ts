/**
 * Categories Reorder API Route
 *
 * Handles drag-drop reordering of categories within a group.
 *
 * Requirements: 5.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCategoriesRepository } from '@/lib/db/repositories';

/**
 * POST /api/admin/categories/reorder
 * 
 * Updates display order for multiple categories.
 * Requirements: 5.3 - Drag-drop reordering within group
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
    const repo = createCategoriesRepository(supabase);

    // Update display orders
    const updatePromises = body.orders.map(
      async ({ id, display_order }: { id: string; display_order: number }) => {
        await repo.update(id, { display_order });
      }
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering categories:', error);
    return NextResponse.json(
      { error: 'Failed to reorder categories' },
      { status: 500 }
    );
  }
}
