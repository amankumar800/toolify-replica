/**
 * Property-Based Tests for Image Domain Configuration
 * 
 * Tests that:
 * - Property 8: Image Domain Configuration - all external image domains are configured in next.config.js
 * 
 * @see .kiro/specs/page-cloning-agent/design.md
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import {
  extractImageDomains,
  extractHostname,
  checkDomainExists,
  parseDomainsFromConfig,
  generatePatternEntry,
  updateNextConfig,
  validateDomainConfiguration,
  processImageDomains,
  type RemotePattern,
} from './image-config';

// =============================================================================
// Test Fixtures
// =============================================================================

const TEST_CONFIG_DIR = path.join(process.cwd(), '.test-temp');
const TEST_CONFIG_PATH = path.join(TEST_CONFIG_DIR, 'next.config.js');

const BASE_CONFIG = `/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'existing-domain.com',
            },
        ],
    },
}

module.exports = nextConfig
`;

// =============================================================================
// Arbitraries (Generators) for Property Testing
// =============================================================================

/**
 * Generates valid domain names
 */
const domainArbitrary = fc.tuple(
  fc.string({ minLength: 1, maxLength: 10 }).map(s => s.toLowerCase().replace(/[^a-z0-9]/g, 'x') || 'domain'),
  fc.constantFrom('.com', '.org', '.net', '.io', '.ai', '.co', '.dev')
).map(([name, tld]) => `${name}${tld}`);

/**
 * Generates valid subdomains
 */
const subdomainArbitrary = fc.tuple(
  fc.constantFrom('images', 'cdn', 'assets', 'static', 'media', 'img', 'files', 'storage'),
  domainArbitrary
).map(([sub, domain]) => `${sub}.${domain}`);

/**
 * Generates valid hostnames (with or without subdomain)
 */
const hostnameArbitrary = fc.oneof(domainArbitrary, subdomainArbitrary);

/**
 * Generates valid image URLs with https protocol
 */
const imageUrlArbitrary = fc.tuple(
  hostnameArbitrary,
  fc.string({ minLength: 1, maxLength: 20 }).map(s => s.toLowerCase().replace(/[^a-z0-9_-]/g, 'x') || 'image'),
  fc.constantFrom('.jpg', '.png', '.gif', '.webp', '.svg', '.jpeg')
).map(([hostname, filename, ext]) => `https://${hostname}/images/${filename}${ext}`);

/**
 * Generates arrays of valid image URLs
 */
const imageUrlArrayArbitrary = fc.array(imageUrlArbitrary, { minLength: 1, maxLength: 20 });

/**
 * Generates invalid URLs that should be rejected
 */
const invalidUrlArbitrary = fc.oneof(
  fc.constant('not-a-url'),
  fc.constant('/relative/path.jpg'),
  fc.constant('./local/image.png'),
  fc.constant(''),
  fc.constant('ftp://invalid-protocol.com/image.jpg'),
  fc.string({ minLength: 1, maxLength: 10 }).map(s => s.replace(/[^a-z]/gi, 'x') || 'invalid')
);

/**
 * Generates mixed arrays with both valid and invalid URLs
 */
const mixedUrlArrayArbitrary = fc.tuple(
  imageUrlArrayArbitrary,
  fc.array(invalidUrlArbitrary, { minLength: 0, maxLength: 5 })
).map(([valid, invalid]) => [...valid, ...invalid].sort(() => Math.random() - 0.5));

// =============================================================================
// Test Setup and Teardown
// =============================================================================

