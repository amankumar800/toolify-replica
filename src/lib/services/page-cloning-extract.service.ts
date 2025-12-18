/**
 * Page Cloning Data Extraction Service
 * 
 * Extracts all content from source pages including text, images, links,
 * metadata, lists, forms, and structured data.
 * 
 * @module page-cloning-extract.service
 * @requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.9
 */

import type {
  ExtractedData,
  PageMetadata,
  TextBlock,
  ImageData,
  LinkData,
  ListData,
  FormData,
  FormField,
  ItemCounts,
  LinkType,
  TextTagType,
} from '../types/page-cloning';
import { sanitizeContent } from '../utils/sanitize';

// =============================================================================
// Helper Functions
// =============================================================================

let idCounter = 0;

/**
 * Generates a unique ID for extracted elements
 */
function generateId(prefix: string): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Resets the ID counter (useful for testing)
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

/**
 * Resolves a potentially relative URL to an absolute URL
 * 
 * @param url - The URL to resolve (may be relative or absolute)
 * @param baseUrl - The base URL to resolve against
 * @returns Absolute URL string
 */
export function resolveUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  
  // Already absolute
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    if (url.startsWith('//')) {
      try {
        const base = new URL(baseUrl);
        return `${base.protocol}${url}`;
      } catch {
        return `https:${url}`;
      }
    }
    return url;
  }
  
  // Data URLs - return as-is
  if (url.startsWith('data:')) {
    return url;
  }
  
  // Anchor links
  if (url.startsWith('#')) {
    return url;
  }
  
  // Resolve relative URL
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}


/**
 * Classifies a link as internal, external, or anchor
 * 
 * @param href - The link href
 * @param baseUrl - The base URL of the page
 * @returns Link type classification
 */
export function classifyLinkType(href: string, baseUrl: string): LinkType {
  if (!href) return 'internal';
  
  // Anchor links
  if (href.startsWith('#')) {
    return 'anchor';
  }
  
  // Check if same domain
  try {
    const base = new URL(baseUrl);
    const link = new URL(href, baseUrl);
    
    if (link.hostname === base.hostname) {
      return 'internal';
    }
    return 'external';
  } catch {
    // If URL parsing fails, assume internal
    return 'internal';
  }
}

// =============================================================================
// Metadata Extraction
// =============================================================================

/**
 * Extracts page metadata including title, description, and Open Graph tags
 * 
 * @param html - The HTML content to extract from
 * @param baseUrl - The base URL for resolving relative URLs
 * @returns Extracted page metadata
 * @requirements 2.4
 */
