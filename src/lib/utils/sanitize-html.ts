import DOMPurify, { Config } from 'isomorphic-dompurify';

/**
 * Configuration for HTML sanitization
 * Allows only safe HTML tags and attributes commonly used in CMS content
 */
const SANITIZE_CONFIG: Config = {
  // Allowed HTML tags for rich text content
  ALLOWED_TAGS: [
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Text formatting
    'p', 'br', 'hr', 'span', 'div',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins',
    'sub', 'sup', 'small', 'mark',
    // Lists
    'ul', 'ol', 'li',
    // Links and media
    'a', 'img',
    // Tables
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
    // Quotes and code
    'blockquote', 'pre', 'code', 'kbd', 'samp',
    // Semantic elements
    'article', 'section', 'aside', 'header', 'footer', 'nav', 'main',
    'figure', 'figcaption', 'details', 'summary',
    // Definition lists
    'dl', 'dt', 'dd',
    // Address
    'address',
  ],
  // Allowed attributes - no event handlers allowed
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id', 'name',
    'width', 'height', 'loading', 'decoding',
    'target', 'rel',
    'colspan', 'rowspan', 'scope', 'headers',
    'start', 'type', 'reversed',
    'open', 'datetime', 'cite',
    'lang', 'dir',
  ],
  // Allow data attributes for styling frameworks
  ALLOW_DATA_ATTR: true,
  // Forbid dangerous URI schemes
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  // Remove any tags not in the allowed list (don't just strip attributes)
  KEEP_CONTENT: true,
  // Return string type
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * 
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering with dangerouslySetInnerHTML
 * 
 * @example
 * ```tsx
 * const safeHtml = sanitizeHtml(untrustedContent);
 * return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
 * ```
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) {
    return '';
  }
  
  return DOMPurify.sanitize(html, SANITIZE_CONFIG) as string;
}

/**
 * Sanitizes HTML with a stricter configuration (no links, images, or tables)
 * Use for user-generated content in comments, reviews, etc.
 * 
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string with only basic formatting
 */
export function sanitizeHtmlStrict(html: string | null | undefined): string {
  if (!html) {
    return '';
  }
  
  const strictConfig: Config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    ],
    ALLOWED_ATTR: ['class'],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  };
  
  return DOMPurify.sanitize(html, strictConfig) as string;
}

/**
 * Strips all HTML tags and returns plain text
 * Use for displaying content in contexts where HTML is not allowed
 * 
 * @param html - The HTML string to strip
 * @returns Plain text with all HTML removed
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) {
    return '';
  }
  
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }) as string;
}