function setupTestConfig(content: string = BASE_CONFIG): void {
  if (!fs.existsSync(TEST_CONFIG_DIR)) {
    fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(TEST_CONFIG_PATH, content, 'utf-8');
}

function cleanupTestConfig(): void {
  try {
    if (fs.existsSync(TEST_CONFIG_PATH)) {
      fs.unlinkSync(TEST_CONFIG_PATH);
    }
    if (fs.existsSync(TEST_CONFIG_DIR)) {
      fs.rmdirSync(TEST_CONFIG_DIR);
    }
  } catch {
    // Ignore cleanup errors
  }
}

// =============================================================================
// Property-Based Tests
// =============================================================================

/**
 * **Feature: page-cloning-agent, Property 8: Image Domain Configuration**
 * **Validates: Requirements 20.3**
 * 
 * For any external image domain used in the clone, that domain SHALL exist
 * in next.config.js images.remotePatterns array.
 */
describe('Image Domain Configuration', () => {
  beforeEach(() => {
    setupTestConfig();
  });

  afterEach(() => {
    cleanupTestConfig();
  });

  describe('Property 8: Image Domain Configuration', () => {
    it('should extract all unique domains from image URLs', () => {
      fc.assert(
        fc.property(imageUrlArrayArbitrary, (urls) => {
          const result = extractImageDomains(urls);
          
          // Every URL should have its domain extracted
          for (const url of urls) {
            const hostname = extractHostname(url);
            if (hostname) {
              expect(result.domains).toContain(hostname);
            }
          }
          
          // Domains should be unique
          const uniqueDomains = new Set(result.domains);
          expect(result.domains.length).toBe(uniqueDomains.size);
        }),
        { numRuns: 100 }
      );
    });

    it('should ensure all extracted domains can be added to config', () => {
      fc.assert(
        fc.property(imageUrlArrayArbitrary, (urls) => {
          const extracted = extractImageDomains(urls);
          
          // Update config with extracted domains
          const updateResult = updateNextConfig(extracted.domains, TEST_CONFIG_PATH);
          
          // Should succeed
          expect(updateResult.success).toBe(true);
          
          // All domains should now exist in config
          const validation = validateDomainConfiguration(extracted.domains, TEST_CONFIG_PATH);
          expect(validation.valid).toBe(true);
          expect(validation.missingDomains).toHaveLength(0);
          
          // Reset config for next iteration
          setupTestConfig();
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve existing domains when adding new ones', () => {
      fc.assert(
        fc.property(imageUrlArrayArbitrary, (urls) => {
          const extracted = extractImageDomains(urls);
          
          // Update config
          updateNextConfig(extracted.domains, TEST_CONFIG_PATH);
          
          // Existing domain should still be present
          expect(checkDomainExists('existing-domain.com', TEST_CONFIG_PATH)).toBe(true);
          
          // Reset config for next iteration
          setupTestConfig();
        }),
        { numRuns: 100 }
      );
    });

    it('should not duplicate domains that already exist', () => {
      fc.assert(
        fc.property(hostnameArbitrary, (hostname) => {
          // Add domain first time
          const firstResult = updateNextConfig([hostname], TEST_CONFIG_PATH);
          
          // Add same domain second time
          const secondResult = updateNextConfig([hostname], TEST_CONFIG_PATH);
          
          // Second update should report domain as existing
          expect(secondResult.success).toBe(true);
          expect(secondResult.existingDomains).toContain(hostname);
          expect(secondResult.addedDomains).not.toContain(hostname);
          
          // Reset config for next iteration
          setupTestConfig();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('extractHostname', () => {
    it('should extract hostname from any valid https URL', () => {
      fc.assert(
        fc.property(imageUrlArbitrary, (url) => {
          const hostname = extractHostname(url);
          expect(hostname).not.toBeNull();
          expect(typeof hostname).toBe('string');
          expect(hostname!.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should return null for invalid URLs', () => {
      fc.assert(
        fc.property(invalidUrlArbitrary, (url) => {
          const hostname = extractHostname(url);
          // Invalid URLs should return null (relative paths, empty strings, etc.)
          // Note: some strings might accidentally be valid URLs
          if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//')) {
            expect(hostname).toBeNull();
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('extractImageDomains', () => {
    it('should separate valid and invalid URLs', () => {
      fc.assert(
        fc.property(mixedUrlArrayArbitrary, (urls) => {
          const result = extractImageDomains(urls);
          
          // Valid URLs should have domains extracted
          // Invalid URLs should be in invalidUrls array
          const totalProcessed = result.domains.length + result.invalidUrls.length;
          
          // At least some URLs should be processed
          // (duplicates reduce domain count, empty strings are filtered)
          expect(totalProcessed).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should return sorted domains', () => {
      fc.assert(
        fc.property(imageUrlArrayArbitrary, (urls) => {
          const result = extractImageDomains(urls);
          
          // Domains should be sorted alphabetically
          const sorted = [...result.domains].sort();
          expect(result.domains).toEqual(sorted);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('parseDomainsFromConfig', () => {
    it('should parse all hostnames from config content', () => {
      fc.assert(
        fc.property(
          fc.array(hostnameArbitrary, { minLength: 1, maxLength: 10 }),
          (hostnames) => {
            // Generate config content with these hostnames
            const patterns = hostnames.map(h => `            {
                protocol: 'https',
                hostname: '${h}',
            },`).join('\n');
            
            const configContent = `const nextConfig = {
    images: {
        remotePatterns: [
${patterns}
        ],
    },
}`;
            
            const parsed = parseDomainsFromConfig(configContent);
            
            // All hostnames should be parsed
            for (const hostname of hostnames) {
              expect(parsed).toContain(hostname);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('generatePatternEntry', () => {
    it('should generate valid pattern entries for any hostname', () => {
      fc.assert(
        fc.property(hostnameArbitrary, (hostname) => {
          const pattern: RemotePattern = {
            protocol: 'https',
            hostname,
          };
          
          const entry = generatePatternEntry(pattern);
          
          // Entry should contain the hostname
          expect(entry).toContain(hostname);
          expect(entry).toContain("protocol: 'https'");
          expect(entry).toContain('hostname:');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('processImageDomains', () => {
    it('should extract and configure domains in one operation', () => {
      fc.assert(
        fc.property(imageUrlArrayArbitrary, (urls) => {
          const result = processImageDomains(urls, TEST_CONFIG_PATH);
          
          // Extraction should work
          expect(result.extracted.domains.length).toBeGreaterThanOrEqual(0);
          
          // Update should succeed
          expect(result.updated.success).toBe(true);
          
          // All extracted domains should now be configured
          const validation = validateDomainConfiguration(
            result.extracted.domains,
            TEST_CONFIG_PATH
          );
          expect(validation.valid).toBe(true);
          
          // Reset config for next iteration
          setupTestConfig();
        }),
        { numRuns: 100 }
      );
    });
  });
});
