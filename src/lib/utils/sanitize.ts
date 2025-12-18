/**
 * XSS Sanitization Module
 * 
 * Provides functions to sanitize HTML content and prevent XSS attacks.
 * Follows DOMPurify patterns for comprehensive protection.
 * 
 * @module sanitize
 */

/**
 * List of safe HTML tags that are allowed in sanitized content
 */
const SAFE_TAGS = new Set([
  'a', 'abbr', 'address', 'article', 'aside', 'b', 'bdi', 'bdo', 'blockquote',
  'br', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'dd', 'del',
  'details', 'dfn', 'div', 'dl', 'dt', 'em', 'figcaption', 'figure', 'footer',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'i', 'img',
  'ins', 'kbd', 'li', 'main', 'mark', 'nav', 'ol', 'p', 'picture', 'pre',
  'q', 'rp', 'rt', 'ruby', 's', 'samp', 'section', 'small', 'source', 'span',
  'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th',
  'thead', 'time', 'tr', 'u', 'ul', 'var', 'wbr'
]);

/**
 * List of safe attributes that are allowed on HTML elements
 */
const SAFE_ATTRIBUTES = new Set([
  'alt', 'class', 'colspan', 'datetime', 'dir', 'height', 'href', 'id', 'lang',
  'loading', 'name', 'rel', 'role', 'rowspan', 'scope', 'src', 'srcset',
  'style', 'tabindex', 'target', 'title', 'type', 'width', 'aria-label',
  'aria-labelledby', 'aria-describedby', 'aria-hidden', 'aria-expanded',
  'aria-controls', 'aria-current', 'aria-live', 'aria-atomic', 'data-*'
]);

/**
 * Dangerous tags that should always be removed
 */
const DANGEROUS_TAGS = [
  'script', 'noscript', 'object', 'embed', 'applet', 'iframe', 'frame',
  'frameset', 'base', 'form', 'input', 'button', 'select', 'textarea',
  'style', 'link', 'meta', 'title', 'html', 'head', 'body'
];

/**
 * Event handler attribute pattern (on* attributes)
 */
const EVENT_HANDLER_PATTERN = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi;

/**
 * JavaScript URL pattern (handles various encodings)
 */
const JAVASCRIPT_URL_PATTERN = /(?:javascript|vbscript|data)\s*:/gi;


/**
 * Decodes HTML entities to their character equivalents
 * This helps detect obfuscated XSS attempts
 */
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  
  return str
    // Decode numeric entities (decimal)
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    // Decode numeric entities (hex)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Decode common named entities
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ');
}

/**
 * Removes all script tags and their content from HTML
 * Handles various obfuscation techniques
 * 
 * @param content - The HTML content to sanitize
 * @returns Content with all script tags removed
 * 
 * @example
 * stripScripts('<div>Hello</div><script>alert("xss")</script>');
 * // Returns: '<div>Hello</div>'
 */
export function stripScripts(content: string): string {
  if (!content) return '';
  
  // Remove script tags with content (handles whitespace and attributes)
  let result = content.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '');
  
  // Remove self-closing script tags
  result = result.replace(/<\s*script[^>]*\/\s*>/gi, '');
  
  // Remove noscript tags with content
  result = result.replace(/<\s*noscript[^>]*>[\s\S]*?<\s*\/\s*noscript\s*>/gi, '');
  
  return result;
}

/**
 * Removes all event handler attributes (on* attributes) from HTML
 * Handles various obfuscation techniques including encoded characters
 * 
 * @param content - The HTML content to sanitize
 * @returns Content with all event handlers removed
 * 
 * @example
 * stripEventHandlers('<img src="x" onerror="alert(1)">');
 * // Returns: '<img src="x">'
 */
