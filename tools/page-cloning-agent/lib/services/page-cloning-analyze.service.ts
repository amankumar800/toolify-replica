/**
 * Page Cloning Agent - Page Analysis Service
 * 
 * Analyzes source pages using Playwright accessibility snapshots to identify
 * DOM structure, sections, interactive elements, and navigation patterns.
 * 
 * @module page-cloning-analyze.service
 * @requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

import type {
  PageAnalysis,
  Section,
  SectionType,
  InteractiveElement,
  InteractiveElementType,
  NavigationPattern,
  LinkType,
} from '../types/page-cloning';

// =============================================================================
// Types for Snapshot Parsing
// =============================================================================

/**
 * Represents a parsed node from a Playwright accessibility snapshot
 */
export interface SnapshotNode {
  /** Accessibility role (button, link, heading, etc.) */
  role: string;
  /** Element name/label */
  name: string;
  /** Element attributes (href, level, etc.) */
  attributes: Record<string, string>;
  /** Indentation depth in the snapshot */
  depth: number;
  /** Child nodes */
  children: SnapshotNode[];
  /** Reference ID if present (for Playwright interactions) */
  ref?: string;
}

// =============================================================================
// Role Mappings
// =============================================================================

/** Maps accessibility roles to section types */
const ROLE_TO_SECTION_TYPE: Record<string, SectionType> = {
  banner: 'header',
  header: 'header',
  navigation: 'header', // Navigation is often part of header
  main: 'main',
  complementary: 'sidebar',
  aside: 'sidebar',
  contentinfo: 'footer',
  footer: 'footer',
  dialog: 'modal',
  alertdialog: 'modal',
  region: 'panel',
  article: 'panel',
  section: 'panel',
};


/** Roles that indicate interactive elements */
const INTERACTIVE_ROLES: Record<string, InteractiveElementType> = {
  button: 'button',
  link: 'link',
  tab: 'tab',
  combobox: 'dropdown',
  listbox: 'dropdown',
  menuitem: 'dropdown',
  details: 'accordion',
  disclosure: 'accordion',
};

/** Roles that indicate form elements */
const FORM_ROLES = new Set([
  'textbox',
  'checkbox',
  'radio',
  'switch',
  'slider',
  'spinbutton',
  'searchbox',
]);

// =============================================================================
// Snapshot Parsing
// =============================================================================

/**
 * Parses a Playwright accessibility snapshot into a tree structure
 * 
 * @param snapshot - Raw snapshot text from Playwright browser_snapshot
 * @returns Array of root-level SnapshotNodes
 * 
 * @example
 * const snapshot = `- document
 *   - banner
 *     - link "Home" [href="/"]`;
 * const nodes = parseSnapshot(snapshot);
 */
export function parseSnapshot(snapshot: string): SnapshotNode[] {
  if (!snapshot || typeof snapshot !== 'string') {
    return [];
  }

  const lines = snapshot.split('\n').filter(line => line.trim());
  const rootNodes: SnapshotNode[] = [];
  const stack: { node: SnapshotNode; depth: number }[] = [];

  for (const line of lines) {
    const parsed = parseSnapshotLine(line);
    if (!parsed) continue;

    const node: SnapshotNode = {
      role: parsed.role,
      name: parsed.name,
      attributes: parsed.attributes,
      depth: parsed.depth,
      children: [],
      ref: parsed.ref,
    };

    // Find parent based on depth
    while (stack.length > 0 && stack[stack.length - 1].depth >= parsed.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      rootNodes.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ node, depth: parsed.depth });
  }

  return rootNodes;
}

/**
 * Parses a single line from a Playwright snapshot
 */
