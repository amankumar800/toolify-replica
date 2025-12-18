/**
 * Link Processing Utilities
 * 
 * Provides functions for classifying, processing, and securing links
 * during page cloning operations.
 * 
 * @module link-utils
 */

/**
 * Link classification types
 */
export type LinkType = 'internal' | 'external' | 'anchor' | 'mailto' | 'tel' | 'unknown';

/**
 * Represents a processed link with all its attributes
 */
export interface ProcessedLink {
  href: string;
  text: string;
  type: LinkType;
  attributes: Record<string, string>;
}

/**
 * Security attributes for external links
 */
export interface SecurityAttributes {
  target: '_blank';
  rel: 'noopener noreferrer';
}

/**
 * Internal link mapping result
 */
export interface MappedInternalLink {
  originalHref: string;
  mappedHref: string;
  isValid: boolean;
}

/**
 * Classifies a link as internal, external, anchor, mailto, tel, or unknown
 * 
 * @param href - The href attribute of the link
 * @param baseUrl - The base URL of the source site (optional)
 * @returns The classification of the link
 * 
 * @example
 * classifyLink('https://external.com/page'); // 'external'
 * classifyLink('/about'); // 'internal'
 * classifyLink('#section'); // 'anchor'
 * classifyLink('mailto:test@example.com'); // 'mailto'
 */
export function classifyLink(href: string, baseUrl?: string): LinkType {
  if (!href || typeof href !== 'string') {
    return 'unknown';
  }

  const trimmedHref = href.trim();

  // Check for anchor links
  if (trimmedHref.startsWith('#')) {
    return 'anchor';
  }

  // Check for mailto links
  if (trimmedHref.toLowerCase().startsWith('mailto:')) {
    return 'mailto';
  }

  // Check for tel links
  if (trimmedHref.toLowerCase().startsWith('tel:')) {
    return 'tel';
  }

  // Check for protocol-relative URLs (//example.com)
  if (trimmedHref.startsWith('//')) {
    // If we have a base URL, check if it's the same domain
    if (baseUrl) {
      try {
        const baseHost = new URL(baseUrl).hostname;
        const linkHost = trimmedHref.slice(2).split('/')[0].split('?')[0].split('#')[0];
        if (linkHost === baseHost) {
          return 'internal';
        }
      } catch {
        // Invalid URL, treat as external
      }
    }
    return 'external';
  }

  // Check for absolute URLs
  if (trimmedHref.startsWith('http://') || trimmedHref.startsWith('https://')) {
    if (baseUrl) {
      try {
        const baseHost = new URL(baseUrl).hostname;
        const linkHost = new URL(trimmedHref).hostname;
        if (linkHost === baseHost) {
          return 'internal';
        }
      } catch {
        // Invalid URL, treat as external
      }
    }
    return 'external';
  }

  // Check for relative URLs (starts with / or is a path)
  if (trimmedHref.startsWith('/') || /^[a-zA-Z0-9]/.test(trimmedHref)) {
    // Exclude javascript: and data: URLs
    if (trimmedHref.toLowerCase().startsWith('javascript:') || 
        trimmedHref.toLowerCase().startsWith('data:')) {
      return 'unknown';
    }
    return 'internal';
  }

  return 'unknown';
}

/**
 * Preserves an external link exactly as-is, including all query parameters
 * 
 * @param href - The original href of the external link
 * @returns The preserved href with all query parameters intact
 * 
 * @example
 * preserveExternalLink('https://example.com/page?utm_source=test&ref=123');
 * // Returns: 'https://example.com/page?utm_source=test&ref=123'
 */
export function preserveExternalLink(href: string): string {
  if (!href || typeof href !== 'string') {
    return '';
  }

  // Return the href exactly as-is to preserve all query parameters
  return href.trim();
}

/**
 * Adds security attributes to an external link
 * Returns the attributes that should be added to prevent tabnabbing
 * 
 * @returns Security attributes object with target="_blank" and rel="noopener noreferrer"
 * 
 * @example
 * const attrs = addSecurityAttributes();
 * // Returns: { target: '_blank', rel: 'noopener noreferrer' }
 */
export function addSecurityAttributes(): SecurityAttributes {
  return {
    target: '_blank',
    rel: 'noopener noreferrer',
  };
}


/**
 * Maps an internal link from the source site to the corresponding project route
 * 
 * @param href - The original internal link href
 * @param routeMapping - Optional mapping of source paths to project routes
 * @returns The mapped internal link result
 * 
 * @example
 * mapInternalLink('/tools/ai-chat', { '/tools': '/tool' });
 * // Returns: { originalHref: '/tools/ai-chat', mappedHref: '/tool/ai-chat', isValid: true }
 */
