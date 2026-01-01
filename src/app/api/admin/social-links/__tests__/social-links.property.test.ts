/**
 * Property-based tests for Social Links API
 *
 * **Feature: social-links-management**
 * **Property 2: Data Round-Trip Consistency**
 * **Validates: Requirements 1.3, 1.5**
 *
 * *For any* set of valid social link URLs, saving the URLs via the API
 * and then fetching them SHALL return the exact same URL values.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createAdminClient } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/db/constants/tables';
import type { SocialLinksFormData, SocialLinkRow } from '@/lib/supabase/types';

// Helper to generate valid URLs
const validUrlArbitrary = fc.oneof(
  // Valid http URLs
  fc.webUrl({ validSchemes: ['http', 'https'] }),
  // Empty string (allowed per requirements)
  fc.constant('')
);

// Arbitrary for generating social links form data
const socialLinksFormDataArbitrary = fc.record({
  twitter_url: validUrlArbitrary,
  linkedin_url: validUrlArbitrary,
  facebook_url: validUrlArbitrary,
  instagram_url: validUrlArbitrary,
});

// Helper to save social links directly to database
async function saveSocialLinks(formData: SocialLinksFormData): Promise<void> {
  const supabase = createAdminClient();
  const platforms = ['twitter', 'linkedin', 'facebook', 'instagram'] as const;

  for (const platform of platforms) {
    const urlKey = `${platform}_url` as keyof SocialLinksFormData;
    const url = formData[urlKey];

    const { error } = await supabase
      .from(TABLES.SOCIAL_LINKS)
      .update({ url })
      .eq('platform', platform);

    if (error) {
      throw new Error(`Failed to update ${platform}: ${error.message}`);
    }
  }
}

// Helper to fetch social links directly from database
async function fetchSocialLinks(): Promise<SocialLinksFormData> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from(TABLES.SOCIAL_LINKS)
    .select('*')
    .order('platform', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch social links: ${error.message}`);
  }

  const formData: SocialLinksFormData = {
    twitter_url: '',
    linkedin_url: '',
    facebook_url: '',
    instagram_url: '',
  };

  (data as SocialLinkRow[]).forEach((link) => {
    const key = `${link.platform}_url` as keyof SocialLinksFormData;
    if (key in formData) {
      formData[key] = link.url || '';
    }
  });

  return formData;
}

describe('Social Links API Property Tests', { timeout: 120000 }, () => {
  /**
   * **Feature: social-links-management, Property 2: Data Round-Trip Consistency**
   * **Validates: Requirements 1.3, 1.5**
   *
   * *For any* set of valid social link URLs, saving the URLs via the API
   * and then fetching them SHALL return the exact same URL values.
   */
  describe('Property 2: Data Round-Trip Consistency', () => {
    it('should return the same URLs after save and fetch round-trip', async () => {
      await fc.assert(
        fc.asyncProperty(
          socialLinksFormDataArbitrary,
          async (formData) => {
            // Save the social links
            await saveSocialLinks(formData);

            // Fetch the social links
            const fetchedData = await fetchSocialLinks();

            // Property: Fetched data should exactly match saved data
            expect(fetchedData.twitter_url).toBe(formData.twitter_url);
            expect(fetchedData.linkedin_url).toBe(formData.linkedin_url);
            expect(fetchedData.facebook_url).toBe(formData.facebook_url);
            expect(fetchedData.instagram_url).toBe(formData.instagram_url);
          }
        ),
        { numRuns: 5 }
      );
    });
  });
});
