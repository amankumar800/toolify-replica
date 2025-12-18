/**
 * Property-Based Tests for Link Processing Utilities
 * 
 * Tests that:
 * - Property 4: External Link Preservation - external links preserve exact URLs including query params
 * - Property 5: External Link Security Attributes - external links have target="_blank" and rel="noopener noreferrer"
 * 
 * @see .kiro/specs/page-cloning-agent/design.md
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  classifyLink,
  preserveExternalLink,
  addSecurityAttributes,
  mapInternalLink,
  processLink,
  renderExternalLink,
  hasSecurityAttributes,
  extractHref,
} from './link-utils';

// =============================================================================
// Arbitraries (Generators) for Link Testing
// =============================================================================

/**
 * Generates valid URL-safe strings for path segments
 */
const pathSegmentArbitrary = fc.string({ minLength: 1, maxLength: 20 })
  .filter((s: string) => /^[a-zA-Z0-9\-_]+$/.test(s));

/**
 * Generates valid query parameter keys
 */
const queryKeyArbitrary = fc.string({ minLength: 1, maxLength: 15 })
  .filter((s: string) => /^[a-zA-Z0-9_]+$/.test(s));

/**
 * Generates valid query parameter values (URL-safe)
 */
const queryValueArbitrary = fc.string({ minLength: 0, maxLength: 30 })
  .map((s: string) => s.replace(/[^a-zA-Z0-9\-_.~]/g, ''));

/**
 * Generates query parameter pairs
 */
const queryParamArbitrary = fc.tuple(queryKeyArbitrary, queryValueArbitrary)
  .map(([key, value]: [string, string]) => `${key}=${value}`);

/**
 * Generates query strings with multiple parameters
 */
const queryStringArbitrary = fc.array(queryParamArbitrary, { minLength: 0, maxLength: 5 })
  .map((params: string[]) => params.length > 0 ? `?${params.join('&')}` : '');

/**
 * Generates valid domain names
 */
const domainArbitrary = fc.tuple(
  pathSegmentArbitrary,
  fc.constantFrom('.com', '.org', '.net', '.io', '.co', '.ai')
).map(([name, tld]: [string, string]) => `${name.toLowerCase()}${tld}`);

/**
 * Generates URL paths
 */
const urlPathArbitrary = fc.array(pathSegmentArbitrary, { minLength: 0, maxLength: 4 })
  .map((segments: string[]) => segments.length > 0 ? `/${segments.join('/')}` : '');

/**
 * Generates complete external URLs with query parameters
 */
const externalUrlArbitrary = fc.tuple(
  fc.constantFrom('https://', 'http://'),
  domainArbitrary,
  urlPathArbitrary,
  queryStringArbitrary
).map(([protocol, domain, path, query]: [string, string, string, string]) => 
  `${protocol}${domain}${path}${query}`
);

/**
 * Generates external URLs with common tracking parameters (utm_source, ref, etc.)
 */
