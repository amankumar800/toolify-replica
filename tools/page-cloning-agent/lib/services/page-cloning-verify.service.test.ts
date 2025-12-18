/**
 * Unit Tests for Page Cloning Verification Service
 * 
 * Tests snapshot comparison, QA checklist execution, and iterative refinement.
 * 
 * @see .kiro/specs/page-cloning-agent/design.md
 * @requirements 6.1, 10.1, 17.1
 */

import { describe, it, expect } from 'vitest';
import {
  compareSnapshots,
  compareSnapshotNodes,
  checkVisualParity,
  checkDataCompleteness,
  checkLinkIntegrity,
  runQAChecklist,
  verifyClone,
  createVerificationSummary,
  MAX_VERIFICATION_ATTEMPTS,
  type SnapshotComparison,
  type VerificationResult,
} from './page-cloning-verify.service';
import { parseSnapshot } from './page-cloning-analyze.service';
import type {
  PageAnalysis,
  ExtractedData,
  LinkData,
  Section,
} from '../types/page-cloning';

// =============================================================================
// Test Fixtures
// =============================================================================

const SOURCE_SNAPSHOT = `
- document [url="https://source.com"]
  - banner
    - navigation "Main Nav"
      - link "Home" [href="/"]
      - link "About" [href="/about"]
  - main
    - heading "Welcome" [level=1]
    - paragraph "Main content here"
    - button "Submit"
  - contentinfo
    - link "Privacy" [href="/privacy"]
`.trim();

const MATCHING_CLONE_SNAPSHOT = `
- document [url="http://localhost:3000"]
  - banner
    - navigation "Main Nav"
      - link "Home" [href="/"]
      - link "About" [href="/about"]
  - main
    - heading "Welcome" [level=1]
    - paragraph "Main content here"
    - button "Submit"
  - contentinfo
    - link "Privacy" [href="/privacy"]
`.trim();

const MISSING_CONTENT_SNAPSHOT = `
- document [url="http://localhost:3000"]
  - banner
    - navigation "Main Nav"
      - link "Home" [href="/"]
  - main
    - heading "Welcome" [level=1]
  - contentinfo
`.trim();

const createMockPageAnalysis = (overrides?: Partial<PageAnalysis>): PageAnalysis => ({
  url: 'https://example.com',
  title: 'Test Page',
  sections: [
    { id: 'section-0', type: 'header', selector: '[role="banner"]', children: [] },
    { id: 'section-1', type: 'main', selector: '[role="main"]', children: [] },
    { id: 'section-2', type: 'footer', selector: '[role="contentinfo"]', children: [] },
  ],
  navigation: [
    { type: 'internal', href: '/', text: 'Home' },
    { type: 'external', href: 'https://external.com', text: 'External' },
  ],
  interactiveElements: [
    { type: 'button', selector: 'button', action: 'Click Submit' },
    { type: 'link', selector: 'a', action: 'Navigate' },
  ],
  responsiveBreakpoints: ['768px', '1024px'],
  dependencies: ['/about', '/contact'],
  ...overrides,
});

const createMockExtractedData = (overrides?: Partial<ExtractedData>): ExtractedData => ({
  metadata: {
    title: 'Test Page',
    description: 'Test description',
    ogTitle: 'Test OG Title',
    ogDescription: 'Test OG Description',
    ogImage: 'https://example.com/image.png',
    canonical: 'https://example.com',
  },
  textContent: [
    { id: 'text-0', content: 'Welcome to our site', tag: 'h1', order: 0 },
    { id: 'text-1', content: 'This is the main content', tag: 'p', order: 1 },
  ],
  images: [
    { src: 'https://example.com/img1.png', alt: 'Image 1' },
    { src: 'https://example.com/img2.png', alt: 'Image 2' },
  ],
  links: [
    { href: '/', text: 'Home', type: 'internal', attributes: {} },
    { href: 'https://external.com', text: 'External', type: 'external', attributes: { target: '_blank', rel: 'noopener noreferrer' } },
  ],
  lists: [],
  forms: [],
  structuredData: {},
  extractedAt: new Date().toISOString(),
  itemCounts: { text: 2, images: 2, links: 2, listItems: 0 },
  ...overrides,
});


