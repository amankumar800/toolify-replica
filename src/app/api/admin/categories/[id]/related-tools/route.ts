import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { createAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';

const log = createLogger('RelatedToolsAPI');

/**
 * GET /api/admin/categories/[id]/related-tools
 * 
 * Fetches tools that belong to a specific category.
 * Returns up to 10 tools with total count for "View All" link.
 * 
 * Requirements: 20.1, 20.5
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = createAdminClient();

    // Get tools in this category via the junction table
    const { data: toolCategories, error: junctionError } = await supabase
      .from('tool_categories')
      .select('tool_id')
      .eq('category_id', id);

    if (junctionError) {
      log.error('Error fetching tool_categories', junctionError, { action: 'GET', data: { categoryId: id } });
      return NextResponse.json(
        { error: 'Failed to fetch related tools' },
        { status: 500 }
      );
    }

    const toolIds = toolCategories?.map((tc) => tc.tool_id) ?? [];
    const totalCount = toolIds.length;

    if (toolIds.length === 0) {
      return NextResponse.json({
        tools: [],
        totalCount: 0,
      });
    }

    // Fetch tool details (limit to 10)
    const { data: tools, error: toolsError } = await supabase
      .from('tools')
      .select('id, name, slug, status')
      .in('id', toolIds)
      .order('name', { ascending: true })
      .limit(10);

    if (toolsError) {
      log.error('Error fetching tools', toolsError, { action: 'GET', data: { categoryId: id } });
      return NextResponse.json(
        { error: 'Failed to fetch tool details' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tools: tools ?? [],
      totalCount,
    });
  } catch (error) {
    log.error('Error in related-tools API', error, { action: 'GET' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