function parseSnapshotLine(line: string): {
  role: string;
  name: string;
  attributes: Record<string, string>;
  depth: number;
  ref?: string;
} | null {
  // Calculate depth from leading spaces/dashes
  const leadingMatch = line.match(/^(\s*)-\s*/);
  if (!leadingMatch) return null;

  const depth = Math.floor(leadingMatch[1].length / 2);
  const content = line.slice(leadingMatch[0].length);

  // Parse role (first word)
  const roleMatch = content.match(/^(\w+)/);
  if (!roleMatch) return null;

  const role = roleMatch[1].toLowerCase();
  let remaining = content.slice(roleMatch[0].length).trim();

  // Parse name (quoted string)
  let name = '';
  const nameMatch = remaining.match(/^"([^"]*)"/);
  if (nameMatch) {
    name = nameMatch[1];
    remaining = remaining.slice(nameMatch[0].length).trim();
  }

  // Parse attributes [key=value, key2=value2]
  const attributes: Record<string, string> = {};
  let ref: string | undefined;

  const attrMatch = remaining.match(/^\[([^\]]*)\]/);
  if (attrMatch) {
    const attrString = attrMatch[1];
    // Split by comma, but handle values that might contain commas
    const attrPairs = attrString.split(/,\s*(?=[a-zA-Z_]+=)/);
    
    for (const pair of attrPairs) {
      const eqIndex = pair.indexOf('=');
      if (eqIndex > 0) {
        const key = pair.slice(0, eqIndex).trim();
        let value = pair.slice(eqIndex + 1).trim();
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        attributes[key] = value;
        
        if (key === 'ref') {
          ref = value;
        }
      }
    }
  }

  return { role, name, attributes, depth, ref };
}


// =============================================================================
// Section Identification
// =============================================================================

/**
 * Identifies distinct sections in the page from parsed snapshot nodes
 * 
 * @param nodes - Parsed snapshot nodes
 * @returns Array of identified sections
 * 
 * @requirements 1.3
 */
export function identifySections(nodes: SnapshotNode[]): Section[] {
  const sections: Section[] = [];
  let sectionIndex = 0;

  function processNode(node: SnapshotNode, parentSelector: string = ''): Section | null {
    const sectionType = ROLE_TO_SECTION_TYPE[node.role];
    
    if (sectionType) {
      const selector = generateSelector(node, parentSelector);
      const section: Section = {
        id: `section-${sectionIndex++}`,
        type: sectionType,
        selector,
        children: [],
      };

      // Process children for nested sections
      for (const child of node.children) {
        const childSection = processNode(child, selector);
        if (childSection) {
          section.children.push(childSection);
        }
      }

      return section;
    }

    // Not a section, but check children
    for (const child of node.children) {
      const childSection = processNode(child, parentSelector);
      if (childSection) {
        sections.push(childSection);
      }
    }

    return null;
  }

  for (const node of nodes) {
    const section = processNode(node, '');
    if (section) {
      sections.push(section);
    }
  }

  return sections;
}

/**
 * Generates a CSS-like selector for a snapshot node
 */