// =============================================================================
// compareSnapshots Tests - Requirements 17.2
// =============================================================================

describe('compareSnapshots', () => {
  it('returns match when snapshots are identical', () => {
    const result = compareSnapshots(SOURCE_SNAPSHOT, MATCHING_CLONE_SNAPSHOT);
    
    expect(result.isMatch).toBe(true);
    expect(result.differences).toHaveLength(0);
    expect(result.score).toBe(100);
  });

  it('detects missing elements', () => {
    const result = compareSnapshots(SOURCE_SNAPSHOT, MISSING_CONTENT_SNAPSHOT);
    
    expect(result.isMatch).toBe(false);
    expect(result.differences.length).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
  });

  it('reports missing text content', () => {
    const result = compareSnapshots(SOURCE_SNAPSHOT, MISSING_CONTENT_SNAPSHOT);
    
    const missingText = result.differences.filter(d => d.type === 'missing_text');
    expect(missingText.length).toBeGreaterThan(0);
  });

  it('reports missing links', () => {
    const result = compareSnapshots(SOURCE_SNAPSHOT, MISSING_CONTENT_SNAPSHOT);
    
    const missingLinks = result.differences.filter(d => d.type === 'missing_link');
    expect(missingLinks.length).toBeGreaterThan(0);
  });

  it('calculates element statistics', () => {
    const result = compareSnapshots(SOURCE_SNAPSHOT, MISSING_CONTENT_SNAPSHOT);
    
    expect(result.stats.totalSourceElements).toBeGreaterThan(0);
    expect(result.stats.totalCloneElements).toBeGreaterThan(0);
    expect(result.stats.missingElements).toBeGreaterThanOrEqual(0);
  });

  it('handles empty snapshots', () => {
    const result = compareSnapshots('', '');
    
    expect(result.isMatch).toBe(true);
    expect(result.score).toBe(100);
  });
});

describe('compareSnapshotNodes', () => {
  it('compares parsed nodes directly', () => {
    const sourceNodes = parseSnapshot(SOURCE_SNAPSHOT);
    const cloneNodes = parseSnapshot(MATCHING_CLONE_SNAPSHOT);
    
    const result = compareSnapshotNodes(sourceNodes, cloneNodes);
    
    expect(result.isMatch).toBe(true);
  });

  it('handles empty node arrays', () => {
    const result = compareSnapshotNodes([], []);
    
    expect(result.isMatch).toBe(true);
    expect(result.stats.totalSourceElements).toBe(0);
    expect(result.stats.totalCloneElements).toBe(0);
  });
});

// =============================================================================
// checkVisualParity Tests - Requirements 6.1, 6.2, 6.3, 6.4, 6.5
// =============================================================================

