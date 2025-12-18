/**
 * Unit Tests for Page Cloning Analysis Service
 * 
 * Tests section identification, interactive element detection, and navigation pattern extraction.
 * 
 * @see .kiro/specs/page-cloning-agent/design.md
 * @requirements 1.3, 1.4, 1.6
 */

import { describe, it, expect } from 'vitest';
import {
  parseSnapshot,
  identifySections,
  identifyInteractiveElements,
  identifyNavigation,
  identifyBreakpoints,
  analyzePage,
  type SnapshotNode,
} from './page-cloning-analyze.service';

// =============================================================================
// Test Fixtures - Sample Playwright Snapshots
// =============================================================================

const SIMPLE_SNAPSHOT = `
- document [url="https://example.com"]
  - banner
    - navigation "Main Navigation"
      - link "Home" [href="/"]
      - link "About" [href="/about"]
  - main
    - heading "Welcome" [level=1]
    - paragraph "Some text content"
    - button "Click me"
  - contentinfo
    - link "Privacy" [href="/privacy"]
`.trim();

const COMPLEX_SNAPSHOT = `
- document [url="https://example.com/page"]
  - banner
    - navigation "Primary Nav"
      - link "Home" [href="/"]
      - link "Products" [href="/products"]
      - link "External" [href="https://external.com"]
  - complementary
    - heading "Sidebar" [level=2]
    - link "Category 1" [href="/category/1"]
    - link "Category 2" [href="/category/2"]
  - main
    - region "Content Area"
      - heading "Main Content" [level=1]
      - button "Submit Form"
      - link "Learn More" [href="#details"]
      - combobox "Select Option"
      - details "FAQ Section"
        - button "Toggle FAQ"
  - dialog "Modal Dialog"
    - heading "Modal Title" [level=2]
    - button "Close"
  - contentinfo
    - link "Terms" [href="/terms"]
    - link "Contact" [href="mailto:test@example.com"]
`.trim();

const INTERACTIVE_SNAPSHOT = `
- document
  - main
    - button "Primary Action"
    - button "Secondary Action"
    - link "Navigate Away" [href="/other"]
    - tab "Tab 1"
    - tab "Tab 2"
    - combobox "Dropdown Menu"
    - details "Expandable Section"
    - textbox "Search" [placeholder="Search..."]
    - checkbox "Accept Terms"
`.trim();

// =============================================================================
// parseSnapshot Tests
// =============================================================================

describe('parseSnapshot', () => {
  it('parses a simple snapshot into nodes', () => {
    const nodes = parseSnapshot(SIMPLE_SNAPSHOT);
    
    expect(nodes.length).toBe(1);
    expect(nodes[0].role).toBe('document');
    expect(nodes[0].children.length).toBe(3); // banner, main, contentinfo
  });

  it('extracts node attributes correctly', () => {
    const nodes = parseSnapshot(SIMPLE_SNAPSHOT);
    const document = nodes[0];
    
    expect(document.attributes.url).toBe('https://example.com');
  });

  it('extracts node names correctly', () => {
    const nodes = parseSnapshot(SIMPLE_SNAPSHOT);
    const banner = nodes[0].children[0];
    const nav = banner.children[0];
    
    expect(nav.name).toBe('Main Navigation');
  });

  it('handles empty snapshot', () => {
    const nodes = parseSnapshot('');
    expect(nodes).toEqual([]);
  });

  it('handles null/undefined input', () => {
    expect(parseSnapshot(null as unknown as string)).toEqual([]);
    expect(parseSnapshot(undefined as unknown as string)).toEqual([]);
  });

  it('preserves hierarchy depth', () => {
    const nodes = parseSnapshot(SIMPLE_SNAPSHOT);
    const document = nodes[0];
    const banner = document.children[0];
    const nav = banner.children[0];
    const homeLink = nav.children[0];
    
    expect(document.depth).toBe(0);
    expect(banner.depth).toBe(1);
    expect(nav.depth).toBe(2);
    expect(homeLink.depth).toBe(3);
  });
});


// =============================================================================
// identifySections Tests - Requirements 1.3
// =============================================================================