function generateSelector(node: SnapshotNode, parentSelector: string): string {
  let selector = '';

  // Use ref if available (most reliable for Playwright)
  if (node.ref) {
    return `[ref="${node.ref}"]`;
  }

  // Build selector from role and name
  if (node.role) {
    selector = `[role="${node.role}"]`;
  }

  if (node.name) {
    // Escape quotes in name
    const escapedName = node.name.replace(/"/g, '\\"');
    selector += `[aria-label="${escapedName}"]`;
  }

  // Add parent context if available
  if (parentSelector && selector) {
    return `${parentSelector} ${selector}`;
  }

  return selector || `[role="${node.role}"]`;
}

// =============================================================================
// Interactive Element Identification
// =============================================================================

/**
 * Identifies all interactive elements in the page
 * 
 * @param nodes - Parsed snapshot nodes
 * @returns Array of interactive elements
 * 
 * @requirements 1.4
 */
export function identifyInteractiveElements(nodes: SnapshotNode[]): InteractiveElement[] {
  const elements: InteractiveElement[] = [];

  function processNode(node: SnapshotNode, parentSelector: string = ''): void {
    const elementType = INTERACTIVE_ROLES[node.role];
    const isFormElement = FORM_ROLES.has(node.role);

    if (elementType || isFormElement) {
      const selector = generateSelector(node, parentSelector);
      const action = generateActionDescription(node, elementType || 'form');

      elements.push({
        type: elementType || 'form',
        selector,
        action,
      });
    }

    // Process children
    const currentSelector = generateSelector(node, parentSelector);
    for (const child of node.children) {
      processNode(child, currentSelector);
    }
  }

  for (const node of nodes) {
    processNode(node, '');
  }

  return elements;
}

/**
 * Generates a human-readable action description for an interactive element
 */
function generateActionDescription(
  node: SnapshotNode,
  elementType: InteractiveElementType | 'form'
): string {
  const name = node.name || 'unnamed';

  switch (elementType) {
    case 'button':
      return `Click "${name}" button`;
    case 'link':
      const href = node.attributes.href || '';
      return `Navigate to "${name}"${href ? ` (${href})` : ''}`;
    case 'tab':
      return `Switch to "${name}" tab`;
    case 'dropdown':
      return `Open "${name}" dropdown`;
    case 'accordion':
      return `Expand/collapse "${name}" section`;
    case 'form':
      return `Input into "${name}" field`;
    default:
      return `Interact with "${name}"`;
  }
}


// =============================================================================
// Breakpoint Identification
// =============================================================================

/** Common responsive breakpoints (Tailwind CSS defaults) */
const DEFAULT_BREAKPOINTS = ['640px', '768px', '1024px', '1280px', '1536px'];

/**
 * Identifies responsive breakpoints from the page
 * 
 * Since accessibility snapshots don't contain CSS information,
 * this function returns common breakpoints and can be enhanced
 * with actual viewport testing data.
 * 
 * @param snapshot - Raw snapshot text (for future CSS class analysis)
 * @param detectedBreakpoints - Optional breakpoints detected from viewport testing
 * @returns Array of breakpoint strings
 * 
 * @requirements 1.5
 */
export function identifyBreakpoints(
  snapshot: string,
  detectedBreakpoints?: string[]
): string[] {
  // If breakpoints were detected through viewport testing, use those
  if (detectedBreakpoints && detectedBreakpoints.length > 0) {
    return detectedBreakpoints;
  }

  // Look for common breakpoint indicators in class names or attributes
  const breakpointPatterns = [
    /sm:|md:|lg:|xl:|2xl:/g,  // Tailwind breakpoint prefixes
    /\b(mobile|tablet|desktop)\b/gi,  // Common responsive class names
    /@media.*?(\d+)px/g,  // Media query patterns
  ];

  const foundBreakpoints = new Set<string>();

  for (const pattern of breakpointPatterns) {
    const matches = snapshot.match(pattern);
    if (matches) {
      // Map Tailwind prefixes to pixel values
      for (const match of matches) {
        if (match.includes('sm:')) foundBreakpoints.add('640px');
        if (match.includes('md:')) foundBreakpoints.add('768px');
        if (match.includes('lg:')) foundBreakpoints.add('1024px');
        if (match.includes('xl:')) foundBreakpoints.add('1280px');
        if (match.includes('2xl:')) foundBreakpoints.add('1536px');
      }
    }
  }

  // Return found breakpoints or defaults
  return foundBreakpoints.size > 0 
    ? Array.from(foundBreakpoints).sort((a, b) => parseInt(a) - parseInt(b))
    : DEFAULT_BREAKPOINTS;
}

// =============================================================================
// Navigation Pattern Identification
// =============================================================================

/**
 * Classifies a link as internal, external, or anchor
 */
function classifyLinkType(href: string, baseUrl: string): LinkType {
  if (!href) return 'internal';

  // Anchor links
  if (href.startsWith('#')) {
    return 'anchor';
  }

  // Special protocols
  if (href.startsWith('mailto:') || href.startsWith('tel:')) {
    return 'external';
  }

  // JavaScript links - treat as internal
  if (href.startsWith('javascript:')) {
    return 'internal';
  }

  try {
    const linkUrl = new URL(href, baseUrl);
    const baseUrlObj = new URL(baseUrl);

    // Same hostname = internal
    if (linkUrl.hostname === baseUrlObj.hostname) {
      return 'internal';
    }

    return 'external';
  } catch {
    // If we can't parse, assume internal (relative path)
    return 'internal';
  }
}

/**
 * Identifies all navigation patterns in the page
 * 
 * @param nodes - Parsed snapshot nodes
 * @param baseUrl - Base URL for classifying links
 * @returns Array of navigation patterns
 * 
 * @requirements 1.6
 */
export function identifyNavigation(
  nodes: SnapshotNode[],
  baseUrl: string
): NavigationPattern[] {
  const patterns: NavigationPattern[] = [];
  const seenHrefs = new Set<string>();

  function processNode(node: SnapshotNode): void {
    if (node.role === 'link') {
      const href = node.attributes.href || '';
      const text = node.name || href;

      // Skip duplicates and empty hrefs
      if (href && !seenHrefs.has(href)) {
        seenHrefs.add(href);

        patterns.push({
          type: classifyLinkType(href, baseUrl),
          href,
          text,
        });
      }
    }

    // Process children
    for (const child of node.children) {
      processNode(child);
    }
  }

  for (const node of nodes) {
    processNode(node);
  }

  return patterns;
}

// =============================================================================
// Dependency Extraction
// =============================================================================

/**
 * Extracts page dependencies (internal links to other pages)
 */
function extractDependencies(navigation: NavigationPattern[]): string[] {
  const dependencies: string[] = [];
  const seen = new Set<string>();

  for (const nav of navigation) {
    if (nav.type === 'internal' && nav.href) {
      // Normalize the href
      const normalized = nav.href.split('?')[0].split('#')[0];
      
      // Skip empty paths and root
      if (normalized && normalized !== '/' && !seen.has(normalized)) {
        seen.add(normalized);
        dependencies.push(normalized);
      }
    }
  }

  return dependencies;
}


// =============================================================================
// Main Analysis Function
// =============================================================================

/**
 * Analyzes a source page using its Playwright accessibility snapshot
 * 
 * This is the main entry point for page analysis. It orchestrates
 * all analysis functions to produce a complete PageAnalysis object.
 * 
 * @param snapshot - Raw accessibility snapshot from Playwright browser_snapshot
 * @param url - URL of the analyzed page
 * @param title - Page title (from document or meta tags)
 * @param detectedBreakpoints - Optional breakpoints from viewport testing
 * @returns Complete page analysis
 * 
 * @requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 * 
 * @example
 * // After getting snapshot from Playwright
 * const snapshot = await mcp_playwright_browser_snapshot({});
 * const analysis = analyzePage(snapshot, 'https://example.com', 'Example Page');
 */
export function analyzePage(
  snapshot: string,
  url: string,
  title: string,
  detectedBreakpoints?: string[]
): PageAnalysis {
  // Parse the snapshot into a tree structure
  const nodes = parseSnapshot(snapshot);

  // Identify all page components
  const sections = identifySections(nodes);
  const interactiveElements = identifyInteractiveElements(nodes);
  const navigation = identifyNavigation(nodes, url);
  const responsiveBreakpoints = identifyBreakpoints(snapshot, detectedBreakpoints);
  const dependencies = extractDependencies(navigation);

  return {
    url,
    title,
    sections,
    navigation,
    interactiveElements,
    responsiveBreakpoints,
    dependencies,
  };
}

/**
 * Analyzes a page and logs statistics
 * 
 * @param snapshot - Raw accessibility snapshot
 * @param url - Page URL
 * @param title - Page title
 * @returns Complete page analysis with logging
 */
export function analyzePageWithLogging(
  snapshot: string,
  url: string,
  title: string,
  detectedBreakpoints?: string[]
): PageAnalysis {
  const analysis = analyzePage(snapshot, url, title, detectedBreakpoints);

  console.log('=== Page Analysis Complete ===');
  console.log(`URL: ${url}`);
  console.log(`Title: ${title}`);
  console.log(`Sections found: ${analysis.sections.length}`);
  console.log(`Interactive elements: ${analysis.interactiveElements.length}`);
  console.log(`Navigation links: ${analysis.navigation.length}`);
  console.log(`  - Internal: ${analysis.navigation.filter(n => n.type === 'internal').length}`);
  console.log(`  - External: ${analysis.navigation.filter(n => n.type === 'external').length}`);
  console.log(`  - Anchors: ${analysis.navigation.filter(n => n.type === 'anchor').length}`);
  console.log(`Breakpoints: ${analysis.responsiveBreakpoints.join(', ')}`);
  console.log(`Dependencies: ${analysis.dependencies.length}`);
  console.log('==============================');

  return analysis;
}