describe('checkVisualParity', () => {
  it('passes when analyses match', () => {
    const sourceAnalysis = createMockPageAnalysis();
    const cloneAnalysis = createMockPageAnalysis();
    
    const result = checkVisualParity(sourceAnalysis, cloneAnalysis);
    
    expect(result.passed).toBe(true);
    expect(result.sectionOrderMatch).toBe(true);
    expect(result.interactiveElementsMatch).toBe(true);
  });

  it('detects missing sections', () => {
    const sourceAnalysis = createMockPageAnalysis();
    const cloneAnalysis = createMockPageAnalysis({
      sections: [
        { id: 'section-0', type: 'header', selector: '[role="banner"]', children: [] },
        // Missing main and footer
      ],
    });
    
    const result = checkVisualParity(sourceAnalysis, cloneAnalysis);
    
    expect(result.passed).toBe(false);
    expect(result.sectionOrderMatch).toBe(false);
    const missingSections = result.differences.filter(d => d.type === 'missing_section');
    expect(missingSections.length).toBeGreaterThan(0);
  });

  it('detects section order mismatch', () => {
    const sourceAnalysis = createMockPageAnalysis({
      sections: [
        { id: 'section-0', type: 'header', selector: '', children: [] },
        { id: 'section-1', type: 'main', selector: '', children: [] },
        { id: 'section-2', type: 'footer', selector: '', children: [] },
      ],
    });
    const cloneAnalysis = createMockPageAnalysis({
      sections: [
        { id: 'section-0', type: 'header', selector: '', children: [] },
        { id: 'section-2', type: 'footer', selector: '', children: [] },
        { id: 'section-1', type: 'main', selector: '', children: [] },
      ],
    });
    
    const result = checkVisualParity(sourceAnalysis, cloneAnalysis);
    
    expect(result.sectionOrderMatch).toBe(false);
  });

  it('detects missing interactive elements', () => {
    const sourceAnalysis = createMockPageAnalysis({
      interactiveElements: [
        { type: 'button', selector: '', action: '' },
        { type: 'dropdown', selector: '', action: '' },
      ],
    });
    const cloneAnalysis = createMockPageAnalysis({
      interactiveElements: [
        { type: 'button', selector: '', action: '' },
      ],
    });
    
    const result = checkVisualParity(sourceAnalysis, cloneAnalysis);
    
    expect(result.interactiveElementsMatch).toBe(false);
  });
});


// =============================================================================
// checkDataCompleteness Tests - Requirements 10.1, 10.2, 12.1
// =============================================================================

describe('checkDataCompleteness', () => {
  it('passes when data is complete', () => {
    const sourceData = createMockExtractedData();
    const cloneData = createMockExtractedData();
    
    const result = checkDataCompleteness(sourceData, cloneData);
    
    expect(result.passed).toBe(true);
    expect(result.textComplete).toBe(true);
    expect(result.imagesComplete).toBe(true);
    expect(result.linksComplete).toBe(true);
  });

  it('detects missing text content', () => {
    const sourceData = createMockExtractedData({
      textContent: [
        { id: 'text-0', content: 'Important content here', tag: 'p', order: 0 },
        { id: 'text-1', content: 'More important content', tag: 'p', order: 1 },
      ],
      itemCounts: { text: 2, images: 0, links: 0, listItems: 0 },
    });
    const cloneData = createMockExtractedData({
      textContent: [],
      itemCounts: { text: 0, images: 0, links: 0, listItems: 0 },
    });
    
    const result = checkDataCompleteness(sourceData, cloneData);
    
    expect(result.textComplete).toBe(false);
    expect(result.missingItems.length).toBeGreaterThan(0);
  });

  it('detects missing images', () => {
    const sourceData = createMockExtractedData({
      images: [
        { src: 'https://example.com/img1.png', alt: 'Image 1' },
        { src: 'https://example.com/img2.png', alt: 'Image 2' },
      ],
      itemCounts: { text: 0, images: 2, links: 0, listItems: 0 },
    });
    const cloneData = createMockExtractedData({
      images: [{ src: 'https://example.com/img1.png', alt: 'Image 1' }],
      itemCounts: { text: 0, images: 1, links: 0, listItems: 0 },
    });
    
    const result = checkDataCompleteness(sourceData, cloneData);
    
    expect(result.imagesComplete).toBe(false);
  });

  it('detects missing links', () => {
    const sourceData = createMockExtractedData({
      links: [
        { href: '/page1', text: 'Page 1', type: 'internal', attributes: {} },
        { href: '/page2', text: 'Page 2', type: 'internal', attributes: {} },
      ],
      itemCounts: { text: 0, images: 0, links: 2, listItems: 0 },
    });
    const cloneData = createMockExtractedData({
      links: [{ href: '/page1', text: 'Page 1', type: 'internal', attributes: {} }],
      itemCounts: { text: 0, images: 0, links: 1, listItems: 0 },
    });
    
    const result = checkDataCompleteness(sourceData, cloneData);
    
    expect(result.linksComplete).toBe(false);
  });

  it('reports item count comparison', () => {
    const sourceData = createMockExtractedData();
    const cloneData = createMockExtractedData();
    
    const result = checkDataCompleteness(sourceData, cloneData);
    
    expect(result.itemCounts.source).toBeDefined();
    expect(result.itemCounts.clone).toBeDefined();
    expect(result.itemCounts.source.text).toBe(sourceData.itemCounts.text);
    expect(result.itemCounts.clone.text).toBe(cloneData.itemCounts.text);
  });
});

