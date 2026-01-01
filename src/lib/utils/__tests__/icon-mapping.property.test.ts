/**
 * Property-based tests for platform icon mapping utilities
 *
 * Tests Property 4 from the social-links-management design document:
 * - Property 4: Platform Icon Mapping
 *
 * **Feature: social-links-management**
 * **Validates: Requirements 2.4**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getSocialPlatformIcon,
  isSocialPlatform,
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_ICON_MAP,
  type SocialPlatform,
} from '../icon-mapping';
import { Twitter, Linkedin, Facebook, Instagram } from 'lucide-react';

describe('Platform Icon Mapping Property Tests', () => {
  /**
   * **Feature: social-links-management, Property 4: Platform Icon Mapping**
   * **Validates: Requirements 2.4**
   *
   * *For any* platform name in the set {twitter, linkedin, facebook, instagram},
   * the icon mapping function SHALL return the corresponding Lucide icon component.
   */
  describe('Property 4: Platform Icon Mapping', () => {
    // Arbitrary for generating valid platform names
    const validPlatformArb = fc.constantFrom<SocialPlatform>('twitter', 'linkedin', 'facebook', 'instagram');

    // Arbitrary for generating invalid platform names (strings not in the valid set)
    const invalidPlatformArb = fc
      .string({ minLength: 1, maxLength: 20 })
      .filter((s: string) => !SOCIAL_PLATFORMS.includes(s as SocialPlatform));

    // Expected mapping of platforms to icons
    const expectedIconMap: Record<SocialPlatform, typeof Twitter> = {
      twitter: Twitter,
      linkedin: Linkedin,
      facebook: Facebook,
      instagram: Instagram,
    };

    it('should return correct icon for all valid platforms (property test with 100 runs)', () => {
      fc.assert(
        fc.property(validPlatformArb, (platform) => {
          const icon = getSocialPlatformIcon(platform);

          // Property: Valid platforms should return their corresponding icon
          expect(icon).toBeDefined();
          expect(icon).toBe(expectedIconMap[platform]);
        }),
        { numRuns: 100 }
      );
    });

    it('should return undefined for invalid platform names (property test with 100 runs)', () => {
      fc.assert(
        fc.property(invalidPlatformArb, (platform) => {
          const icon = getSocialPlatformIcon(platform);

          // Property: Invalid platforms should return undefined
          expect(icon).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly identify valid platforms with isSocialPlatform (property test with 100 runs)', () => {
      fc.assert(
        fc.property(validPlatformArb, (platform) => {
          // Property: Valid platforms should be identified as such
          expect(isSocialPlatform(platform)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly reject invalid platforms with isSocialPlatform (property test with 100 runs)', () => {
      fc.assert(
        fc.property(invalidPlatformArb, (platform) => {
          // Property: Invalid platforms should be rejected
          expect(isSocialPlatform(platform)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should have exactly 4 platforms in SOCIAL_PLATFORMS', () => {
      expect(SOCIAL_PLATFORMS).toHaveLength(4);
      expect(SOCIAL_PLATFORMS).toContain('twitter');
      expect(SOCIAL_PLATFORMS).toContain('linkedin');
      expect(SOCIAL_PLATFORMS).toContain('facebook');
      expect(SOCIAL_PLATFORMS).toContain('instagram');
    });

    it('should have icon mappings for all platforms in SOCIAL_PLATFORM_ICON_MAP', () => {
      // Property: Every platform in SOCIAL_PLATFORMS should have a corresponding icon
      for (const platform of SOCIAL_PLATFORMS) {
        expect(SOCIAL_PLATFORM_ICON_MAP[platform]).toBeDefined();
      }
    });

    it('should map twitter to Twitter icon', () => {
      expect(getSocialPlatformIcon('twitter')).toBe(Twitter);
    });

    it('should map linkedin to Linkedin icon', () => {
      expect(getSocialPlatformIcon('linkedin')).toBe(Linkedin);
    });

    it('should map facebook to Facebook icon', () => {
      expect(getSocialPlatformIcon('facebook')).toBe(Facebook);
    });

    it('should map instagram to Instagram icon', () => {
      expect(getSocialPlatformIcon('instagram')).toBe(Instagram);
    });

    it('should handle case sensitivity correctly', () => {
      // Platform names are case-sensitive - uppercase should not match
      expect(getSocialPlatformIcon('Twitter')).toBeUndefined();
      expect(getSocialPlatformIcon('TWITTER')).toBeUndefined();
      expect(getSocialPlatformIcon('LinkedIn')).toBeUndefined();
      expect(getSocialPlatformIcon('Facebook')).toBeUndefined();
      expect(getSocialPlatformIcon('Instagram')).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(getSocialPlatformIcon('')).toBeUndefined();
    });
  });
});
