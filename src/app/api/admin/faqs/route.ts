'use server';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { createAdminClient } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/db/constants/tables';
import { faqSchema } from '@/lib/utils/admin-validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminFaqsAPI');

/**
 * GET /api/admin/faqs
 * 
 * Fetches paginated, filterable, sortable list of FAQs.
 * Requirements: 9.1, 9.2
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit: adminRead (300 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminRead', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);
    const sortBy = searchParams.get('sortBy') ?? 'display_order';
    const sortDirection = searchParams.get('sortDirection') ?? 'asc';
    const search = searchParams.get('search') ?? '';
    const category = searchParams.get('category');

    // Build query
    let query = supabase
      .from(TABLES.FAQS)
      .select('*', { count: 'exact' });

    // Apply category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Apply search filter
    if (search) {
      query = query.or(`question.ilike.%${search}%,answer.ilike.%${search}%`);
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
      log.error('Error fetching FAQs', error, { action: 'GET' });
      return NextResponse.json(
        { error: 'Failed to fetch FAQs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
    });
  } catch (error) {
    log.error('Error in GET /api/admin/faqs', error, { action: 'GET' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/faqs
 * 
 * Creates a new FAQ.
 * Requirements: 9.5
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const supabase = createAdminClient();
    const body = await request.json();

    // Validate input
    const validationResult = faqSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Get max display_order if not provided
    if (data.display_order === undefined) {
      const { data: maxOrderData } = await supabase
        .from(TABLES.FAQS)
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single();

      data.display_order = (maxOrderData?.display_order ?? 0) + 1;
    }

    // Insert FAQ
    const { data: faq, error } = await supabase
      .from(TABLES.FAQS)
      .insert(data)
      .select()
      .single();

    if (error) {
      log.error('Error creating FAQ', error, { action: 'POST' });
      return NextResponse.json(
        { error: 'Failed to create FAQ' },
        { status: 500 }
      );
    }

    return NextResponse.json(faq, { status: 201 });
  } catch (error) {
    log.error('Error in POST /api/admin/faqs', error, { action: 'POST' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
