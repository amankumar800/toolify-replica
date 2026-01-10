/**
 * Company Pages Admin API Routes
 *
 * Handles fetching all company pages for the admin panel.
 *
 * Requirements: 1.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/db/constants/tables';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { checkRateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';
import type { CompanyPageRow } from '@/lib/supabase/types';

const log = createLogger('AdminCompanyPagesAPI');

/**
 * GET /api/admin/company-pages
 *
 * Fetches all company pages for the admin panel.
 * Requires admin authentication.
 *
 * Requirements: 1.1
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit: adminRead (300 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminRead', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    // Check admin authentication
    await requireAdmin();

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from(TABLES.COMPANY_PAGES)
      .select('*')
      .order('slug', { ascending: true });

    if (error) {
      log.error('Supabase error', error, { action: 'GET' });
      return NextResponse.json(
        { error: 'Failed to fetch company pages', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data as CompanyPageRow[],
      total: data?.length ?? 0,
    });
  } catch (error) {
    log.error('Error fetching company pages', error, { action: 'GET' });
    return NextResponse.json(
      { error: 'Failed to fetch company pages', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