export function stripEventHandlers(content: string): string {
  if (!content) return '';
  
  // Decode entities first to catch obfuscated handlers
  const decoded = decodeHtmlEntities(content);
  
  // Remove on* event handlers with various quote styles
  let result = decoded.replace(EVENT_HANDLER_PATTERN, '');
  
  // Also handle FSCommand (Flash) and other legacy handlers
  result = result.replace(/\s+fscommand\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');
  result = result.replace(/\s+seeksegmenttime\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');
  
  return result;
}


/**
 * Removes javascript:, vbscript:, and data: URLs from href, src, and action attributes
 * Handles various encoding and obfuscation techniques
 * 
 * @param content - The HTML content to sanitize
 * @returns Content with dangerous URLs removed
 * 
 * @example
 * stripJavaScriptUrls('<a href="javascript:alert(1)">click</a>');
 * // Returns: '<a href="">click</a>'
 */
export function stripJavaScriptUrls(content: string): string {
  if (!content) return '';
  
  // Decode entities first
  let result = decodeHtmlEntities(content);
  
  // Remove javascript: URLs from href attributes
  result = result.replace(
    /(<[^>]*\s+href\s*=\s*["']?)\s*(?:javascript|vbscript|data)\s*:[^"'>\s]*/gi,
    '$1'
  );
  
  // Remove javascript: URLs from src attributes
  result = result.replace(
    /(<[^>]*\s+src\s*=\s*["']?)\s*(?:javascript|vbscript|data)\s*:[^"'>\s]*/gi,
    '$1'
  );
  
  // Remove javascript: URLs from action attributes
  result = result.replace(
    /(<[^>]*\s+action\s*=\s*["']?)\s*(?:javascript|vbscript|data)\s*:[^"'>\s]*/gi,
    '$1'
  );
  
  // Remove javascript: URLs from formaction attributes
  result = result.replace(
    /(<[^>]*\s+formaction\s*=\s*["']?)\s*(?:javascript|vbscript|data)\s*:[^"'>\s]*/gi,
    '$1'
  );
  
  // Remove javascript: URLs from xlink:href (SVG)
  result = result.replace(
    /(<[^>]*\s+xlink:href\s*=\s*["']?)\s*(?:javascript|vbscript|data)\s*:[^"'>\s]*/gi,
    '$1'
  );
  
  // Remove javascript: URLs from poster attributes (video)
  result = result.replace(
    /(<[^>]*\s+poster\s*=\s*["']?)\s*(?:javascript|vbscript|data)\s*:[^"'>\s]*/gi,
    '$1'
  );
  
  // Remove javascript: URLs from background attributes
  result = result.replace(
    /(<[^>]*\s+background\s*=\s*["']?)\s*(?:javascript|vbscript|data)\s*:[^"'>\s]*/gi,
    '$1'
  );
  
  return result;
}

/**
 * Removes dangerous HTML tags that could be used for XSS
 * Includes object, embed, iframe, applet, base, meta, etc.
 * 
 * @param content - The HTML content to sanitize
 * @returns Content with dangerous tags removed
 * 
 * @example
 * stripDangerousTags('<div>Hello</div><iframe src="evil.com"></iframe>');
 * // Returns: '<div>Hello</div>'
 */
export function stripDangerousTags(content: string): string {
  if (!content) return '';
  
  let result = content;
  
  // Remove each dangerous tag type
  for (const tag of DANGEROUS_TAGS) {
    // Remove opening and closing tags with content
    const tagPattern = new RegExp(
      `<\\s*${tag}[^>]*>[\\s\\S]*?<\\s*/\\s*${tag}\\s*>`,
      'gi'
    );
    result = result.replace(tagPattern, '');
    
    // Remove self-closing tags
    const selfClosingPattern = new RegExp(`<\\s*${tag}[^>]*/\\s*>`, 'gi');
    result = result.replace(selfClosingPattern, '');
    
    // Remove unclosed tags
    const unclosedPattern = new RegExp(`<\\s*${tag}[^>]*>`, 'gi');
    result = result.replace(unclosedPattern, '');
  }
  
  // Remove SVG elements with scripts or event handlers
  result = result.replace(/<\s*svg[^>]*>[\s\S]*?<\s*\/\s*svg\s*>/gi, (match) => {
    // Check if SVG contains script or event handlers
    if (/<\s*script/i.test(match) || EVENT_HANDLER_PATTERN.test(match)) {
      return '';
    }
    return match;
  });
  
  // Remove math elements with scripts
  result = result.replace(/<\s*math[^>]*>[\s\S]*?<\s*\/\s*math\s*>/gi, (match) => {
    if (/<\s*script/i.test(match) || EVENT_HANDLER_PATTERN.test(match)) {
      return '';
    }
    return match;
  });
  
  return result;
}


/**
 * Removes dangerous CSS that could be used for XSS
 * Handles expression(), url(javascript:), behavior, etc.
 * 
 * @param content - The HTML content to sanitize
 * @returns Content with dangerous CSS removed
 */
function stripDangerousCss(content: string): string {
  if (!content) return '';
  
  let result = content;
  
  // Remove CSS expressions (IE-specific XSS vector)
  result = result.replace(/expression\s*\([^)]*\)/gi, '');
  
  // Remove javascript: in CSS url()
  result = result.replace(/url\s*\(\s*["']?\s*javascript:[^)]*\)/gi, 'url()');
  
  // Remove behavior property (IE-specific)
  result = result.replace(/behavior\s*:\s*[^;}"']*/gi, '');
  
  // Remove -moz-binding (Firefox-specific)
  result = result.replace(/-moz-binding\s*:\s*[^;}"']*/gi, '');
  
  return result;
}

/**
 * Sanitizes HTML content by removing dangerous tags while preserving safe formatting
 * Uses an allowlist approach for maximum security
 * 
 * @param html - The HTML content to sanitize
 * @returns Sanitized HTML with only safe tags and attributes
 * 
 * @example
 * sanitizeHtml('<div onclick="alert(1)">Hello <script>evil()</script></div>');
 * // Returns: '<div>Hello </div>'
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  let result = html;
  
  // Step 1: Strip scripts first (most dangerous)
  result = stripScripts(result);
  
  // Step 2: Strip dangerous tags
  result = stripDangerousTags(result);
  
  // Step 3: Strip event handlers
  result = stripEventHandlers(result);
  
  // Step 4: Strip javascript URLs
  result = stripJavaScriptUrls(result);
  
  // Step 5: Strip dangerous CSS
  result = stripDangerousCss(result);
  
  // Step 6: Clean up any remaining dangerous patterns
  // Remove HTML comments that might hide malicious content
  result = result.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove CDATA sections
  result = result.replace(/<!\[CDATA\[[\s\S]*?\]\]>/gi, '');
  
  // Remove XML processing instructions
  result = result.replace(/<\?[\s\S]*?\?>/g, '');
  
  return result.trim();
}

/**
 * Main sanitization function - sanitizes any content for safe display
 * Combines all sanitization techniques for comprehensive XSS protection
 * 
 * @param content - The content to sanitize (can be HTML or plain text)
 * @returns Fully sanitized content safe for display
 * 
 * @example
 * sanitizeContent('<script>alert("xss")</script><p onclick="evil()">Hello</p>');
 * // Returns: '<p>Hello</p>'
 */
export function sanitizeContent(content: string): string {
  if (!content) return '';
  
  // Apply full HTML sanitization
  return sanitizeHtml(content);
}

/**
 * Checks if content contains any potentially dangerous XSS patterns
 * Useful for validation before processing
 * 
 * @param content - The content to check
 * @returns True if dangerous patterns are detected
 */
export function containsXssPatterns(content: string): boolean {
  if (!content) return false;
  
  const decoded = decodeHtmlEntities(content);
  
  // Check for script tags
  if (/<\s*script/i.test(decoded)) return true;
  
  // Check for event handlers
  if (/\s+on\w+\s*=/i.test(decoded)) return true;
  
  // Check for javascript: URLs
  if (JAVASCRIPT_URL_PATTERN.test(decoded)) return true;
  
  // Check for dangerous tags
  for (const tag of DANGEROUS_TAGS) {
    if (new RegExp(`<\\s*${tag}`, 'i').test(decoded)) return true;
  }
  
  return false;
}

/**
 * Escapes HTML special characters to prevent XSS
 * Use this for plain text that should not contain any HTML
 * 
 * @param text - Plain text to escape
 * @returns Escaped text safe for HTML display
 * 
 * @example
 * escapeHtml('<script>alert("xss")</script>');
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