export function extractMetadata(html: string, baseUrl: string): PageMetadata {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  
  // Extract meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
    || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
  const description = descMatch ? descMatch[1].trim() : '';
  
  // Extract Open Graph title
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i)
    || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["'][^>]*>/i);
  const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : '';
  
  // Extract Open Graph description
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
    || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["'][^>]*>/i);
  const ogDescription = ogDescMatch ? ogDescMatch[1].trim() : '';
  
  // Extract Open Graph image
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["'][^>]*>/i)
    || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["'][^>]*>/i);
  const ogImage = ogImageMatch ? resolveUrl(ogImageMatch[1].trim(), baseUrl) : '';
  
  // Extract canonical URL
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/i)
    || html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["'][^>]*>/i);
  const canonical = canonicalMatch ? resolveUrl(canonicalMatch[1].trim(), baseUrl) : '';
  
  return {
    title,
    description,
    ogTitle,
    ogDescription,
    ogImage,
    canonical,
  };
}

// =============================================================================
// Text Content Extraction
// =============================================================================

/**
 * Valid text tag types for extraction
 */
const TEXT_TAGS: TextTagType[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'li', 'div'];

/**
 * Extracts all text content blocks from HTML
 * 
 * @param html - The HTML content to extract from
 * @returns Array of text blocks with order preserved
 * @requirements 2.1, 2.5
 */
export function extractTextContent(html: string): TextBlock[] {
  const textBlocks: TextBlock[] = [];
  let order = 0;
  
  // Remove script and style content first
  let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Extract text from each tag type
  for (const tag of TEXT_TAGS) {
    const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    let match;
    
    while ((match = pattern.exec(cleanHtml)) !== null) {
      const rawContent = match[1];
      // Strip nested tags to get plain text
      const textContent = rawContent.replace(/<[^>]+>/g, '').trim();
      
      if (textContent) {
        textBlocks.push({
          id: generateId(tag),
          content: sanitizeContent(textContent),
          tag,
          order: order++,
        });
      }
    }
  }
  
  // Sort by original position in document
  // We need to re-order based on actual position in HTML
  const positionedBlocks = textBlocks.map(block => {
    const searchPattern = new RegExp(`<${block.tag}[^>]*>[\\s\\S]*?${escapeRegex(block.content.substring(0, 50))}`, 'i');
    const match = cleanHtml.match(searchPattern);
    return {
      ...block,
      position: match ? cleanHtml.indexOf(match[0]) : Infinity,
    };
  });
  
  positionedBlocks.sort((a, b) => a.position - b.position);
  
  // Re-assign order after sorting
  return positionedBlocks.map((block, index) => ({
    id: block.id,
    content: block.content,
    tag: block.tag,
    order: index,
  }));
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


// =============================================================================
// Image Extraction
// =============================================================================

/**
 * Extracts all images from HTML
 * 
 * @param html - The HTML content to extract from
 * @param baseUrl - The base URL for resolving relative URLs
 * @returns Array of image data
 * @requirements 2.2
 */
export function extractImages(html: string, baseUrl: string): ImageData[] {
  const images: ImageData[] = [];
  
  // Match img tags
  const imgPattern = /<img[^>]*>/gi;
  let match;
  
  while ((match = imgPattern.exec(html)) !== null) {
    const imgTag = match[0];
    
    // Extract src
    const srcMatch = imgTag.match(/src=["']([^"']*)["']/i);
    if (!srcMatch) continue; // Skip images without src
    
    const src = resolveUrl(srcMatch[1], baseUrl);
    if (!src) continue;
    
    // Extract alt
    const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
    const alt = altMatch ? altMatch[1] : '';
    
    // Extract width
    const widthMatch = imgTag.match(/width=["']?(\d+)["']?/i);
    const width = widthMatch ? parseInt(widthMatch[1], 10) : undefined;
    
    // Extract height
    const heightMatch = imgTag.match(/height=["']?(\d+)["']?/i);
    const height = heightMatch ? parseInt(heightMatch[1], 10) : undefined;
    
    images.push({
      src,
      alt,
      width,
      height,
    });
  }
  
  return images;
}

// =============================================================================
// Link Extraction
// =============================================================================

/**
 * Extracts all links from HTML
 * 
 * @param html - The HTML content to extract from
 * @param baseUrl - The base URL for resolving relative URLs and classification
 * @returns Array of link data
 * @requirements 2.3
 */
export function extractLinks(html: string, baseUrl: string): LinkData[] {
  const links: LinkData[] = [];
  
  // Match anchor tags
  const linkPattern = /<a\s+([^>]*)>([^<]*(?:<(?!\/a>)[^<]*)*)<\/a>/gi;
  let match;
  
  while ((match = linkPattern.exec(html)) !== null) {
    const attributes = match[1];
    const text = match[2].replace(/<[^>]+>/g, '').trim(); // Strip nested tags
    
    // Extract href
    const hrefMatch = attributes.match(/href=["']([^"']*)["']/i);
    if (!hrefMatch) continue; // Skip links without href
    
    const rawHref = hrefMatch[1];
    const href = rawHref.startsWith('#') ? rawHref : resolveUrl(rawHref, baseUrl);
    
    // Classify link type
    const type = classifyLinkType(rawHref, baseUrl);
    
    // Extract other attributes
    const extractedAttributes: Record<string, string> = {};
    
    const targetMatch = attributes.match(/target=["']([^"']*)["']/i);
    if (targetMatch) extractedAttributes.target = targetMatch[1];
    
    const relMatch = attributes.match(/rel=["']([^"']*)["']/i);
    if (relMatch) extractedAttributes.rel = relMatch[1];
    
    const titleMatch = attributes.match(/title=["']([^"']*)["']/i);
    if (titleMatch) extractedAttributes.title = titleMatch[1];
    
    const classMatch = attributes.match(/class=["']([^"']*)["']/i);
    if (classMatch) extractedAttributes.class = classMatch[1];
    
    links.push({
      href,
      text: sanitizeContent(text),
      type,
      attributes: extractedAttributes,
    });
  }
  
  return links;
}

// =============================================================================
// List Extraction
// =============================================================================

/**
 * Extracts all lists from HTML preserving order and hierarchy
 * 
 * @param html - The HTML content to extract from
 * @returns Array of list data
 * @requirements 2.5
 */
export function extractLists(html: string): ListData[] {
  const lists: ListData[] = [];
  let order = 0;
  
  // Remove script and style content first
  let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Match ordered lists
  const olPattern = /<ol[^>]*>([\s\S]*?)<\/ol>/gi;
  let match;
  
  while ((match = olPattern.exec(cleanHtml)) !== null) {
    const listContent = match[1];
    const items = extractListItems(listContent);
    
    if (items.length > 0) {
      lists.push({
        id: generateId('ol'),
        items,
        ordered: true,
        order: order++,
      });
    }
  }
  
  // Match unordered lists
  const ulPattern = /<ul[^>]*>([\s\S]*?)<\/ul>/gi;
  
  while ((match = ulPattern.exec(cleanHtml)) !== null) {
    const listContent = match[1];
    const items = extractListItems(listContent);
    
    if (items.length > 0) {
      lists.push({
        id: generateId('ul'),
        items,
        ordered: false,
        order: order++,
      });
    }
  }
  
  // Sort by position in document
  const positionedLists = lists.map(list => {
    const searchPattern = list.ordered ? /<ol[^>]*>/gi : /<ul[^>]*>/gi;
    const matches = [...cleanHtml.matchAll(searchPattern)];
    const listIndex = lists.filter(l => l.ordered === list.ordered && l.order <= list.order).length - 1;
    const position = matches[listIndex]?.index ?? Infinity;
    return { ...list, position };
  });
  
  positionedLists.sort((a, b) => a.position - b.position);
  
  return positionedLists.map((list, index) => ({
    id: list.id,
    items: list.items,
    ordered: list.ordered,
    order: index,
  }));
}

/**
 * Extracts list items from list content
 */
function extractListItems(listContent: string): string[] {
  const items: string[] = [];
  const liPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  
  while ((match = liPattern.exec(listContent)) !== null) {
    // Strip nested tags to get plain text
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text) {
      items.push(sanitizeContent(text));
    }
  }
  
  return items;
}


// =============================================================================
// Form Extraction
// =============================================================================

/**
 * Extracts all forms from HTML with their fields
 * 
 * @param html - The HTML content to extract from
 * @returns Array of form data
 * @requirements 2.6
 */
export function extractForms(html: string): FormData[] {
  const forms: FormData[] = [];
  
  // Match form tags
  const formPattern = /<form([^>]*)>([\s\S]*?)<\/form>/gi;
  let match;
  
  while ((match = formPattern.exec(html)) !== null) {
    const attributes = match[1];
    const formContent = match[2];
    
    // Extract action
    const actionMatch = attributes.match(/action=["']([^"']*)["']/i);
    const action = actionMatch ? actionMatch[1] : '';
    
    // Extract method
    const methodMatch = attributes.match(/method=["']([^"']*)["']/i);
    const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';
    
    // Extract fields
    const fields = extractFormFields(formContent);
    
    forms.push({
      id: generateId('form'),
      action,
      method,
      fields,
    });
  }
  
  return forms;
}

/**
 * Extracts form fields from form content
 */
function extractFormFields(formContent: string): FormField[] {
  const fields: FormField[] = [];
  
  // Extract input fields
  const inputPattern = /<input([^>]*)>/gi;
  let match;
  
  while ((match = inputPattern.exec(formContent)) !== null) {
    const attrs = match[1];
    const field = parseFieldAttributes(attrs);
    if (field.name || field.type !== 'hidden') {
      fields.push(field);
    }
  }
  
  // Extract textarea fields
  const textareaPattern = /<textarea([^>]*)>[\s\S]*?<\/textarea>/gi;
  
  while ((match = textareaPattern.exec(formContent)) !== null) {
    const attrs = match[1];
    const field = parseFieldAttributes(attrs);
    field.type = 'textarea';
    if (field.name) {
      fields.push(field);
    }
  }
  
  // Extract select fields
  const selectPattern = /<select([^>]*)>[\s\S]*?<\/select>/gi;
  
  while ((match = selectPattern.exec(formContent)) !== null) {
    const attrs = match[1];
    const field = parseFieldAttributes(attrs);
    field.type = 'select';
    if (field.name) {
      fields.push(field);
    }
  }
  
  // Try to associate labels with fields
  const labelPattern = /<label[^>]*for=["']([^"']*)["'][^>]*>([^<]*)<\/label>/gi;
  
  while ((match = labelPattern.exec(formContent)) !== null) {
    const forId = match[1];
    const labelText = match[2].trim();
    
    // Find field with matching id or name
    const field = fields.find(f => f.name === forId);
    if (field && labelText) {
      field.label = sanitizeContent(labelText);
    }
  }
  
  return fields;
}

/**
 * Parses field attributes from an attribute string
 */
function parseFieldAttributes(attrs: string): FormField {
  const nameMatch = attrs.match(/name=["']([^"']*)["']/i);
  const typeMatch = attrs.match(/type=["']([^"']*)["']/i);
  const placeholderMatch = attrs.match(/placeholder=["']([^"']*)["']/i);
  const requiredMatch = attrs.match(/required(?:=["']([^"']*)["'])?/i);
  const patternMatch = attrs.match(/pattern=["']([^"']*)["']/i);
  const labelMatch = attrs.match(/aria-label=["']([^"']*)["']/i);
  
  return {
    name: nameMatch ? nameMatch[1] : '',
    type: typeMatch ? typeMatch[1] : 'text',
    label: labelMatch ? labelMatch[1] : undefined,
    placeholder: placeholderMatch ? placeholderMatch[1] : undefined,
    required: requiredMatch !== null,
    validation: patternMatch ? patternMatch[1] : undefined,
  };
}

// =============================================================================
// Structured Data Extraction
// =============================================================================

/**
 * Extracts JSON-LD structured data from HTML
 * 
 * @param html - The HTML content to extract from
 * @returns Structured data object
 * @requirements 2.4
 */
export function extractStructuredData(html: string): Record<string, unknown> {
  const structuredData: Record<string, unknown> = {};
  
  // Match JSON-LD script tags
  const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let index = 0;
  
  while ((match = jsonLdPattern.exec(html)) !== null) {
    try {
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);
      
      // If it's an array, spread it
      if (Array.isArray(parsed)) {
        parsed.forEach((item, i) => {
          structuredData[`item_${index}_${i}`] = item;
        });
      } else {
        // Use @type as key if available, otherwise use index
        const key = parsed['@type'] || `item_${index}`;
        structuredData[key] = parsed;
      }
      index++;
    } catch {
      // Skip invalid JSON
      console.warn('Failed to parse JSON-LD content');
    }
  }
  
  return structuredData;
}


// =============================================================================
// Main Extraction Function
// =============================================================================

/**
 * Extraction statistics for logging
 */
export interface ExtractionStats {
  textBlocks: number;
  images: number;
  links: number;
  lists: number;
  listItems: number;
  forms: number;
  formFields: number;
}

/**
 * Logs extraction statistics
 * 
 * @param stats - The extraction statistics to log
 * @requirements 2.9
 */
export function logExtractionStats(stats: ExtractionStats): void {
  console.log('=== Data Extraction Statistics ===');
  console.log(`Text blocks: ${stats.textBlocks}`);
  console.log(`Images: ${stats.images}`);
  console.log(`Links: ${stats.links}`);
  console.log(`Lists: ${stats.lists}`);
  console.log(`List items: ${stats.listItems}`);
  console.log(`Forms: ${stats.forms}`);
  console.log(`Form fields: ${stats.formFields}`);
  console.log('==================================');
}

/**
 * Calculates item counts from extracted data
 * 
 * @param data - Partial extracted data
 * @returns Item counts for verification
 */
export function calculateItemCounts(
  textContent: TextBlock[],
  images: ImageData[],
  links: LinkData[],
  lists: ListData[]
): ItemCounts {
  const listItems = lists.reduce((sum, list) => sum + list.items.length, 0);
  
  return {
    text: textContent.length,
    images: images.length,
    links: links.length,
    listItems,
  };
}

/**
 * Main function to extract all page data
 * 
 * Orchestrates all extraction functions and returns complete ExtractedData.
 * Logs statistics for verification.
 * 
 * @param html - The HTML content to extract from
 * @param baseUrl - The base URL for resolving relative URLs
 * @returns Complete extracted data with all content
 * @requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.9
 * 
 * @example
 * const data = extractPageData('<html>...</html>', 'https://example.com');
 * console.log(data.itemCounts); // { text: 10, images: 5, links: 20, listItems: 15 }
 */
export function extractPageData(html: string, baseUrl: string): ExtractedData {
  // Reset ID counter for consistent IDs
  resetIdCounter();
  
  // Extract all content types
  const metadata = extractMetadata(html, baseUrl);
  const textContent = extractTextContent(html);
  const images = extractImages(html, baseUrl);
  const links = extractLinks(html, baseUrl);
  const lists = extractLists(html);
  const forms = extractForms(html);
  const structuredData = extractStructuredData(html);
  
  // Calculate item counts
  const itemCounts = calculateItemCounts(textContent, images, links, lists);
  
  // Log statistics
  const stats: ExtractionStats = {
    textBlocks: textContent.length,
    images: images.length,
    links: links.length,
    lists: lists.length,
    listItems: itemCounts.listItems,
    forms: forms.length,
    formFields: forms.reduce((sum, form) => sum + form.fields.length, 0),
  };
  logExtractionStats(stats);
  
  // Return complete extracted data
  return {
    metadata,
    textContent,
    images,
    links,
    lists,
    forms,
    structuredData,
    extractedAt: new Date().toISOString(),
    itemCounts,
  };
}

/**
 * Extracts page data without logging (for testing)
 * 
 * @param html - The HTML content to extract from
 * @param baseUrl - The base URL for resolving relative URLs
 * @returns Complete extracted data with all content
 */
export function extractPageDataSilent(html: string, baseUrl: string): ExtractedData {
  // Reset ID counter for consistent IDs
  resetIdCounter();
  
  // Extract all content types
  const metadata = extractMetadata(html, baseUrl);
  const textContent = extractTextContent(html);
  const images = extractImages(html, baseUrl);
  const links = extractLinks(html, baseUrl);
  const lists = extractLists(html);
  const forms = extractForms(html);
  const structuredData = extractStructuredData(html);
  
  // Calculate item counts
  const itemCounts = calculateItemCounts(textContent, images, links, lists);
  
  // Return complete extracted data
  return {
    metadata,
    textContent,
    images,
    links,
    lists,
    forms,
    structuredData,
    extractedAt: new Date().toISOString(),
    itemCounts,
  };
}
