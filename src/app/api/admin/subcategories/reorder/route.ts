/**
 * Subcategories Reorder API Route
 *
 * Handles drag-drop reordering of subcategories within a parent category.
 *
 * Requirements: 6.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { createClient } from '@/lib/supabase/server';
import { createSubcategoriesRepository } from '@/lib/db/repositories';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/admin/subcategories/reorder
 * 
 * Updates display order for multiple subcategories.
 * Requirements: 6.3 - Drag-drop reordering within parent category
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
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
    const repo = createSubcategoriesRepository(supabase);

    // Update display orders
    const updatePromises = body.orders.map(
      async ({ id, display_order }: { id: string; display_order: number }) => {
        await repo.update(id, { display_order });
      }
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering subcategories:', error);
    return NextResponse.json(
      { error: 'Failed to reorder subcategories' },
      { status: 500 }
    );
  }
}
