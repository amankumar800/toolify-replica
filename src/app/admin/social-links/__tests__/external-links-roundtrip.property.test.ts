/**
 * Property-based tests for external links round-trip persistence
 *
 * Tests Property 9 from the company-pages-management design document:
 * - Property 9: External Links Round-Trip
 *
 * **Feature: company-pages-management**
 * **Validates: Requirements 5.4**
 *
 * To run these tests, you need to set SUPABASE_SERVICE_ROLE_KEY in your environment.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database, SocialLinksFormData } from '@/lib/supabase/types';
import { TABLES } from '@/lib/db/constants/tables';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_KEY;

// External link platforms
const EXTERNAL_LINK_PLATFORMS = ['community', 'help_center'] as const;

// Store original values for cleanup
const originalValues: Map<string, string> = new Map();

describe.skipIf(shouldSkip)('External Links Round-Trip Property Tests', { timeout: 120000 }, () => {
  let supabase: SupabaseClient<Database>;

  beforeAll(async () => {
    supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Store original values for external link platforms before tests
    for (const platform of EXTERNAL_LINK_PLATFORMS) {
      const { data } = await supabase
        .from(TABLES.SOCIAL_LINKS)
        .select('url')
        .eq('platform', platform)
        .single();

      if (data) {
        originalValues.set(platform, data.url || '');
      }
    }
  });

  afterAll(async () => {
    // Restore original values after tests
    for (const [platform, url] of originalValues.entries()) {
      await supabase
        .from(TABLES.SOCIAL_LINKS)
        .update({ url })
        .eq('platform', platform);
    }
  });

  /**
   * Helper function to update an external link URL
   */
  async function updateExternalLink(platform: string, url: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.SOCIAL_LINKS)
      .update({ url })
      .eq('platform', platform);

    if (error) {
      throw new Error(`Failed to update ${platform}: ${error.message}`);
    }
  }

  /**
   * Helper function to fetch an external link URL
   */
  async function fetchExternalLink(platform: string): Promise<string | null> {
    const { data, error } = await supabase
      .from(TABLES.SOCIAL_LINKS)
      .select('url')
      .eq('platform', platform)
      .single();

    if (error) {
      return null;
    }

    return data?.url ?? null;
  }

  /**
   * **Feature: company-pages-management, Property 9: External Links Round-Trip**
   * **Validates: Requirements 5.4**
   *
   * *For any* set of valid external link URLs (Community, Help Center), saving the URLs
   * via the API and then fetching them SHALL return the exact same URL values.
   */
  describe('Property 9: External Links Round-Trip', () => {
    // Arbitrary for generating valid HTTP URLs
    const validUrlArb = fc
      .tuple(
        fc.constantFrom('http://', 'https://'),
        fc.stringMatching(/^[a-z0-9-]{1,20}$/),
        fc.stringMatching(/^[a-z]{2,6}$/),
        fc.option(fc.stringMatching(/^\/[a-z0-9\/-]{0,30}$/), { nil: undefined })
      )
      .map(([protocol, domain, tld, path]) => `${protocol}${domain}.${tld}${path || ''}`);

    // Arbitrary for generating valid URL or empty string
    const validUrlOrEmptyArb = fc.oneof(validUrlArb, fc.constant(''));

    // Arbitrary for selecting an external link platform
    const externalLinkPlatformArb = fc.constantFrom(...EXTERNAL_LINK_PLATFORMS);

    it('should return exact same URL after save for community link (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(validUrlOrEmptyArb, async (url) => {
          // Save the URL
          await updateExternalLink('community', url);

          // Fetch the URL
          const fetchedUrl = await fetchExternalLink('community');

          // Property: The fetched URL should be exactly what was saved
          expect(fetchedUrl).toBe(url);
        }),
        { numRuns: 5 }
      );
    });

    it('should return exact same URL after save for help_center link (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(validUrlOrEmptyArb, async (url) => {
          // Save the URL
          await updateExternalLink('help_center', url);

          // Fetch the URL
          const fetchedUrl = await fetchExternalLink('help_center');

          // Property: The fetched URL should be exactly what was saved
          expect(fetchedUrl).toBe(url);
        }),
        { numRuns: 5 }
      );
    });

    it('should preserve URLs for both external link platforms independently (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUrlOrEmptyArb,
          validUrlOrEmptyArb,
          async (communityUrl, helpCenterUrl) => {
            // Save both URLs
            await updateExternalLink('community', communityUrl);
            await updateExternalLink('help_center', helpCenterUrl);

            // Fetch both URLs
            const fetchedCommunityUrl = await fetchExternalLink('community');
            const fetchedHelpCenterUrl = await fetchExternalLink('help_center');

            // Property: Both URLs should be exactly what was saved
            expect(fetchedCommunityUrl).toBe(communityUrl);
            expect(fetchedHelpCenterUrl).toBe(helpCenterUrl);
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should handle URLs with special characters in path', async () => {
      const testUrls = [
        'https://community.example.com/path/to/page',
        'https://help.example.com/docs/getting-started',
        'https://discord.gg/invite-code-123',
        'https://support.example.com/kb/article-1',
      ];

      for (const url of testUrls) {
        // Save and fetch for community
        await updateExternalLink('community', url);
        const fetchedCommunity = await fetchExternalLink('community');
        expect(fetchedCommunity).toBe(url);

        // Save and fetch for help_center
        await updateExternalLink('help_center', url);
        const fetchedHelpCenter = await fetchExternalLink('help_center');
        expect(fetchedHelpCenter).toBe(url);
      }
    });

    it('should handle empty URLs correctly', async () => {
      // Save empty URLs
      await updateExternalLink('community', '');
      await updateExternalLink('help_center', '');

      // Fetch and verify
      const fetchedCommunity = await fetchExternalLink('community');
      const fetchedHelpCenter = await fetchExternalLink('help_center');

      expect(fetchedCommunity).toBe('');
      expect(fetchedHelpCenter).toBe('');
    });

    it('should update URLs independently without affecting other platform', async () => {
      // Set initial values
      const initialCommunity = 'https://community.example.com';
      const initialHelpCenter = 'https://help.example.com';

      await updateExternalLink('community', initialCommunity);
      await updateExternalLink('help_center', initialHelpCenter);

      // Update only community
      const newCommunity = 'https://new-community.example.com';
      await updateExternalLink('community', newCommunity);

      // Verify community changed but help_center unchanged
      const fetchedCommunity = await fetchExternalLink('community');
      const fetchedHelpCenter = await fetchExternalLink('help_center');

      expect(fetchedCommunity).toBe(newCommunity);
      expect(fetchedHelpCenter).toBe(initialHelpCenter);
    });
  });
});
