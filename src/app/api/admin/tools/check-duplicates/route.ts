/**
 * Admin Tools Duplicate Detection API Route
 *
 * POST /api/admin/tools/check-duplicates - Check for duplicate tools
 *
 * Requirements: 21.1, 21.2, 21.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { checkForDuplicates } from '@/lib/services/tools.service';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/admin/tools/check-duplicates
 *
 * Check for potential duplicate tools based on name and website URL
 * Requirements: 21.1, 21.2, 21.3
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: adminRead (300 req/min) - this is a read operation
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminRead', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const body = await request.json();
    const { name, website_url, excludeId } = body as {
      name: string;
      website_url: string;
      excludeId?: string;
    };

    if (!name && !website_url) {
      return NextResponse.json(
        { error: 'Name or website URL is required' },
        { status: 400 }
      );
    }

    const result = await checkForDuplicates(name || '', website_url || '', excludeId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to check for duplicates' },
      { status: 500 }
    );
  }
}
