import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/admin/category-groups/[id]/related-categories
 * 
 * Fetches categories that belong to a specific category group.
 * Returns up to 10 categories with total count for "View All" link.
 * 
 * Requirements: 20.2, 20.5
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = createAdminClient();

    // Get total count of categories in this group
    const { count, error: countError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', id);

    if (countError) {
      console.error('Error counting categories:', countError);
      return NextResponse.json(
        { error: 'Failed to count categories' },
        { status: 500 }
      );
    }

    // Fetch category details (limit to 10)
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('group_id', id)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
      .limit(10);

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      categories: categories ?? [],
      totalCount: count ?? 0,
    });
  } catch (error) {
    console.error('Error in related-categories API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