// =============================================================================
// checkLinkIntegrity Tests - Requirements 7.1, 7.2, 7.3, 10.3
// =============================================================================

describe('checkLinkIntegrity', () => {
  it('passes for valid links with security attributes', () => {
    const links: LinkData[] = [
      { href: '/', text: 'Home', type: 'internal', attributes: {} },
      { href: 'https://external.com', text: 'External', type: 'external', attributes: { target: '_blank', rel: 'noopener noreferrer' } },
      { href: '#section', text: 'Section', type: 'anchor', attributes: {} },
    ];
    
    const result = checkLinkIntegrity(links, 'https://example.com');
    
    expect(result.passed).toBe(true);
    expect(result.validLinks).toBe(3);
    expect(result.invalidLinks).toHaveLength(0);
  });

  it('detects empty href', () => {
    const links: LinkData[] = [
      { href: '', text: 'Empty', type: 'internal', attributes: {} },
    ];
    
    const result = checkLinkIntegrity(links, 'https://example.com');
    
    expect(result.passed).toBe(false);
    expect(result.invalidLinks.length).toBe(1);
    expect(result.invalidLinks[0].reason).toContain('Empty');
  });

  it('detects javascript: links', () => {
    const links: LinkData[] = [
      { href: 'javascript:void(0)', text: 'JS Link', type: 'internal', attributes: {} },
    ];
    
    const result = checkLinkIntegrity(links, 'https://example.com');
    
    expect(result.passed).toBe(false);
    expect(result.invalidLinks[0].reason).toContain('JavaScript');
  });

  it('detects missing security attributes on external links', () => {
    const links: LinkData[] = [
      { href: 'https://external.com', text: 'External', type: 'external', attributes: {} },
    ];
    
    const result = checkLinkIntegrity(links, 'https://example.com');
    
    expect(result.passed).toBe(false);
    expect(result.missingSecurityAttributes).toContain('https://external.com');
  });

  it('validates external link URL format', () => {
    const links: LinkData[] = [
      { href: 'not-a-valid-url', text: 'Invalid', type: 'external', attributes: { target: '_blank', rel: 'noopener noreferrer' } },
    ];
    
    const result = checkLinkIntegrity(links, 'https://example.com');
    
    expect(result.invalidLinks.length).toBeGreaterThan(0);
  });

  it('reports total and valid link counts', () => {
    const links: LinkData[] = [
      { href: '/', text: 'Home', type: 'internal', attributes: {} },
      { href: '/about', text: 'About', type: 'internal', attributes: {} },
    ];
    
    const result = checkLinkIntegrity(links, 'https://example.com');
    
    expect(result.totalLinks).toBe(2);
    expect(result.validLinks).toBe(2);
  });
});


// =============================================================================
// runQAChecklist Tests - Requirements 10.1-10.9
// =============================================================================

