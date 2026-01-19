'use server';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { createAdminClient } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/db/constants/tables';
import { faqSchema } from '@/lib/utils/admin-validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminFaqsIdAPI');

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/faqs/[id]
 * 
 * Fetches a single FAQ by ID.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit: adminRead (300 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminRead', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    // Parallelize auth and params (both independent after rate limit passes)
    const [, { id }] = await Promise.all([
      requireAdmin(),
      params
    ]);

    // Create Supabase client after security checks pass
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from(TABLES.FAQS)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'FAQ not found' },
          { status: 404 }
        );
      }
      log.error('Error fetching FAQ', error, { action: 'GET' });
      return NextResponse.json(
        { error: 'Failed to fetch FAQ' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    log.error('Error in GET /api/admin/faqs/[id]', error, { action: 'GET' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/faqs/[id]
 * 
 * Updates an existing FAQ.
 * Requirements: 9.5
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    // Parallelize auth, params, and body parsing (all independent after rate limit)
    const [, { id }, body] = await Promise.all([
      requireAdmin(),
      params,
      request.json()
    ]);

    // Validate input FIRST (before any DB calls)
    const validationResult = faqSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Create Supabase client after validation passes
    const supabase = createAdminClient();
    const data = validationResult.data;

    // Update FAQ
    const { data: faq, error } = await supabase
      .from(TABLES.FAQS)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'FAQ not found' },
          { status: 404 }
        );
      }
      log.error('Error updating FAQ', error, { action: 'PUT' });
      return NextResponse.json(
        { error: 'Failed to update FAQ' },
        { status: 500 }
      );
    }

    return NextResponse.json(faq);
  } catch (error) {
    log.error('Error in PUT /api/admin/faqs/[id]', error, { action: 'PUT' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/faqs/[id]
 * 
 * Deletes an FAQ.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    // Parallelize auth and params (both independent after rate limit passes)
    const [, { id }] = await Promise.all([
      requireAdmin(),
      params
    ]);

    // Create Supabase client after security checks pass
    const supabase = createAdminClient();

    const { error } = await supabase
      .from(TABLES.FAQS)
      .delete()
      .eq('id', id);

    if (error) {
      log.error('Error deleting FAQ', error, { action: 'DELETE' });
      return NextResponse.json(
        { error: 'Failed to delete FAQ' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Error in DELETE /api/admin/faqs/[id]', error, { action: 'DELETE' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
