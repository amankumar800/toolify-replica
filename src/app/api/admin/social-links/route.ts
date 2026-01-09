'use server';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { createAdminClient } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/db/constants/tables';
import { checkRateLimit } from '@/lib/rate-limit';
import type { SocialLinkRow, SocialLinksFormData } from '@/lib/supabase/types';

/**
 * GET /api/admin/social-links
 * 
 * Fetches all social links for the admin panel.
 * Requirements: 1.3
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit: adminRead (300 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminRead', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from(TABLES.SOCIAL_LINKS)
      .select('*')
      .order('platform', { ascending: true });

    if (error) {
      console.error('Error fetching social links:', error);
      return NextResponse.json(
        { error: 'Failed to fetch social links' },
        { status: 500 }
      );
    }

    // Transform to form data format (includes both social media and external links)
    const formData: SocialLinksFormData = {
      twitter_url: '',
      linkedin_url: '',
      facebook_url: '',
      instagram_url: '',
      community_url: '',
      help_center_url: '',
    };

    (data as SocialLinkRow[]).forEach((link) => {
      const key = `${link.platform}_url` as keyof SocialLinksFormData;
      if (key in formData) {
        formData[key] = link.url || '';
      }
    });

    return NextResponse.json({
      data: formData,
      raw: data,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/social-links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/social-links
 * 
 * Updates all social links (social media and external links).
 * Requirements: 1.5, 5.4
 */
export async function PUT(request: NextRequest) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    await requireAdmin();
    const supabase = createAdminClient();
    const body: SocialLinksFormData = await request.json();

    // Validate that we have the expected fields (social media + external links)
    const platforms = ['twitter', 'linkedin', 'facebook', 'instagram', 'community', 'help_center'] as const;
    const updates: { platform: string; url: string }[] = [];

    for (const platform of platforms) {
      const urlKey = `${platform}_url` as keyof SocialLinksFormData;
      const url = body[urlKey] ?? '';
      
      // URL validation is handled by the admin page before submission
      // Here we just ensure it's a string
      if (typeof url !== 'string') {
        return NextResponse.json(
          { error: `Invalid URL for ${platform}` },
          { status: 400 }
        );
      }

      updates.push({ platform, url });
    }

    // Update each platform's URL
    const results = await Promise.all(
      updates.map(async ({ platform, url }) => {
        const { data, error } = await supabase
          .from(TABLES.SOCIAL_LINKS)
          .update({ url })
          .eq('platform', platform)
          .select()
          .single();

        if (error) {
          console.error(`Error updating ${platform}:`, error);
          return { platform, success: false, error };
        }

        return { platform, success: true, data };
      })
    );

    // Check if any updates failed
    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      return NextResponse.json(
        { error: 'Failed to update some social links', failures },
        { status: 500 }
      );
    }

    // Return updated form data (includes both social media and external links)
    const formData: SocialLinksFormData = {
      twitter_url: '',
      linkedin_url: '',
      facebook_url: '',
      instagram_url: '',
      community_url: '',
      help_center_url: '',
    };

    results.forEach((result) => {
      if (result.success && result.data) {
        const key = `${result.platform}_url` as keyof SocialLinksFormData;
        formData[key] = result.data.url || '';
      }
    });

    return NextResponse.json({
      data: formData,
      message: 'Social links updated successfully',
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/social-links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
