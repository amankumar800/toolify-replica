/**
 * Admin Featured Tools - Search Tools API
 *
 * Provides search endpoint for the searchable tool select field.
 *
 * GET /api/admin/featured/search-tools - Search tools by name/slug
 *
 * Requirements: 10.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { searchToolsForSelect, getToolForSelect } from '@/lib/services/featured-tools.service';
import { checkRateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminFeaturedSearchToolsAPI');

/**
 * GET /api/admin/featured/search-tools
 *
 * Search tools for the searchable select field
 * Requirements: 10.5
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit: adminRead (300 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminRead', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') ?? '';
    const toolId = searchParams.get('id');

    // If toolId is provided, return that specific tool
    if (toolId) {
      const tool = await getToolForSelect(toolId);
      if (tool) {
        return NextResponse.json([tool]);
      }
      return NextResponse.json([]);
    }

    // Otherwise, search by query
    if (query.length < 1) {
      return NextResponse.json([]);
    }

    const results = await searchToolsForSelect(query);
    return NextResponse.json(results);
  } catch (error) {
    log.error('Error searching tools', error, { action: 'GET' });
    return NextResponse.json(
      { error: 'Failed to search tools' },
      { status: 500 }
    );
  }
}