const externalUrlWithTrackingArbitrary = fc.tuple(
  fc.constantFrom('https://', 'http://'),
  domainArbitrary,
  urlPathArbitrary,
  fc.record({
    utm_source: fc.option(queryValueArbitrary, { nil: undefined }),
    utm_medium: fc.option(queryValueArbitrary, { nil: undefined }),
    utm_campaign: fc.option(queryValueArbitrary, { nil: undefined }),
    ref: fc.option(queryValueArbitrary, { nil: undefined }),
    source: fc.option(queryValueArbitrary, { nil: undefined }),
  })
).map(([protocol, domain, path, params]) => {
  const queryParts = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`);
  const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return `${protocol}${domain}${path}${query}`;
});

/**
 * Generates internal link paths
 */
const internalLinkArbitrary = fc.oneof(
  urlPathArbitrary.filter((p: string) => p.length > 0),
  fc.constant('/'),
  pathSegmentArbitrary.map((s: string) => `/${s}`)
);

/**
 * Generates anchor links
 */
const anchorLinkArbitrary = pathSegmentArbitrary.map((s: string) => `#${s}`);

/**
 * Generates anchor text
 */
const anchorTextArbitrary = fc.string({ minLength: 1, maxLength: 50 })
  .map((s: string) => s.replace(/[<>"']/g, '') || 'link');

// =============================================================================
// Property-Based Tests
// =============================================================================

/**
 * **Feature: page-cloning-agent, Property 4: External Link Preservation**
 * **Validates: Requirements 7.2**
 * 
 * For any external link extracted from the source, the implemented link
 * SHALL contain the exact same URL including all query parameters.
 */
describe('External Link Preservation', () => {
  describe('Property 4: External Link Preservation', () => {
    it('should preserve external URLs exactly as-is', () => {
      fc.assert(
        fc.property(externalUrlArbitrary, (url: string) => {
          const preserved = preserveExternalLink(url);
          expect(preserved).toBe(url.trim());
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve all query parameters including tracking params', () => {
      fc.assert(
        fc.property(externalUrlWithTrackingArbitrary, (url: string) => {
          const preserved = preserveExternalLink(url);
          // The preserved URL should be identical to the input
          expect(preserved).toBe(url.trim());
          
          // If the original has query params, they should all be present
          if (url.includes('?')) {
            const originalParams = url.split('?')[1];
            const preservedParams = preserved.split('?')[1];
            expect(preservedParams).toBe(originalParams);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve URLs through processLink for external links', () => {
      fc.assert(
        fc.property(externalUrlArbitrary, anchorTextArbitrary, (url: string, text: string) => {
          const processed = processLink(url, text);
          expect(processed.href).toBe(url.trim());
          expect(processed.type).toBe('external');
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve URLs in rendered external links', () => {
      fc.assert(
        fc.property(externalUrlArbitrary, anchorTextArbitrary, (url: string, text: string) => {
          const rendered = renderExternalLink(url, text);
          const extractedHref = extractHref(rendered);
          expect(extractedHref).toBe(url.trim());
        }),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * **Feature: page-cloning-agent, Property 5: External Link Security Attributes**
 * **Validates: Requirements 7.3, 25.2**
 * 
 * For any external link in the implemented clone, the link element
 * SHALL have target="_blank" and rel="noopener noreferrer" attributes.
 */
describe('External Link Security Attributes', () => {
  describe('Property 5: External Link Security Attributes', () => {
    it('should always return target="_blank" from addSecurityAttributes', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const attrs = addSecurityAttributes();
          expect(attrs.target).toBe('_blank');
        }),
        { numRuns: 100 }
      );
    });

    it('should always return rel="noopener noreferrer" from addSecurityAttributes', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const attrs = addSecurityAttributes();
          expect(attrs.rel).toBe('noopener noreferrer');
        }),
        { numRuns: 100 }
      );
    });

    it('should add security attributes to processed external links', () => {
      fc.assert(
        fc.property(externalUrlArbitrary, anchorTextArbitrary, (url: string, text: string) => {
          const processed = processLink(url, text);
          expect(processed.type).toBe('external');
          expect(processed.attributes.target).toBe('_blank');
          expect(processed.attributes.rel).toBe('noopener noreferrer');
        }),
        { numRuns: 100 }
      );
    });

    it('should include security attributes in rendered external links', () => {
      fc.assert(
        fc.property(externalUrlArbitrary, anchorTextArbitrary, (url: string, text: string) => {
          const rendered = renderExternalLink(url, text);
          expect(rendered).toContain('target="_blank"');
          expect(rendered).toContain('rel="noopener noreferrer"');
        }),
        { numRuns: 100 }
      );
    });

    it('should detect security attributes with hasSecurityAttributes', () => {
      fc.assert(
        fc.property(externalUrlArbitrary, anchorTextArbitrary, (url: string, text: string) => {
          const rendered = renderExternalLink(url, text);
          expect(hasSecurityAttributes(rendered)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should not add security attributes to internal links', () => {
      fc.assert(
        fc.property(internalLinkArbitrary, anchorTextArbitrary, (url: string, text: string) => {
          const processed = processLink(url, text);
          expect(processed.type).toBe('internal');
          expect(processed.attributes.target).toBeUndefined();
          expect(processed.attributes.rel).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should not add security attributes to anchor links', () => {
      fc.assert(
        fc.property(anchorLinkArbitrary, anchorTextArbitrary, (url: string, text: string) => {
          const processed = processLink(url, text);
          expect(processed.type).toBe('anchor');
          expect(processed.attributes.target).toBeUndefined();
          expect(processed.attributes.rel).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });
  });
});

// =============================================================================
// Unit Tests for Link Classification
// =============================================================================

describe('classifyLink', () => {
  it('should classify external URLs correctly', () => {
    fc.assert(
      fc.property(externalUrlArbitrary, (url: string) => {
        const type = classifyLink(url);
        expect(type).toBe('external');
      }),
      { numRuns: 100 }
    );
  });

  it('should classify internal paths correctly', () => {
    fc.assert(
      fc.property(internalLinkArbitrary, (url: string) => {
        const type = classifyLink(url);
        expect(type).toBe('internal');
      }),
      { numRuns: 100 }
    );
  });

  it('should classify anchor links correctly', () => {
    fc.assert(
      fc.property(anchorLinkArbitrary, (url: string) => {
        const type = classifyLink(url);
        expect(type).toBe('anchor');
      }),
      { numRuns: 100 }
    );
  });

  it('should classify mailto links correctly', () => {
    fc.assert(
      fc.property(
        fc.emailAddress().map((email: string) => `mailto:${email}`),
        (url: string) => {
          const type = classifyLink(url);
          expect(type).toBe('mailto');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should classify tel links correctly', () => {
    // Use a simpler generator that doesn't require filtering
    const telNumbers = [
      'tel:+1234567890',
      'tel:555-1234',
      'tel:+44-20-7946-0958',
      'tel:1-800-555-1234',
      'tel:+1-555-555-5555',
    ];
    
    for (const url of telNumbers) {
      const type = classifyLink(url);
      expect(type).toBe('tel');
    }
  });
});

describe('mapInternalLink', () => {
  it('should return original href when no mapping provided', () => {
    fc.assert(
      fc.property(internalLinkArbitrary, (url: string) => {
        const result = mapInternalLink(url);
        expect(result.mappedHref).toBe(url.trim());
        expect(result.isValid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should apply route mapping when provided', () => {
    const mapping = { '/tools': '/tool', '/categories': '/category' };
    
    expect(mapInternalLink('/tools/ai-chat', mapping).mappedHref).toBe('/tool/ai-chat');
    expect(mapInternalLink('/categories/writing', mapping).mappedHref).toBe('/category/writing');
    expect(mapInternalLink('/about', mapping).mappedHref).toBe('/about');
  });
});