describe('runQAChecklist', () => {
  it('returns all QA checks as passed when everything is valid', () => {
    const sourceData = createMockExtractedData();
    const cloneData = createMockExtractedData();
    
    const result = runQAChecklist({
      sourceData,
      cloneData,
      consoleMessages: [],
      diagnostics: [],
      testResults: { passed: true, failures: [] },
    });
    
    expect(result.textContentMatch).toBe(true);
    expect(result.imagesDisplayed).toBe(true);
    expect(result.linksWorking).toBe(true);
    expect(result.noConsoleErrors).toBe(true);
    expect(result.typescriptClean).toBe(true);
    expect(result.testsPass).toBe(true);
  });

  it('detects console errors', () => {
    const result = runQAChecklist({
      consoleMessages: [
        { level: 'error', text: 'Uncaught TypeError' },
        { level: 'warning', text: 'Deprecation warning' },
      ],
    });
    
    expect(result.noConsoleErrors).toBe(false);
    expect(result.deviations).toContain('1 console errors found');
  });

  it('detects TypeScript diagnostics', () => {
    const result = runQAChecklist({
      diagnostics: [
        { file: 'page.tsx', message: 'Type error' },
      ],
    });
    
    expect(result.typescriptClean).toBe(false);
    expect(result.deviations).toContain('1 TypeScript/lint errors found');
  });

  it('detects test failures', () => {
    const result = runQAChecklist({
      testResults: { passed: false, failures: ['test1', 'test2'] },
    });
    
    expect(result.testsPass).toBe(false);
    expect(result.deviations).toContain('2 test failures');
  });

  it('uses provided responsive checks', () => {
    const result = runQAChecklist({
      responsiveChecks: { mobile: false, tablet: true, desktop: true },
    });
    
    expect(result.responsiveDesign.mobile).toBe(false);
    expect(result.responsiveDesign.tablet).toBe(true);
    expect(result.responsiveDesign.desktop).toBe(true);
  });

  it('defaults responsive checks to true', () => {
    const result = runQAChecklist({});
    
    expect(result.responsiveDesign.mobile).toBe(true);
    expect(result.responsiveDesign.tablet).toBe(true);
    expect(result.responsiveDesign.desktop).toBe(true);
  });

  it('records deviations for incomplete data', () => {
    const sourceData = createMockExtractedData({
      itemCounts: { text: 10, images: 5, links: 3, listItems: 0 },
    });
    const cloneData = createMockExtractedData({
      itemCounts: { text: 5, images: 2, links: 1, listItems: 0 },
    });
    
    const result = runQAChecklist({ sourceData, cloneData });
    
    expect(result.textContentMatch).toBe(false);
    expect(result.imagesDisplayed).toBe(false);
    expect(result.deviations.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// verifyClone Tests - Requirements 17.1-17.7
// =============================================================================

describe('verifyClone', () => {
  it('returns passed when snapshots match', () => {
    const result = verifyClone(
      SOURCE_SNAPSHOT,
      MATCHING_CLONE_SNAPSHOT,
      undefined,
      undefined,
      undefined,
      undefined,
      1,
      { testResults: { passed: true, failures: [] } }
    );
    
    expect(result.passed).toBe(true);
    expect(result.attemptNumber).toBe(1);
    expect(result.fixSuggestions).toHaveLength(0);
  });

  it('returns failed with fix suggestions when snapshots differ', () => {
    const result = verifyClone(
      SOURCE_SNAPSHOT,
      MISSING_CONTENT_SNAPSHOT,
      undefined,
      undefined,
      undefined,
      undefined,
      1
    );
    
    expect(result.passed).toBe(false);
    expect(result.fixSuggestions.length).toBeGreaterThan(0);
  });

  it('allows retry when under max attempts', () => {
    const result = verifyClone(
      SOURCE_SNAPSHOT,
      MISSING_CONTENT_SNAPSHOT,
      undefined,
      undefined,
      undefined,
      undefined,
      1
    );
    
    expect(result.canRetry).toBe(true);
  });

  it('disallows retry at max attempts', () => {
    const result = verifyClone(
      SOURCE_SNAPSHOT,
      MISSING_CONTENT_SNAPSHOT,
      undefined,
      undefined,
      undefined,
      undefined,
      MAX_VERIFICATION_ATTEMPTS
    );
    
    expect(result.canRetry).toBe(false);
  });

  it('tracks attempt number', () => {
    const result1 = verifyClone(SOURCE_SNAPSHOT, MISSING_CONTENT_SNAPSHOT, undefined, undefined, undefined, undefined, 1);
    const result2 = verifyClone(SOURCE_SNAPSHOT, MISSING_CONTENT_SNAPSHOT, undefined, undefined, undefined, undefined, 2);
    const result3 = verifyClone(SOURCE_SNAPSHOT, MISSING_CONTENT_SNAPSHOT, undefined, undefined, undefined, undefined, 3);
    
    expect(result1.attemptNumber).toBe(1);
    expect(result2.attemptNumber).toBe(2);
    expect(result3.attemptNumber).toBe(3);
  });

  it('includes timestamp', () => {
    const result = verifyClone(SOURCE_SNAPSHOT, MATCHING_CLONE_SNAPSHOT);
    
    expect(result.timestamp).toBeDefined();
    expect(new Date(result.timestamp).getTime()).not.toBeNaN();
  });

  it('includes snapshot comparison in result', () => {
    const result = verifyClone(SOURCE_SNAPSHOT, MATCHING_CLONE_SNAPSHOT);
    
    expect(result.snapshotComparison).toBeDefined();
    expect(result.snapshotComparison?.score).toBeDefined();
  });

  it('includes QA result', () => {
    const result = verifyClone(SOURCE_SNAPSHOT, MATCHING_CLONE_SNAPSHOT);
    
    expect(result.qaResult).toBeDefined();
    expect(result.qaResult.textContentMatch).toBeDefined();
    expect(result.qaResult.responsiveDesign).toBeDefined();
  });
});

// =============================================================================
// createVerificationSummary Tests
// =============================================================================

describe('createVerificationSummary', () => {
  it('creates summary for passed verification', () => {
    const result: VerificationResult = {
      passed: true,
      qaResult: {
        textContentMatch: true,
        imagesDisplayed: true,
        linksWorking: true,
        responsiveDesign: { mobile: true, tablet: true, desktop: true },
        keyboardNavigation: true,
        noConsoleErrors: true,
        typescriptClean: true,
        testsPass: true,
        deviations: [],
      },
      snapshotComparison: {
        isMatch: true,
        differences: [],
        score: 100,
        stats: { totalSourceElements: 10, totalCloneElements: 10, matchedElements: 10, missingElements: 0, extraElements: 0 },
      },
      attemptNumber: 1,
      canRetry: false,
      fixSuggestions: [],
      timestamp: new Date().toISOString(),
    };
    
    const summary = createVerificationSummary(result);
    
    expect(summary).toContain('PASSED');
    expect(summary).toContain('100%');
  });

  it('creates summary for failed verification', () => {
    const result: VerificationResult = {
      passed: false,
      qaResult: {
        textContentMatch: false,
        imagesDisplayed: true,
        linksWorking: true,
        responsiveDesign: { mobile: true, tablet: true, desktop: true },
        keyboardNavigation: true,
        noConsoleErrors: false,
        typescriptClean: true,
        testsPass: true,
        deviations: ['Text content incomplete'],
      },
      snapshotComparison: {
        isMatch: false,
        differences: [{ type: 'missing_text', location: 'main', expected: 'text', actual: 'none', severity: 'major' }],
        score: 80,
        stats: { totalSourceElements: 10, totalCloneElements: 8, matchedElements: 8, missingElements: 2, extraElements: 0 },
      },
      attemptNumber: 1,
      canRetry: true,
      fixSuggestions: ['Add missing text content'],
      timestamp: new Date().toISOString(),
    };
    
    const summary = createVerificationSummary(result);
    
    expect(summary).toContain('FAILED');
    expect(summary).toContain('80%');
    expect(summary).toContain('Fix Suggestions');
    expect(summary).toContain('Can retry: Yes');
  });

  it('shows remaining attempts', () => {
    const result: VerificationResult = {
      passed: false,
      qaResult: {
        textContentMatch: true,
        imagesDisplayed: true,
        linksWorking: true,
        responsiveDesign: { mobile: true, tablet: true, desktop: true },
        keyboardNavigation: true,
        noConsoleErrors: true,
        typescriptClean: true,
        testsPass: true,
        deviations: [],
      },
      attemptNumber: 2,
      canRetry: true,
      fixSuggestions: ['Fix something'],
      timestamp: new Date().toISOString(),
    };
    
    const summary = createVerificationSummary(result);
    
    expect(summary).toContain('Attempt: 2/3');
    expect(summary).toContain('1 attempts remaining');
  });
});
