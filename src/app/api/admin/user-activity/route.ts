/**
 * User Activity API Routes
 *
 * Provides REST API endpoint for viewing user favorites data (read-only).
 *
 * GET /api/admin/user-activity - List user favorites with pagination, filtering, sorting, and aggregate stats
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UserActivityFilters, UserActivityStats } from '@/lib/services/admin-crud.types';

/**
 * User activity list item
 */
interface UserActivityItem {
  id: string;
  user_email: string;
  tool_id: string;
  tool_name: string | null;
  is_shortcut: boolean;
  created_at: string | null;
}

/**
 * GET /api/admin/user-activity
 *
 * List user favorites with pagination, filtering, sorting, and aggregate statistics
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Parse pagination
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);

    // Parse sorting
    const sortBy = searchParams.get('sortBy') ?? 'created_at';
    const sortDirection = (searchParams.get('sortDirection') ?? 'desc') as 'asc' | 'desc';

    // Parse filters
    const filters: UserActivityFilters = {};

    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    const isShortcut = searchParams.get('is_shortcut');
    if (isShortcut === 'true') {
      filters.is_shortcut = true;
    } else if (isShortcut === 'false') {
      filters.is_shortcut = false;
    }

    // Build query for list data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = supabase.from('user_favorites' as any).select(
      'id, user_email, tool_id, tool_name, is_shortcut, created_at',
      { count: 'exact' }
    );

    // Apply search filter (Requirements: 12.4)
    if (filters.search) {
      query = query.or(`user_email.ilike.%${filters.search}%,tool_name.ilike.%${filters.search}%`);
    }

    // Apply is_shortcut filter (Requirements: 12.3)
    if (filters.is_shortcut !== undefined) {
      query = query.eq('is_shortcut', filters.is_shortcut);
    }

    // Apply sorting
    const ascending = sortDirection === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching user activity:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user activity' },
        { status: 500 }
      );
    }

    // Fetch aggregate statistics (Requirements: 12.5)
    const stats = await getAggregateStats(supabase);

    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: (data ?? []) as unknown as UserActivityItem[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      stats,
    });
  } catch (error) {
    console.error('Error in user activity API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
}

/**
 * Get aggregate statistics for user activity
 * Requirements: 12.5
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAggregateStats(supabase: any): Promise<UserActivityStats> {
  // Get total favorites count
  const { count: totalFavorites } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('user_favorites' as any)
    .select('*', { count: 'exact', head: true });

  // Get total shortcuts count
  const { count: totalShortcuts } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('user_favorites' as any)
    .select('*', { count: 'exact', head: true })
    .eq('is_shortcut', true);

  // Get top 5 most favorited tools
  // Since Supabase doesn't support GROUP BY directly, we'll fetch all and aggregate in JS
  // For large datasets, this should be done with a database function or view
  const { data: allFavorites } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('user_favorites' as any)
    .select('tool_id, tool_name');

  // Aggregate tool counts
  const toolCounts = new Map<string, { tool_id: string; tool_name: string; count: number }>();
  
  for (const fav of allFavorites ?? []) {
    const key = fav.tool_id;
    const existing = toolCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      toolCounts.set(key, {
        tool_id: fav.tool_id,
        tool_name: fav.tool_name ?? 'Unknown Tool',
        count: 1,
      });
    }
  }

  // Sort by count and take top 5
  const topFavoritedTools = Array.from(toolCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(item => ({
      tool_id: item.tool_id,
      tool_name: item.tool_name,
      favorite_count: item.count,
    }));

  return {
    totalFavorites: totalFavorites ?? 0,
    totalShortcuts: totalShortcuts ?? 0,
    topFavoritedTools,
  };
}
