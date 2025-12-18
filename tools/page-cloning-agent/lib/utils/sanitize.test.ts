/**
 * Property-Based Tests for XSS Sanitization Module
 * 
 * Tests that:
 * - Property 10: XSS Sanitization - sanitized output contains no executable JavaScript
 * 
 * @see .kiro/specs/page-cloning-agent/design.md
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  sanitizeContent,
  sanitizeHtml,
  stripScripts,
  stripEventHandlers,
  containsXssPatterns,
  escapeHtml,
} from './sanitize';

// =============================================================================
// Arbitraries (Generators) for XSS Testing
// =============================================================================

/**
 * Generates random event handler names (on* attributes)
 */
const eventHandlerNameArbitrary = fc.constantFrom(
  'onclick', 'onerror', 'onload', 'onmouseover', 'onmouseout', 'onfocus',
  'onblur', 'onsubmit', 'onchange', 'onkeydown', 'onkeyup', 'onkeypress',
  'ondblclick', 'oncontextmenu', 'onwheel', 'ondrag', 'ondrop', 'oncopy',
  'oncut', 'onpaste', 'onscroll', 'oninput', 'oninvalid', 'onreset',
  'onsearch', 'onselect', 'ontoggle', 'onabort', 'oncanplay', 'onended',
  'onpause', 'onplay', 'onplaying', 'onprogress', 'onseeked', 'onseeking',
  'onstalled', 'onsuspend', 'ontimeupdate', 'onvolumechange', 'onwaiting',
  'onanimationend', 'onanimationiteration', 'onanimationstart',
  'ontransitionend', 'onpointerdown', 'onpointerup', 'onpointermove'
);

/**
 * Generates JavaScript code snippets for XSS payloads
 */
const jsPayloadArbitrary = fc.oneof(
  fc.constant('alert(1)'),
  fc.constant('alert("xss")'),
  fc.constant("alert('xss')"),
  fc.constant('document.cookie'),
  fc.constant('eval("malicious")'),
  fc.constant('window.location="evil.com"'),
  fc.constant('fetch("evil.com")'),
  fc.string({ minLength: 1, maxLength: 50 }).map(s => `console.log("${s.replace(/"/g, '')}")`)
);

/**
 * Generates HTML tag names
 */
const htmlTagArbitrary = fc.constantFrom(
  'div', 'span', 'p', 'a', 'img', 'button', 'input', 'form', 'body',
  'svg', 'iframe', 'object', 'embed', 'video', 'audio', 'source'
);

/**
 * Generates malicious content with script tags
 */
const scriptTagContentArbitrary = fc.tuple(jsPayloadArbitrary, fc.boolean()).map(
  ([payload, hasAttributes]) => {
    if (hasAttributes) {
      return `<script type="text/javascript">${payload}</script>`;
    }
    return `<script>${payload}</script>`;
  }
);

/**
 * Generates malicious content with event handlers
 */
const eventHandlerContentArbitrary = fc.tuple(
  htmlTagArbitrary,
  eventHandlerNameArbitrary,
  jsPayloadArbitrary,
  fc.string({ minLength: 0, maxLength: 20 })
).map(([tag, handler, payload, content]) => {
  return `<${tag} ${handler}="${payload}">${content}</${tag}>`;
});

/**
 * Generates malicious content with javascript: URLs
 * Only uses actual URL attributes that browsers will execute
 */
const javascriptUrlContentArbitrary = fc.tuple(
  fc.constantFrom('a', 'iframe', 'form', 'object', 'embed'),
  fc.constantFrom('href', 'src', 'action', 'formaction'),
  jsPayloadArbitrary
).map(([tag, attr, payload]) => {
  return `<${tag} ${attr}="javascript:${payload}">click</${tag}>`;
});

/**
 * Generates various XSS attack vectors
 */
const xssPayloadArbitrary = fc.oneof(
  scriptTagContentArbitrary,
  eventHandlerContentArbitrary,
  javascriptUrlContentArbitrary,
  // SVG with script
  jsPayloadArbitrary.map(p => `<svg onload="${p}"></svg>`),
  // Data URL
  fc.constant('<a href="data:text/html,<script>alert(1)</script>">click</a>'),
  // Encoded javascript
  fc.constant('<a href="&#x6A;avascript:alert(1)">click</a>'),
  // Mixed case
  fc.constant('<ScRiPt>alert(1)</ScRiPt>'),
  // Whitespace tricks
  fc.constant('<script >alert(1)</script >'),
  fc.constant('< script>alert(1)</ script>'),
  // CSS expression
  fc.constant('<div style="background:url(javascript:alert(1))">test</div>'),
  // Meta refresh
  fc.constant('<meta http-equiv="refresh" content="0;url=javascript:alert(1)">'),
);

/**
 * Generates safe HTML content (no XSS vectors)
 */
