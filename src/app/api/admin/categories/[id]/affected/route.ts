/**
 * Category Affected Records API Route
 *
 * Returns information about records that would be affected by deleting a category.
 * Used to display warning dialog before cascade delete.
 *
 * Requirements: 5.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCategoriesRepository, createSubcategoriesRepository } from '@/lib/db/repositories';
import { TABLES } from '@/lib/db/constants/tables';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/categories/[id]/affected
 * 
 * Returns affected records for cascade delete warning.
 * Requirements: 5.8 - Display warning showing affected records before deletion
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const categoriesRepo = createCategoriesRepository(supabase);
    const subcategoriesRepo = createSubcategoriesRepository(supabase);

    // Get the category to verify it exists
    const category = await categoriesRepo.findById(id);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get subcategories
    const subcategories = await subcategoriesRepo.findByCategory(id);

    // Get tool_categories count and tool names
    const { data: toolCategories, error: toolCatError } = await supabase
      .from(TABLES.TOOL_CATEGORIES)
      .select(`
        tool_id,
        tools (
          id,
          name
        )
      `)
      .eq('category_id', id);

    if (toolCatError) {
      console.error('Error fetching tool_categories:', toolCatError);
    }

    // Extract unique tools
    const tools = (toolCategories ?? [])
      .map((tc) => {
        const tool = tc.tools as { id: string; name: string } | null;
        return tool ? { id: tool.id, name: tool.name } : null;
      })
      .filter((t): t is { id: string; name: string } => t !== null);

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
      },
      affected: {
        subcategories: subcategories.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
        })),
        tools: tools,
        tool_categories_count: tools.length,
      },
    });
  } catch (error) {
    console.error('Error fetching affected records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch affected records' },
      { status: 500 }
    );
  }
}
