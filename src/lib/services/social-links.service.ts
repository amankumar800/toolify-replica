/**
 * Social Links Service
 * 
 * Server-side service for fetching social links with caching.
 * Eliminates client-side API calls on every page load.
 */

import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { TABLES } from '@/lib/db/constants/tables';
import type { Database, SocialLinkRow, SocialLinksResponse, ExternalLinksResponse } from '@/lib/supabase/types';
import { createLogger } from '@/lib/logger';

const log = createLogger('SocialLinksService');

/**
 * Creates a static Supabase client for public data fetching.
 * This client doesn't use cookies, making it safe for use inside unstable_cache.
 */
function createStaticClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export interface FooterLinksData {
  socialLinks: SocialLinksResponse;
  externalLinks: ExternalLinksResponse;
}

/**
 * Internal function to fetch social links from Supabase
 */
async function fetchSocialLinksInternal(): Promise<FooterLinksData> {
  try {
    const supabase = createStaticClient();

    const { data, error } = await supabase
      .from(TABLES.SOCIAL_LINKS)
      .select('*')
      .neq('url', '')
      .order('platform', { ascending: true });

    if (error) {
      log.error('Error fetching social links', error, { action: 'fetchSocialLinksInternal' });
      return { socialLinks: {}, externalLinks: {} };
    }

    // Transform to response format
    const socialLinks: SocialLinksResponse = {};
    const externalLinks: ExternalLinksResponse = {};

    (data as SocialLinkRow[]).forEach((link) => {
      if (link.url && link.url.trim() !== '') {
        const platform = link.platform;
        if (platform === 'twitter') socialLinks.twitter = link.url;
        else if (platform === 'linkedin') socialLinks.linkedin = link.url;
        else if (platform === 'facebook') socialLinks.facebook = link.url;
        else if (platform === 'instagram') socialLinks.instagram = link.url;
        else if (platform === 'community') externalLinks.community = link.url;
        else if (platform === 'help_center') externalLinks.help_center = link.url;
      }
    });

    return { socialLinks, externalLinks };
  } catch (error) {
    log.error('Error in fetchSocialLinksInternal', error, { action: 'fetchSocialLinksInternal' });
    return { socialLinks: {}, externalLinks: {} };
  }
}

/**
 * Cached version of social links fetch.
 * Uses Next.js unstable_cache for server-side caching.
 * Cache is revalidated every hour (3600 seconds) since social links rarely change.
 */
export const getSocialLinks = unstable_cache(
  fetchSocialLinksInternal,
  ['social-links'],
  {
    revalidate: 3600, // 1 hour
    tags: ['social-links'],
  }
);