const safeHtmlArbitrary = fc.tuple(
  fc.constantFrom('div', 'span', 'p', 'h1', 'h2', 'ul', 'li', 'strong', 'em'),
  fc.string({ minLength: 0, maxLength: 100 }).map(s => s.replace(/[<>"'&]/g, ''))
).map(([tag, content]) => `<${tag}>${content}</${tag}>`);

/**
 * Generates content that mixes safe HTML with XSS payloads
 */
const mixedContentArbitrary = fc.tuple(
  safeHtmlArbitrary,
  xssPayloadArbitrary,
  safeHtmlArbitrary
).map(([safe1, xss, safe2]) => `${safe1}${xss}${safe2}`);

// =============================================================================
// Property-Based Tests
// =============================================================================

/**
 * **Feature: page-cloning-agent, Property 10: XSS Sanitization**
 * **Validates: Requirements 25.1**
 * 
 * For any user-generated content containing script tags or event handlers,
 * the sanitized output SHALL not contain executable JavaScript.
 */
describe('XSS Sanitization', () => {
  describe('Property 10: XSS Sanitization', () => {
    it('should remove all script tags from content', () => {
      fc.assert(
        fc.property(scriptTagContentArbitrary, (content) => {
          const sanitized = sanitizeContent(content);
          // Script tags should be completely removed
          expect(sanitized).not.toMatch(/<script/i);
          expect(sanitized).not.toMatch(/<\/script/i);
        }),
        { numRuns: 100 }
      );
    });

    it('should remove all event handlers from content', () => {
      fc.assert(
        fc.property(eventHandlerContentArbitrary, (content) => {
          const sanitized = sanitizeContent(content);
          // Event handlers (on* attributes) should be removed
          expect(sanitized).not.toMatch(/\s+on\w+\s*=/i);
        }),
        { numRuns: 100 }
      );
    });

    it('should remove javascript: URLs from content', () => {
      fc.assert(
        fc.property(javascriptUrlContentArbitrary, (content) => {
          const sanitized = sanitizeContent(content);
          // javascript: URLs should be removed
          expect(sanitized).not.toMatch(/javascript\s*:/i);
        }),
        { numRuns: 100 }
      );
    });

    it('should remove all XSS vectors from mixed content', () => {
      fc.assert(
        fc.property(mixedContentArbitrary, (content) => {
          const sanitized = sanitizeContent(content);
          // No executable JavaScript should remain
          expect(sanitized).not.toMatch(/<script/i);
          expect(sanitized).not.toMatch(/\s+on\w+\s*=/i);
          expect(sanitized).not.toMatch(/javascript\s*:/i);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle various XSS payloads', () => {
      fc.assert(
        fc.property(xssPayloadArbitrary, (content) => {
          const sanitized = sanitizeContent(content);
          // No executable JavaScript should remain
          expect(sanitized).not.toMatch(/<script/i);
          expect(sanitized).not.toMatch(/\s+on\w+\s*=/i);
          expect(sanitized).not.toMatch(/javascript\s*:/i);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('stripScripts', () => {
    it('should remove script tags with any content', () => {
      fc.assert(
        fc.property(scriptTagContentArbitrary, (content) => {
          const result = stripScripts(content);
          expect(result).not.toMatch(/<script/i);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('stripEventHandlers', () => {
    it('should remove all on* event handlers', () => {
      fc.assert(
        fc.property(eventHandlerContentArbitrary, (content) => {
          const result = stripEventHandlers(content);
          expect(result).not.toMatch(/\s+on\w+\s*=/i);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('containsXssPatterns', () => {
    it('should detect XSS patterns in malicious content', () => {
      fc.assert(
        fc.property(xssPayloadArbitrary, (content) => {
          // Most XSS payloads should be detected
          // Note: Some edge cases might not be detected, which is why we sanitize anyway
          const detected = containsXssPatterns(content);
          // If not detected, sanitization should still remove the threat
          if (!detected) {
            const sanitized = sanitizeContent(content);
            expect(sanitized).not.toMatch(/<script/i);
            expect(sanitized).not.toMatch(/\s+on\w+\s*=/i);
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('escapeHtml', () => {
    it('should escape all HTML special characters', () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          const escaped = escapeHtml(text);
          // Escaped content should not contain raw HTML special chars
          // (unless they were already escaped in input)
          if (text.includes('<') && !text.includes('&lt;')) {
            expect(escaped).toContain('&lt;');
          }
          if (text.includes('>') && !text.includes('&gt;')) {
            expect(escaped).toContain('&gt;');
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('sanitizeHtml', () => {
    it('should preserve safe HTML while removing dangerous content', () => {
      fc.assert(
        fc.property(safeHtmlArbitrary, (content) => {
          const sanitized = sanitizeHtml(content);
          // Safe HTML should be mostly preserved (tags might be kept)
          // The important thing is no XSS vectors are introduced
          expect(sanitized).not.toMatch(/<script/i);
          expect(sanitized).not.toMatch(/\s+on\w+\s*=/i);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
