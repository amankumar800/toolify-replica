import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/db/constants/tables';
import type { SocialLinkRow } from '@/lib/supabase/types';

/**
 * GET /api/social-links
 * 
 * Fetches active social links and external links for the footer.
 * Returns only platforms with non-empty URLs.
 * Requirements: 2.1, 2.2, 5.5
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from(TABLES.SOCIAL_LINKS)
      .select('*')
      .neq('url', '')
      .order('platform', { ascending: true });

    if (error) {
      console.error('Error fetching social links:', error);
      return NextResponse.json(
        { error: 'Failed to fetch social links' },
        { status: 500 }
      );
    }

    // Transform to response format (only non-empty URLs)
    // Includes both social media links and external links
    const response: Record<string, string> = {};

    (data as SocialLinkRow[]).forEach((link) => {
      if (link.url && link.url.trim() !== '') {
        response[link.platform] = link.url;
      }
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/social-links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