export function mapInternalLink(
  href: string,
  routeMapping?: Record<string, string>
): MappedInternalLink {
  if (!href || typeof href !== 'string') {
    return {
      originalHref: href || '',
      mappedHref: '',
      isValid: false,
    };
  }

  const trimmedHref = href.trim();

  // If no mapping provided, return the href as-is
  if (!routeMapping || Object.keys(routeMapping).length === 0) {
    return {
      originalHref: trimmedHref,
      mappedHref: trimmedHref,
      isValid: true,
    };
  }

  // Try to find a matching route mapping
  let mappedHref = trimmedHref;
  let foundMapping = false;

  for (const [sourcePath, targetPath] of Object.entries(routeMapping)) {
    if (trimmedHref.startsWith(sourcePath)) {
      mappedHref = trimmedHref.replace(sourcePath, targetPath);
      foundMapping = true;
      break;
    }
  }

  return {
    originalHref: trimmedHref,
    mappedHref,
    isValid: true,
  };
}

/**
 * Processes a link and returns a complete ProcessedLink object
 * 
 * @param href - The href attribute of the link
 * @param text - The anchor text of the link
 * @param baseUrl - The base URL of the source site (optional)
 * @param routeMapping - Optional mapping for internal links
 * @returns A fully processed link with type and attributes
 * 
 * @example
 * processLink('https://external.com', 'Click here');
 * // Returns: { href: 'https://external.com', text: 'Click here', type: 'external', attributes: { target: '_blank', rel: 'noopener noreferrer' } }
 */
export function processLink(
  href: string,
  text: string,
  baseUrl?: string,
  routeMapping?: Record<string, string>
): ProcessedLink {
  const type = classifyLink(href, baseUrl);
  let processedHref = href;
  const attributes: Record<string, string> = {};

  switch (type) {
    case 'external':
      processedHref = preserveExternalLink(href);
      const securityAttrs = addSecurityAttributes();
      attributes.target = securityAttrs.target;
      attributes.rel = securityAttrs.rel;
      break;

    case 'internal':
      const mapped = mapInternalLink(href, routeMapping);
      processedHref = mapped.mappedHref;
      break;

    case 'anchor':
      // Anchor links stay as-is
      processedHref = href;
      break;

    case 'mailto':
    case 'tel':
      // mailto and tel links stay as-is
      processedHref = href;
      break;

    default:
      // Unknown links stay as-is but might need review
      processedHref = href;
      break;
  }

  return {
    href: processedHref,
    text: text || '',
    type,
    attributes,
  };
}

/**
 * Renders an external link as an HTML string with security attributes
 * 
 * @param href - The href of the external link
 * @param text - The anchor text
 * @param additionalAttributes - Any additional attributes to include
 * @returns HTML string for the link
 * 
 * @example
 * renderExternalLink('https://example.com', 'Visit');
 * // Returns: '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Visit</a>'
 */
export function renderExternalLink(
  href: string,
  text: string,
  additionalAttributes?: Record<string, string>
): string {
  const securityAttrs = addSecurityAttributes();
  const allAttrs = { ...additionalAttributes, ...securityAttrs };
  
  const attrString = Object.entries(allAttrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

  return `<a href="${preserveExternalLink(href)}" ${attrString}>${text}</a>`;
}

/**
 * Validates that a link has proper security attributes for external links
 * 
 * @param linkHtml - The HTML string of the link
 * @returns True if the link has proper security attributes
 */
export function hasSecurityAttributes(linkHtml: string): boolean {
  if (!linkHtml || typeof linkHtml !== 'string') {
    return false;
  }

  const hasTarget = /target\s*=\s*["']_blank["']/i.test(linkHtml);
  const hasRel = /rel\s*=\s*["'][^"']*noopener[^"']*noreferrer[^"']*["']/i.test(linkHtml) ||
                 /rel\s*=\s*["'][^"']*noreferrer[^"']*noopener[^"']*["']/i.test(linkHtml);

  return hasTarget && hasRel;
}

/**
 * Extracts the href from a link HTML string
 * 
 * @param linkHtml - The HTML string of the link
 * @returns The href value or empty string if not found
 */
export function extractHref(linkHtml: string): string {
  if (!linkHtml || typeof linkHtml !== 'string') {
    return '';
  }

  const match = linkHtml.match(/href\s*=\s*["']([^"']*)["']/i);
  return match ? match[1] : '';
}