describe('identifySections', () => {
  it('identifies header section from banner role', () => {
    const nodes = parseSnapshot(SIMPLE_SNAPSHOT);
    const sections = identifySections(nodes);
    
    const headerSection = sections.find(s => s.type === 'header');
    expect(headerSection).toBeDefined();
  });

  it('identifies main section', () => {
    const nodes = parseSnapshot(SIMPLE_SNAPSHOT);
    const sections = identifySections(nodes);
    
    const mainSection = sections.find(s => s.type === 'main');
    expect(mainSection).toBeDefined();
  });

  it('identifies footer section from contentinfo role', () => {
    const nodes = parseSnapshot(SIMPLE_SNAPSHOT);
    const sections = identifySections(nodes);
    
    const footerSection = sections.find(s => s.type === 'footer');
    expect(footerSection).toBeDefined();
  });

  it('identifies sidebar from complementary role', () => {
    const nodes = parseSnapshot(COMPLEX_SNAPSHOT);
    const sections = identifySections(nodes);
    
    const sidebarSection = sections.find(s => s.type === 'sidebar');
    expect(sidebarSection).toBeDefined();
  });

  it('identifies modal from dialog role', () => {
    const nodes = parseSnapshot(COMPLEX_SNAPSHOT);
    const sections = identifySections(nodes);
    
    const modalSection = sections.find(s => s.type === 'modal');
    expect(modalSection).toBeDefined();
  });

  it('identifies panel from region role', () => {
    const nodes = parseSnapshot(COMPLEX_SNAPSHOT);
    const sections = identifySections(nodes);
    
    // Panel (region) is nested inside main section
    const mainSection = sections.find(s => s.type === 'main');
    expect(mainSection).toBeDefined();
    
    // Check for panel in children of main
    const panelSection = mainSection?.children.find(s => s.type === 'panel');
    expect(panelSection).toBeDefined();
  });

  it('generates unique IDs for each section', () => {
    const nodes = parseSnapshot(COMPLEX_SNAPSHOT);
    const sections = identifySections(nodes);
    
    const ids = sections.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('generates selectors for sections', () => {
    const nodes = parseSnapshot(SIMPLE_SNAPSHOT);
    const sections = identifySections(nodes);
    
    for (const section of sections) {
      expect(section.selector).toBeTruthy();
      expect(section.selector.length).toBeGreaterThan(0);
    }
  });

  it('handles empty nodes array', () => {
    const sections = identifySections([]);
    expect(sections).toEqual([]);
  });
});


// =============================================================================
// identifyInteractiveElements Tests - Requirements 1.4
// =============================================================================

describe('identifyInteractiveElements', () => {
  it('identifies button elements', () => {
    const nodes = parseSnapshot(INTERACTIVE_SNAPSHOT);
    const elements = identifyInteractiveElements(nodes);
    
    const buttons = elements.filter(e => e.type === 'button');
    expect(buttons.length).toBe(2);
  });

  it('identifies link elements', () => {
    const nodes = parseSnapshot(INTERACTIVE_SNAPSHOT);
    const elements = identifyInteractiveElements(nodes);
    
    const links = elements.filter(e => e.type === 'link');
    expect(links.length).toBe(1);
  });

  it('identifies tab elements', () => {
    const nodes = parseSnapshot(INTERACTIVE_SNAPSHOT);
    const elements = identifyInteractiveElements(nodes);
    
    const tabs = elements.filter(e => e.type === 'tab');
    expect(tabs.length).toBe(2);
  });

  it('identifies dropdown elements from combobox role', () => {
    const nodes = parseSnapshot(INTERACTIVE_SNAPSHOT);
    const elements = identifyInteractiveElements(nodes);
    
    const dropdowns = elements.filter(e => e.type === 'dropdown');
    expect(dropdowns.length).toBe(1);
  });

  it('identifies accordion elements from details role', () => {
    const nodes = parseSnapshot(INTERACTIVE_SNAPSHOT);
    const elements = identifyInteractiveElements(nodes);
    
    const accordions = elements.filter(e => e.type === 'accordion');
    expect(accordions.length).toBe(1);
  });

  it('identifies form elements', () => {
    const nodes = parseSnapshot(INTERACTIVE_SNAPSHOT);
    const elements = identifyInteractiveElements(nodes);
    
    const formElements = elements.filter(e => e.type === 'form');
    expect(formElements.length).toBe(2); // textbox and checkbox
  });

  it('generates action descriptions for elements', () => {
    const nodes = parseSnapshot(INTERACTIVE_SNAPSHOT);
    const elements = identifyInteractiveElements(nodes);
    
    for (const element of elements) {
      expect(element.action).toBeTruthy();
      expect(element.action.length).toBeGreaterThan(0);
    }
  });

  it('generates selectors for elements', () => {
    const nodes = parseSnapshot(INTERACTIVE_SNAPSHOT);
    const elements = identifyInteractiveElements(nodes);
    
    for (const element of elements) {
      expect(element.selector).toBeTruthy();
    }
  });

  it('handles empty nodes array', () => {
    const elements = identifyInteractiveElements([]);
    expect(elements).toEqual([]);
  });

  it('finds nested interactive elements', () => {
    const nodes = parseSnapshot(COMPLEX_SNAPSHOT);
    const elements = identifyInteractiveElements(nodes);
    
    // Should find buttons inside dialog and details
    const buttons = elements.filter(e => e.type === 'button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});


// =============================================================================
// identifyNavigation Tests - Requirements 1.6
// =============================================================================

describe('identifyNavigation', () => {
  const baseUrl = 'https://example.com';

  it('extracts all links from snapshot', () => {
    const nodes = parseSnapshot(SIMPLE_SNAPSHOT);
    const navigation = identifyNavigation(nodes, baseUrl);
    
    expect(navigation.length).toBe(3); // Home, About, Privacy
  });

  it('classifies internal links correctly', () => {
    const nodes = parseSnapshot(SIMPLE_SNAPSHOT);
    const navigation = identifyNavigation(nodes, baseUrl);
    
    const internalLinks = navigation.filter(n => n.type === 'internal');
    expect(internalLinks.length).toBe(3);
  });

  it('classifies external links correctly', () => {
    const nodes = parseSnapshot(COMPLEX_SNAPSHOT);
    const navigation = identifyNavigation(nodes, baseUrl);
    
    const externalLinks = navigation.filter(n => n.type === 'external');
    expect(externalLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('classifies anchor links correctly', () => {
    const nodes = parseSnapshot(COMPLEX_SNAPSHOT);
    const navigation = identifyNavigation(nodes, baseUrl);
    
    const anchorLinks = navigation.filter(n => n.type === 'anchor');
    expect(anchorLinks.length).toBe(1); // #details
  });

  it('classifies mailto links as external', () => {
    const nodes = parseSnapshot(COMPLEX_SNAPSHOT);
    const navigation = identifyNavigation(nodes, baseUrl);
    
    const mailtoLink = navigation.find(n => n.href.startsWith('mailto:'));
    expect(mailtoLink).toBeDefined();
    expect(mailtoLink?.type).toBe('external');
  });

  it('extracts link text', () => {
    const nodes = parseSnapshot(SIMPLE_SNAPSHOT);
    const navigation = identifyNavigation(nodes, baseUrl);
    
    const homeLink = navigation.find(n => n.href === '/');
    expect(homeLink?.text).toBe('Home');
  });

  it('deduplicates links with same href', () => {
    const duplicateSnapshot = `
- document
  - main
    - link "Link 1" [href="/same"]
    - link "Link 2" [href="/same"]
    - link "Link 3" [href="/different"]
    `.trim();
    
    const nodes = parseSnapshot(duplicateSnapshot);
    const navigation = identifyNavigation(nodes, baseUrl);
    
    const sameLinks = navigation.filter(n => n.href === '/same');
    expect(sameLinks.length).toBe(1);
  });

  it('handles empty nodes array', () => {
    const navigation = identifyNavigation([], baseUrl);
    expect(navigation).toEqual([]);
  });
});

// =============================================================================
// identifyBreakpoints Tests - Requirements 1.5
// =============================================================================

describe('identifyBreakpoints', () => {
  it('returns default breakpoints when no patterns found', () => {
    const breakpoints = identifyBreakpoints('simple content without breakpoint hints');
    
    expect(breakpoints).toContain('640px');
    expect(breakpoints).toContain('768px');
    expect(breakpoints).toContain('1024px');
    expect(breakpoints).toContain('1280px');
  });

  it('uses provided detected breakpoints when available', () => {
    const detected = ['480px', '960px'];
    const breakpoints = identifyBreakpoints('any content', detected);
    
    expect(breakpoints).toEqual(detected);
  });

  it('detects Tailwind breakpoint prefixes', () => {
    const snapshot = 'class="sm:hidden md:block lg:flex xl:grid"';
    const breakpoints = identifyBreakpoints(snapshot);
    
    expect(breakpoints).toContain('640px');
    expect(breakpoints).toContain('768px');
    expect(breakpoints).toContain('1024px');
    expect(breakpoints).toContain('1280px');
  });

  it('returns sorted breakpoints', () => {
    const snapshot = 'class="xl:block sm:hidden lg:flex md:grid"';
    const breakpoints = identifyBreakpoints(snapshot);
    
    // Should be sorted by pixel value
    for (let i = 1; i < breakpoints.length; i++) {
      const prev = parseInt(breakpoints[i - 1]);
      const curr = parseInt(breakpoints[i]);
      expect(curr).toBeGreaterThan(prev);
    }
  });
});


// =============================================================================
// analyzePage Tests - Main Orchestrator
// =============================================================================

describe('analyzePage', () => {
  const url = 'https://example.com/page';
  const title = 'Test Page';

  it('returns complete PageAnalysis structure', () => {
    const analysis = analyzePage(SIMPLE_SNAPSHOT, url, title);
    
    expect(analysis.url).toBe(url);
    expect(analysis.title).toBe(title);
    expect(analysis.sections).toBeDefined();
    expect(analysis.navigation).toBeDefined();
    expect(analysis.interactiveElements).toBeDefined();
    expect(analysis.responsiveBreakpoints).toBeDefined();
    expect(analysis.dependencies).toBeDefined();
  });

  it('extracts dependencies from internal links', () => {
    const analysis = analyzePage(SIMPLE_SNAPSHOT, url, title);
    
    // Should have /about and /privacy as dependencies
    expect(analysis.dependencies).toContain('/about');
    expect(analysis.dependencies).toContain('/privacy');
  });

  it('excludes root path from dependencies', () => {
    const analysis = analyzePage(SIMPLE_SNAPSHOT, url, title);
    
    expect(analysis.dependencies).not.toContain('/');
  });

  it('excludes external links from dependencies', () => {
    const analysis = analyzePage(COMPLEX_SNAPSHOT, url, title);
    
    const hasExternal = analysis.dependencies.some(d => 
      d.startsWith('http://') || d.startsWith('https://')
    );
    expect(hasExternal).toBe(false);
  });

  it('excludes anchor links from dependencies', () => {
    const analysis = analyzePage(COMPLEX_SNAPSHOT, url, title);
    
    const hasAnchor = analysis.dependencies.some(d => d.startsWith('#'));
    expect(hasAnchor).toBe(false);
  });

  it('uses provided breakpoints when available', () => {
    const customBreakpoints = ['500px', '900px'];
    const analysis = analyzePage(SIMPLE_SNAPSHOT, url, title, customBreakpoints);
    
    expect(analysis.responsiveBreakpoints).toEqual(customBreakpoints);
  });

  it('handles empty snapshot', () => {
    const analysis = analyzePage('', url, title);
    
    expect(analysis.url).toBe(url);
    expect(analysis.title).toBe(title);
    expect(analysis.sections).toEqual([]);
    expect(analysis.navigation).toEqual([]);
    expect(analysis.interactiveElements).toEqual([]);
    expect(analysis.dependencies).toEqual([]);
  });

  it('identifies all section types in complex page', () => {
    const analysis = analyzePage(COMPLEX_SNAPSHOT, url, title);
    
    const sectionTypes = new Set(analysis.sections.map(s => s.type));
    
    expect(sectionTypes.has('header')).toBe(true);
    expect(sectionTypes.has('main')).toBe(true);
    expect(sectionTypes.has('sidebar')).toBe(true);
    expect(sectionTypes.has('footer')).toBe(true);
    expect(sectionTypes.has('modal')).toBe(true);
  });

  it('identifies all interactive element types', () => {
    const analysis = analyzePage(COMPLEX_SNAPSHOT, url, title);
    
    const elementTypes = new Set(analysis.interactiveElements.map(e => e.type));
    
    expect(elementTypes.has('button')).toBe(true);
    expect(elementTypes.has('link')).toBe(true);
    expect(elementTypes.has('dropdown')).toBe(true);
    expect(elementTypes.has('accordion')).toBe(true);
  });

  it('identifies all navigation types', () => {
    const analysis = analyzePage(COMPLEX_SNAPSHOT, url, title);
    
    const navTypes = new Set(analysis.navigation.map(n => n.type));
    
    expect(navTypes.has('internal')).toBe(true);
    expect(navTypes.has('external')).toBe(true);
    expect(navTypes.has('anchor')).toBe(true);
  });
});
