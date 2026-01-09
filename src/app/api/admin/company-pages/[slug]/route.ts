/**
 * Company Page Admin API Routes (by slug)
 *
 * Handles individual company page operations including fetch and update.
 *
 * Requirements: 2.2, 2.4, 2.5, 2.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/db/constants/tables';
import { getAdminFromRequest } from '@/lib/services/admin-auth.service';
import { checkRateLimit } from '@/lib/rate-limit';
import type { CompanyPageFormData, CompanyPageRow } from '@/lib/supabase/types';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * Validates company page form data.
 * Title must be non-empty after trimming whitespace.
 * Content can be empty (to show placeholder on frontend).
 *
 * Requirements: 2.4, 2.6, 2.7
 *
 * @param data - Form data to validate
 * @returns Validation result with errors if invalid
 */
export function validateCompanyPageData(data: CompanyPageFormData): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // Title validation: must be non-empty after trimming (Req 2.4, 2.6)
  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'Title is required';
  }

  // Content can be empty (Req 2.7) - no validation needed

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * GET /api/admin/company-pages/[slug]
 *
 * Fetches a single company page by slug.
 * Requires admin authentication.
 *
 * Requirements: 2.2
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit: adminRead (300 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminRead', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    // Check admin authentication
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from(TABLES.COMPANY_PAGES)
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('[company-pages] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch company page', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Company page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data as CompanyPageRow);
  } catch (error) {
    console.error('Error fetching company page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company page' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/company-pages/[slug]
 *
 * Updates a company page's title and content.
 * Requires admin authentication.
 * Validates that title is non-empty.
 *
 * Requirements: 2.4, 2.5, 2.6
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    // Check admin authentication
    const admin = await getAdminFromRequest();
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const body: CompanyPageFormData = await request.json();

    // Validate form data (Req 2.4, 2.6)
    const validation = validateCompanyPageData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if page exists
    const { data: existingPage, error: fetchError } = await supabase
      .from(TABLES.COMPANY_PAGES)
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (fetchError) {
      console.error('[company-pages] Supabase error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch company page', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!existingPage) {
      return NextResponse.json(
        { error: 'Company page not found' },
        { status: 404 }
      );
    }

    // Update the page (Req 2.5)
    const { data: updatedPage, error: updateError } = await supabase
      .from(TABLES.COMPANY_PAGES)
      .update({
        title: body.title.trim(),
        content: body.content ?? '',
      })
      .eq('slug', slug)
      .select()
      .single();

    if (updateError) {
      console.error('[company-pages] Supabase update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update company page', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: updatedPage as CompanyPageRow,
      message: 'Company page updated successfully',
    });
  } catch (error) {
    console.error('Error updating company page:', error);
    return NextResponse.json(
      { error: 'Failed to update company page' },
      { status: 500 }
    );
  }
}
