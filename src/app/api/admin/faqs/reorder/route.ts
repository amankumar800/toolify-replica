'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/db/constants/tables';

interface ReorderItem {
  id: string;
  display_order: number;
}

/**
 * POST /api/admin/faqs/reorder
 * 
 * Updates display_order for multiple FAQs (drag-drop reordering).
 * Requirements: 9.3
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { orders } = body as { orders: ReorderItem[] };

    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected { orders: [{ id, display_order }] }' },
        { status: 400 }
      );
    }

    // Update each FAQ's display_order
    const updatePromises = orders.map(({ id, display_order }) =>
      supabase
        .from(TABLES.FAQS)
        .update({ display_order })
        .eq('id', id)
    );

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error('Errors updating FAQ order:', errors);
      return NextResponse.json(
        { error: 'Failed to update some FAQ orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/admin/faqs/reorder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
