/**
 * Property-Based Tests for Page Cloning Data Extraction Service
 * 
 * Tests that:
 * - Property 1: Data Extraction Completeness
 * - Property 11: Item Count Verification
 * - Property 12: Data Ordering Preservation
 * 
 * @see .kiro/specs/page-cloning-agent/design.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  extractPageData,
  extractPageDataSilent,
  extractMetadata,
  extractTextContent,
  extractImages,
  extractLinks,
  extractLists,
  extractForms,
  extractStructuredData,
  resolveUrl,
  classifyLinkType,
  resetIdCounter,
  calculateItemCounts,
} from './page-cloning-extract.service';

// =============================================================================
// Test Helpers - HTML Generators
// =============================================================================

/**
 * Generates a valid HTML tag name for text content
 */
const textTagArbitrary = fc.constantFrom('h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div');

/**
 * Generates safe text content (no HTML special chars that would break parsing)
 */
const safeTextArbitrary = fc
  .string({ minLength: 1, maxLength: 100 })
  .map((s) => s.replace(/[<>&"']/g, '').trim())
  .filter((s) => s.length > 0);

/**
 * Generates a valid URL path segment
 */
const pathSegmentArbitrary = fc
  .stringMatching(/^[a-z0-9-]+$/)
  .filter((s) => s.length >= 1 && s.length <= 20);

/**
 * Generates a valid external URL that is safe for HTML attributes
 * (no quotes or special characters that would break HTML parsing)
 */
const safeExternalUrlArbitrary = fc
  .tuple(
    fc.constantFrom('https', 'http'),
    fc.stringMatching(/^[a-z][a-z0-9-]*[a-z0-9]$/),
    fc.constantFrom('.com', '.org', '.net', '.io'),
    fc.option(pathSegmentArbitrary, { nil: undefined })
  )
  .map(([protocol, domain, tld, path]) => {
    const base = `${protocol}://${domain}${tld}`;
    return path ? `${base}/${path}` : base;
  });

/**
 * Generates a valid image filename
 */
const imageFilenameArbitrary = fc
  .tuple(pathSegmentArbitrary, fc.constantFrom('.jpg', '.png', '.gif', '.webp'))
  .map(([name, ext]) => `${name}${ext}`);

/**
 * Generates a list of text items for lists
 */
const listItemsArbitrary = fc.array(safeTextArbitrary, { minLength: 1, maxLength: 10 });

/**
 * Generates HTML for a text element
 */
function generateTextHtml(tag: string, content: string): string {
  return `<${tag}>${content}</${tag}>`;
}

/**
 * Generates HTML for an image element
 */
function generateImageHtml(src: string, alt: string, width?: number, height?: number): string {
  let html = `<img src="${src}" alt="${alt}"`;
  if (width !== undefined) html += ` width="${width}"`;
  if (height !== undefined) html += ` height="${height}"`;
  html += '>';
  return html;
}

/**
 * Generates HTML for a link element
 */
function generateLinkHtml(href: string, text: string, isExternal: boolean = false): string {
  const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<a href="${href}"${attrs}>${text}</a>`;
}

/**
 * Generates HTML for a list element
 */
function generateListHtml(items: string[], ordered: boolean): string {
  const tag = ordered ? 'ol' : 'ul';
  const itemsHtml = items.map((item) => `<li>${item}</li>`).join('');
  return `<${tag}>${itemsHtml}</${tag}>`;
}

// =============================================================================
// Arbitraries for Complete HTML Documents
// =============================================================================

/**
 * Generates a complete HTML document with known content for testing
 */
interface TestHtmlContent {
  html: string;
  expectedTextCount: number;
  expectedImageCount: number;
  expectedLinkCount: number;
  expectedListCount: number;
  expectedListItemCount: number;
  textContents: string[];
  imageSrcs: string[];
  linkHrefs: string[];
  listItems: string[][];
}

const testHtmlArbitrary: fc.Arbitrary<TestHtmlContent> = fc
  .record({
    title: safeTextArbitrary,
    description: safeTextArbitrary,
    textElements: fc.array(
      fc.tuple(textTagArbitrary, safeTextArbitrary),
      { minLength: 0, maxLength: 5 }
    ),
    images: fc.array(
      fc.tuple(imageFilenameArbitrary, safeTextArbitrary),
      { minLength: 0, maxLength: 5 }
    ),
    internalLinks: fc.array(
      fc.tuple(pathSegmentArbitrary, safeTextArbitrary),
      { minLength: 0, maxLength: 3 }
    ),
    externalLinks: fc.array(
      fc.tuple(safeExternalUrlArbitrary, safeTextArbitrary),
      { minLength: 0, maxLength: 3 }
    ),
    orderedLists: fc.array(listItemsArbitrary, { minLength: 0, maxLength: 2 }),
    unorderedLists: fc.array(listItemsArbitrary, { minLength: 0, maxLength: 2 }),
  })
  .map((data) => {
    const baseUrl = 'https://example.com';
    
    // Build HTML parts
    const headHtml = `
      <head>
        <title>${data.title}</title>
        <meta name="description" content="${data.description}">
      </head>
    `;
    
    const textHtml = data.textElements
      .map(([tag, content]) => generateTextHtml(tag, content))
      .join('\n');
    
    const imageHtml = data.images
      .map(([filename, alt]) => generateImageHtml(`/images/${filename}`, alt))
      .join('\n');
    
    const internalLinkHtml = data.internalLinks
      .map(([path, text]) => generateLinkHtml(`/${path}`, text, false))
      .join('\n');
    
    const externalLinkHtml = data.externalLinks
      .map(([url, text]) => generateLinkHtml(url, text, true))
      .join('\n');
    
    const orderedListHtml = data.orderedLists
      .map((items) => generateListHtml(items, true))
      .join('\n');
    
    const unorderedListHtml = data.unorderedLists
      .map((items) => generateListHtml(items, false))
      .join('\n');
    
    const bodyHtml = `
      <body>
        ${textHtml}
        ${imageHtml}
        ${internalLinkHtml}
        ${externalLinkHtml}
        ${orderedListHtml}
        ${unorderedListHtml}
      </body>
    `;
    
    const html = `<!DOCTYPE html><html>${headHtml}${bodyHtml}</html>`;
    
    // Calculate expected counts
    const expectedTextCount = data.textElements.length;
    const expectedImageCount = data.images.length;
    const expectedLinkCount = data.internalLinks.length + data.externalLinks.length;
    const expectedListCount = data.orderedLists.length + data.unorderedLists.length;
    const expectedListItemCount = 
      data.orderedLists.reduce((sum, list) => sum + list.length, 0) +
      data.unorderedLists.reduce((sum, list) => sum + list.length, 0);
    
    return {
      html,
      expectedTextCount,
      expectedImageCount,
      expectedLinkCount,
      expectedListCount,
      expectedListItemCount,
      textContents: data.textElements.map(([, content]) => content),
      imageSrcs: data.images.map(([filename]) => `${baseUrl}/images/${filename}`),
      linkHrefs: [
        ...data.internalLinks.map(([path]) => `${baseUrl}/${path}`),
        ...data.externalLinks.map(([url]) => url),
      ],
      listItems: [...data.orderedLists, ...data.unorderedLists],
    };
  });


// =============================================================================
// Property-Based Tests
// =============================================================================

describe('Page Cloning Extract Service - Property 1: Data Extraction Completeness', () => {
  /**
   * **Feature: page-cloning-agent, Property 1: Data Extraction Completeness**
   * **Validates: Requirements 2.5, 5.7, 12.1**
   * 
   * For any source page with N visible list items, the extracted data
   * SHALL contain exactly N items in the same order.
   */

  beforeEach(() => {
    resetIdCounter();
  });

  it('extracts all text elements from HTML', () => {
    fc.assert(
      fc.property(testHtmlArbitrary, (testData) => {
        const result = extractPageDataSilent(testData.html, 'https://example.com');
        
        // All text contents should be present in extracted data
        for (const content of testData.textContents) {
          const found = result.textContent.some((block) => block.content === content);
          expect(found).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('extracts all images from HTML', () => {
    fc.assert(
      fc.property(testHtmlArbitrary, (testData) => {
        const result = extractPageDataSilent(testData.html, 'https://example.com');
        
        // All image sources should be present
        expect(result.images.length).toBe(testData.expectedImageCount);
        
        for (const src of testData.imageSrcs) {
          const found = result.images.some((img) => img.src === src);
          expect(found).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('extracts all links from HTML', () => {
    fc.assert(
      fc.property(testHtmlArbitrary, (testData) => {
        const result = extractPageDataSilent(testData.html, 'https://example.com');
        
        // All link hrefs should be present
        expect(result.links.length).toBe(testData.expectedLinkCount);
        
        for (const href of testData.linkHrefs) {
          const found = result.links.some((link) => link.href === href);
          expect(found).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('extracts all list items from HTML', () => {
    fc.assert(
      fc.property(testHtmlArbitrary, (testData) => {
        const result = extractPageDataSilent(testData.html, 'https://example.com');
        
        // Total list item count should match
        const totalExtractedItems = result.lists.reduce(
          (sum, list) => sum + list.items.length,
          0
        );
        expect(totalExtractedItems).toBe(testData.expectedListItemCount);
        
        // Each list's items should be present
        for (const expectedItems of testData.listItems) {
          const found = result.lists.some((list) => {
            if (list.items.length !== expectedItems.length) return false;
            return expectedItems.every((item, i) => list.items[i] === item);
          });
          expect(found).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});


describe('Page Cloning Extract Service - Property 11: Item Count Verification', () => {
  /**
   * **Feature: page-cloning-agent, Property 11: Item Count Verification**
   * **Validates: Requirements 2.9, 12.4**
   * 
   * For any data extraction, the logged item count SHALL equal the actual
   * number of items in the stored JSON file.
   */

  beforeEach(() => {
    resetIdCounter();
  });

  it('itemCounts.text equals textContent.length', () => {
    fc.assert(
      fc.property(testHtmlArbitrary, (testData) => {
        const result = extractPageDataSilent(testData.html, 'https://example.com');
        expect(result.itemCounts.text).toBe(result.textContent.length);
      }),
      { numRuns: 100 }
    );
  });

  it('itemCounts.images equals images.length', () => {
    fc.assert(
      fc.property(testHtmlArbitrary, (testData) => {
        const result = extractPageDataSilent(testData.html, 'https://example.com');
        expect(result.itemCounts.images).toBe(result.images.length);
      }),
      { numRuns: 100 }
    );
  });

  it('itemCounts.links equals links.length', () => {
    fc.assert(
      fc.property(testHtmlArbitrary, (testData) => {
        const result = extractPageDataSilent(testData.html, 'https://example.com');
        expect(result.itemCounts.links).toBe(result.links.length);
      }),
      { numRuns: 100 }
    );
  });

  it('itemCounts.listItems equals sum of all list items', () => {
    fc.assert(
      fc.property(testHtmlArbitrary, (testData) => {
        const result = extractPageDataSilent(testData.html, 'https://example.com');
        const actualListItems = result.lists.reduce(
          (sum, list) => sum + list.items.length,
          0
        );
        expect(result.itemCounts.listItems).toBe(actualListItems);
      }),
      { numRuns: 100 }
    );
  });

  it('calculateItemCounts produces correct counts', () => {
    fc.assert(
      fc.property(testHtmlArbitrary, (testData) => {
        const result = extractPageDataSilent(testData.html, 'https://example.com');
        const calculated = calculateItemCounts(
          result.textContent,
          result.images,
          result.links,
          result.lists
        );
        
        expect(calculated.text).toBe(result.textContent.length);
        expect(calculated.images).toBe(result.images.length);
        expect(calculated.links).toBe(result.links.length);
        expect(calculated.listItems).toBe(
          result.lists.reduce((sum, list) => sum + list.items.length, 0)
        );
      }),
      { numRuns: 100 }
    );
  });
});


describe('Page Cloning Extract Service - Property 12: Data Ordering Preservation', () => {
  /**
   * **Feature: page-cloning-agent, Property 12: Data Ordering Preservation**
   * **Validates: Requirements 5.7**
   * 
   * For any list of items extracted from the source, the stored JSON
   * SHALL maintain the exact same ordering as the source page.
   */

  beforeEach(() => {
    resetIdCounter();
  });

  it('list items preserve order within each list', () => {
    fc.assert(
      fc.property(listItemsArbitrary, (items) => {
        const html = generateListHtml(items, false);
        const result = extractLists(html);
        
        expect(result.length).toBe(1);
        expect(result[0].items).toEqual(items);
      }),
      { numRuns: 100 }
    );
  });

  it('ordered lists preserve item sequence', () => {
    fc.assert(
      fc.property(listItemsArbitrary, (items) => {
        const html = generateListHtml(items, true);
        const result = extractLists(html);
        
        expect(result.length).toBe(1);
        expect(result[0].ordered).toBe(true);
        expect(result[0].items).toEqual(items);
      }),
      { numRuns: 100 }
    );
  });

  it('text blocks have sequential order values', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(textTagArbitrary, safeTextArbitrary), { minLength: 2, maxLength: 10 }),
        (elements) => {
          resetIdCounter();
          const html = elements.map(([tag, content]) => generateTextHtml(tag, content)).join('');
          const result = extractTextContent(html);
          
          // Order values should be sequential starting from 0
          const orders = result.map((block) => block.order);
          for (let i = 0; i < orders.length; i++) {
            expect(orders[i]).toBe(i);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('lists have sequential order values', () => {
    fc.assert(
      fc.property(
        fc.array(listItemsArbitrary, { minLength: 2, maxLength: 5 }),
        (listsData) => {
          resetIdCounter();
          const html = listsData.map((items) => generateListHtml(items, false)).join('');
          const result = extractLists(html);
          
          // Order values should be sequential starting from 0
          const orders = result.map((list) => list.order);
          for (let i = 0; i < orders.length; i++) {
            expect(orders[i]).toBe(i);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// =============================================================================
// Unit Tests for Helper Functions
// =============================================================================

describe('Page Cloning Extract Service - Unit Tests', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('resolveUrl', () => {
    it('returns absolute URLs unchanged', () => {
      expect(resolveUrl('https://example.com/page', 'https://base.com')).toBe(
        'https://example.com/page'
      );
      expect(resolveUrl('http://example.com/page', 'https://base.com')).toBe(
        'http://example.com/page'
      );
    });

    it('resolves protocol-relative URLs', () => {
      expect(resolveUrl('//cdn.example.com/image.jpg', 'https://base.com')).toBe(
        'https://cdn.example.com/image.jpg'
      );
    });

    it('resolves relative URLs', () => {
      expect(resolveUrl('/page', 'https://example.com')).toBe('https://example.com/page');
      expect(resolveUrl('page', 'https://example.com/dir/')).toBe(
        'https://example.com/dir/page'
      );
    });

    it('returns anchor links unchanged', () => {
      expect(resolveUrl('#section', 'https://example.com')).toBe('#section');
    });

    it('returns data URLs unchanged', () => {
      expect(resolveUrl('data:image/png;base64,abc', 'https://example.com')).toBe(
        'data:image/png;base64,abc'
      );
    });

    it('returns empty string for empty input', () => {
      expect(resolveUrl('', 'https://example.com')).toBe('');
    });
  });

  describe('classifyLinkType', () => {
    it('classifies anchor links', () => {
      expect(classifyLinkType('#section', 'https://example.com')).toBe('anchor');
      expect(classifyLinkType('#top', 'https://example.com/page')).toBe('anchor');
    });

    it('classifies internal links', () => {
      expect(classifyLinkType('/page', 'https://example.com')).toBe('internal');
      expect(classifyLinkType('https://example.com/other', 'https://example.com')).toBe(
        'internal'
      );
    });

    it('classifies external links', () => {
      expect(classifyLinkType('https://other.com/page', 'https://example.com')).toBe(
        'external'
      );
    });
  });

  describe('extractMetadata', () => {
    it('extracts title', () => {
      const html = '<html><head><title>Test Title</title></head></html>';
      const result = extractMetadata(html, 'https://example.com');
      expect(result.title).toBe('Test Title');
    });

    it('extracts meta description', () => {
      const html =
        '<html><head><meta name="description" content="Test description"></head></html>';
      const result = extractMetadata(html, 'https://example.com');
      expect(result.description).toBe('Test description');
    });

    it('extracts Open Graph tags', () => {
      const html = `
        <html><head>
          <meta property="og:title" content="OG Title">
          <meta property="og:description" content="OG Description">
          <meta property="og:image" content="/og-image.jpg">
        </head></html>
      `;
      const result = extractMetadata(html, 'https://example.com');
      expect(result.ogTitle).toBe('OG Title');
      expect(result.ogDescription).toBe('OG Description');
      expect(result.ogImage).toBe('https://example.com/og-image.jpg');
    });

    it('extracts canonical URL', () => {
      const html =
        '<html><head><link rel="canonical" href="https://example.com/canonical"></head></html>';
      const result = extractMetadata(html, 'https://example.com');
      expect(result.canonical).toBe('https://example.com/canonical');
    });
  });

  describe('extractImages', () => {
    it('extracts image src and alt', () => {
      const html = '<img src="/image.jpg" alt="Test image">';
      const result = extractImages(html, 'https://example.com');
      expect(result.length).toBe(1);
      expect(result[0].src).toBe('https://example.com/image.jpg');
      expect(result[0].alt).toBe('Test image');
    });

    it('extracts image dimensions', () => {
      const html = '<img src="/image.jpg" alt="Test" width="100" height="200">';
      const result = extractImages(html, 'https://example.com');
      expect(result[0].width).toBe(100);
      expect(result[0].height).toBe(200);
    });

    it('skips images without src', () => {
      const html = '<img alt="No source">';
      const result = extractImages(html, 'https://example.com');
      expect(result.length).toBe(0);
    });
  });

  describe('extractLinks', () => {
    it('extracts link href and text', () => {
      const html = '<a href="/page">Link text</a>';
      const result = extractLinks(html, 'https://example.com');
      expect(result.length).toBe(1);
      expect(result[0].href).toBe('https://example.com/page');
      expect(result[0].text).toBe('Link text');
    });

    it('extracts link attributes', () => {
      const html = '<a href="https://other.com" target="_blank" rel="noopener">External</a>';
      const result = extractLinks(html, 'https://example.com');
      expect(result[0].attributes.target).toBe('_blank');
      expect(result[0].attributes.rel).toBe('noopener');
    });

    it('classifies link types correctly', () => {
      const html = `
        <a href="/internal">Internal</a>
        <a href="https://external.com">External</a>
        <a href="#anchor">Anchor</a>
      `;
      const result = extractLinks(html, 'https://example.com');
      expect(result.find((l) => l.text === 'Internal')?.type).toBe('internal');
      expect(result.find((l) => l.text === 'External')?.type).toBe('external');
      expect(result.find((l) => l.text === 'Anchor')?.type).toBe('anchor');
    });
  });

  describe('extractForms', () => {
    it('extracts form action and method', () => {
      const html = '<form action="/submit" method="POST"></form>';
      const result = extractForms(html);
      expect(result.length).toBe(1);
      expect(result[0].action).toBe('/submit');
      expect(result[0].method).toBe('POST');
    });

    it('extracts form fields', () => {
      const html = `
        <form action="/submit" method="POST">
          <input type="text" name="username" placeholder="Enter username" required>
          <input type="email" name="email">
          <textarea name="message"></textarea>
          <select name="country"></select>
        </form>
      `;
      const result = extractForms(html);
      expect(result[0].fields.length).toBe(4);
      
      const usernameField = result[0].fields.find((f) => f.name === 'username');
      expect(usernameField?.type).toBe('text');
      expect(usernameField?.placeholder).toBe('Enter username');
      expect(usernameField?.required).toBe(true);
    });
  });

  describe('extractStructuredData', () => {
    it('extracts JSON-LD data', () => {
      const html = `
        <script type="application/ld+json">
          {"@type": "Organization", "name": "Test Org"}
        </script>
      `;
      const result = extractStructuredData(html);
      expect(result['Organization']).toEqual({
        '@type': 'Organization',
        name: 'Test Org',
      });
    });

    it('handles multiple JSON-LD blocks', () => {
      const html = `
        <script type="application/ld+json">{"@type": "Organization", "name": "Org"}</script>
        <script type="application/ld+json">{"@type": "WebPage", "name": "Page"}</script>
      `;
      const result = extractStructuredData(html);
      expect(result['Organization']).toBeDefined();
      expect(result['WebPage']).toBeDefined();
    });

    it('handles invalid JSON gracefully', () => {
      const html = '<script type="application/ld+json">invalid json</script>';
      const result = extractStructuredData(html);
      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe('extractPageData', () => {
    it('returns complete ExtractedData structure', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Page</title>
            <meta name="description" content="Test description">
          </head>
          <body>
            <h1>Heading</h1>
            <p>Paragraph</p>
            <img src="/image.jpg" alt="Image">
            <a href="/link">Link</a>
            <ul><li>Item 1</li><li>Item 2</li></ul>
          </body>
        </html>
      `;
      const result = extractPageDataSilent(html, 'https://example.com');
      
      expect(result.metadata.title).toBe('Test Page');
      expect(result.metadata.description).toBe('Test description');
      expect(result.textContent.length).toBeGreaterThan(0);
      expect(result.images.length).toBe(1);
      expect(result.links.length).toBe(1);
      expect(result.lists.length).toBe(1);
      expect(result.extractedAt).toBeDefined();
      expect(result.itemCounts).toBeDefined();
    });
  });
});
