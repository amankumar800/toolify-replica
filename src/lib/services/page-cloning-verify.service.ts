/**
 * Page Cloning Agent - Verification Service
 * 
 * Provides functions to verify cloned pages against source pages,
 * comparing snapshots, checking visual parity, data completeness,
 * and link integrity. Implements iterative refinement loop.
 * 
 * @module page-cloning-verify.service
 * @requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7
 */

import type {
  PageAnalysis,
  ExtractedData,
  LinkData,
  QAResult,
  ResponsiveDesignResult,
  Section,
  TextBlock,
  ImageData,
} from '../types/page-cloning';
import { parseSnapshot, type SnapshotNode } from './page-cloning-analyze.service';

// =============================================================================
// Types
// =============================================================================

/** Maximum number of verification attempts before asking user */
export const MAX_VERIFICATION_ATTEMPTS = 3;

/** Types of differences that can be found between source and clone */
export type DifferenceType =
  | 'missing_section'
  | 'extra_section'
  | 'missing_text'
  | 'text_mismatch'
  | 'missing_link'
  | 'link_mismatch'
  | 'missing_image'
  | 'order_mismatch'
  | 'attribute_mismatch'
  | 'missing_element';

/** Severity levels for differences */
export type DifferenceSeverity = 'critical' | 'major' | 'minor';

/**
 * Represents a single difference between source and clone
 */
export interface SnapshotDifference {
  /** Type of difference */
  type: DifferenceType;
  /** Location description (selector or human-readable) */
  location: string;
  /** Expected value from source */
  expected: string;
  /** Actual value in clone */
  actual: string;
  /** Severity of the difference */
  severity: DifferenceSeverity;
}

/**
 * Result of comparing two snapshots
 */
export interface SnapshotComparison {
  /** Whether snapshots match */
  isMatch: boolean;
  /** List of differences found */
  differences: SnapshotDifference[];
  /** Match score (0-100) */
  score: number;
  /** Summary statistics */
  stats: {
    totalSourceElements: number;
    totalCloneElements: number;
    matchedElements: number;
    missingElements: number;
    extraElements: number;
  };
}


/**
 * Result of visual parity check
 */
export interface VisualParityResult {
  /** Whether visual parity is achieved */
  passed: boolean;
  /** Section order matches */
  sectionOrderMatch: boolean;
  /** Typography structure matches (heading levels, etc.) */
  typographyMatch: boolean;
  /** Interactive elements present */
  interactiveElementsMatch: boolean;
  /** List of visual differences */
  differences: SnapshotDifference[];
}

/**
 * Result of data completeness check
 */
export interface DataCompletenessResult {
  /** Whether all data is complete */
  passed: boolean;
  /** Text content completeness */
  textComplete: boolean;
  /** Images completeness */
  imagesComplete: boolean;
  /** Links completeness */
  linksComplete: boolean;
  /** Item count comparison */
  itemCounts: {
    source: { text: number; images: number; links: number };
    clone: { text: number; images: number; links: number };
  };
  /** Missing items */
  missingItems: string[];
}

/**
 * Result of link integrity check
 */
export interface LinkIntegrityResult {
  /** Whether all links are valid */
  passed: boolean;
  /** Total links checked */
  totalLinks: number;
  /** Valid links count */
  validLinks: number;
  /** Invalid links with reasons */
  invalidLinks: Array<{
    href: string;
    reason: string;
  }>;
  /** Links missing security attributes */
  missingSecurityAttributes: string[];
}

/**
 * Parameters for QA checklist
 */
export interface QAChecklistParams {
  /** Source page analysis */
  sourceAnalysis?: PageAnalysis;
  /** Clone page analysis */
  cloneAnalysis?: PageAnalysis;
  /** Source extracted data */
  sourceData?: ExtractedData;
  /** Clone extracted data */
  cloneData?: ExtractedData;
  /** Console messages from clone */
  consoleMessages?: Array<{ level: string; text: string }>;
  /** TypeScript diagnostics */
  diagnostics?: Array<{ file: string; message: string }>;
  /** Test results */
  testResults?: { passed: boolean; failures: string[] };
  /** Files to check for responsive design */
  responsiveChecks?: ResponsiveDesignResult;
}

/**
 * Overall verification result
 */
export interface VerificationResult {
  /** Whether verification passed */
  passed: boolean;
  /** Full QA result */
  qaResult: QAResult;
  /** Snapshot comparison result */
  snapshotComparison?: SnapshotComparison;
  /** Current attempt number */
  attemptNumber: number;
  /** Whether retry is allowed */
  canRetry: boolean;
  /** Suggestions for fixing issues */
  fixSuggestions: string[];
  /** Timestamp of verification */
  timestamp: string;
}

// =============================================================================
// Snapshot Comparison
// =============================================================================

/**
 * Extracts text content from snapshot nodes recursively
 */
function extractTextFromNodes(nodes: SnapshotNode[]): string[] {
  const texts: string[] = [];

  function traverse(node: SnapshotNode): void {
    if (node.name && node.name.trim()) {
      texts.push(node.name.trim());
    }
    for (const child of node.children) {
      traverse(child);
    }
  }

  for (const node of nodes) {
    traverse(node);
  }

  return texts;
}

/**
 * Extracts links from snapshot nodes recursively
 */
function extractLinksFromNodes(nodes: SnapshotNode[]): Array<{ href: string; text: string }> {
  const links: Array<{ href: string; text: string }> = [];

  function traverse(node: SnapshotNode): void {
    if (node.role === 'link' && node.attributes.href) {
      links.push({
        href: node.attributes.href,
        text: node.name || '',
      });
    }
    for (const child of node.children) {
      traverse(child);
    }
  }

  for (const node of nodes) {
    traverse(node);
  }

  return links;
}

/**
 * Counts elements by role in snapshot nodes
 */
function countElementsByRole(nodes: SnapshotNode[]): Record<string, number> {
  const counts: Record<string, number> = {};

  function traverse(node: SnapshotNode): void {
    counts[node.role] = (counts[node.role] || 0) + 1;
    for (const child of node.children) {
      traverse(child);
    }
  }

  for (const node of nodes) {
    traverse(node);
  }

  return counts;
}

/**
 * Counts total elements in snapshot nodes
 */
function countTotalElements(nodes: SnapshotNode[]): number {
  let count = 0;

  function traverse(node: SnapshotNode): void {
    count++;
    for (const child of node.children) {
      traverse(child);
    }
  }

  for (const node of nodes) {
    traverse(node);
  }

  return count;
}


/**
 * Compares two Playwright accessibility snapshots
 * 
 * @param sourceSnapshot - Raw snapshot from source page
 * @param cloneSnapshot - Raw snapshot from clone page
 * @returns Comparison result with differences
 * 
 * @requirements 17.2
 */
export function compareSnapshots(
  sourceSnapshot: string,
  cloneSnapshot: string
): SnapshotComparison {
  const sourceNodes = parseSnapshot(sourceSnapshot);
  const cloneNodes = parseSnapshot(cloneSnapshot);

  return compareSnapshotNodes(sourceNodes, cloneNodes);
}

/**
 * Compares parsed snapshot nodes
 * 
 * @param sourceNodes - Parsed nodes from source
 * @param cloneNodes - Parsed nodes from clone
 * @returns Comparison result
 */
export function compareSnapshotNodes(
  sourceNodes: SnapshotNode[],
  cloneNodes: SnapshotNode[]
): SnapshotComparison {
  const differences: SnapshotDifference[] = [];

  // Count elements
  const sourceTotal = countTotalElements(sourceNodes);
  const cloneTotal = countTotalElements(cloneNodes);

  // Compare element counts by role
  const sourceRoleCounts = countElementsByRole(sourceNodes);
  const cloneRoleCounts = countElementsByRole(cloneNodes);

  // Check for missing roles
  for (const [role, count] of Object.entries(sourceRoleCounts)) {
    const cloneCount = cloneRoleCounts[role] || 0;
    if (cloneCount < count) {
      differences.push({
        type: 'missing_element',
        location: `role="${role}"`,
        expected: `${count} elements`,
        actual: `${cloneCount} elements`,
        severity: role === 'main' || role === 'heading' ? 'critical' : 'major',
      });
    }
  }

  // Compare text content
  const sourceTexts = extractTextFromNodes(sourceNodes);
  const cloneTexts = extractTextFromNodes(cloneNodes);
  const cloneTextSet = new Set(cloneTexts.map(t => t.toLowerCase()));

  for (const text of sourceTexts) {
    if (text.length > 3 && !cloneTextSet.has(text.toLowerCase())) {
      // Check for partial match
      const hasPartialMatch = cloneTexts.some(ct => 
        ct.toLowerCase().includes(text.toLowerCase()) ||
        text.toLowerCase().includes(ct.toLowerCase())
      );

      if (!hasPartialMatch) {
        differences.push({
          type: 'missing_text',
          location: 'text content',
          expected: text.slice(0, 100) + (text.length > 100 ? '...' : ''),
          actual: 'not found',
          severity: 'major',
        });
      }
    }
  }

  // Compare links
  const sourceLinks = extractLinksFromNodes(sourceNodes);
  const cloneLinks = extractLinksFromNodes(cloneNodes);
  const cloneLinkHrefs = new Set(cloneLinks.map(l => l.href));

  for (const link of sourceLinks) {
    if (!cloneLinkHrefs.has(link.href)) {
      differences.push({
        type: 'missing_link',
        location: `link to "${link.href}"`,
        expected: link.href,
        actual: 'not found',
        severity: 'major',
      });
    }
  }

  // Calculate match score
  const matchedElements = Math.min(sourceTotal, cloneTotal) - differences.length;
  const score = sourceTotal > 0 
    ? Math.max(0, Math.round((matchedElements / sourceTotal) * 100))
    : 100;

  return {
    isMatch: differences.length === 0,
    differences,
    score,
    stats: {
      totalSourceElements: sourceTotal,
      totalCloneElements: cloneTotal,
      matchedElements: Math.max(0, matchedElements),
      missingElements: Math.max(0, sourceTotal - cloneTotal),
      extraElements: Math.max(0, cloneTotal - sourceTotal),
    },
  };
}

// =============================================================================
// Visual Parity Check
// =============================================================================

/**
 * Compares section order between source and clone
 */
function compareSectionOrder(
  sourceSections: Section[],
  cloneSections: Section[]
): { match: boolean; differences: SnapshotDifference[] } {
  const differences: SnapshotDifference[] = [];

  const sourceTypes = sourceSections.map(s => s.type);
  const cloneTypes = cloneSections.map(s => s.type);

  // Check if sections appear in same order
  let sourceIdx = 0;
  let cloneIdx = 0;

  while (sourceIdx < sourceTypes.length && cloneIdx < cloneTypes.length) {
    if (sourceTypes[sourceIdx] === cloneTypes[cloneIdx]) {
      sourceIdx++;
      cloneIdx++;
    } else {
      // Check if source section exists later in clone
      const foundLater = cloneTypes.slice(cloneIdx).indexOf(sourceTypes[sourceIdx]);
      if (foundLater === -1) {
        differences.push({
          type: 'missing_section',
          location: `section ${sourceIdx + 1}`,
          expected: sourceTypes[sourceIdx],
          actual: 'not found',
          severity: 'critical',
        });
        sourceIdx++;
      } else {
        differences.push({
          type: 'order_mismatch',
          location: `section ${sourceIdx + 1}`,
          expected: `${sourceTypes[sourceIdx]} at position ${sourceIdx + 1}`,
          actual: `found at position ${cloneIdx + foundLater + 1}`,
          severity: 'major',
        });
        sourceIdx++;
        cloneIdx = cloneIdx + foundLater + 1;
      }
    }
  }

  // Check for remaining source sections
  while (sourceIdx < sourceTypes.length) {
    differences.push({
      type: 'missing_section',
      location: `section ${sourceIdx + 1}`,
      expected: sourceTypes[sourceIdx],
      actual: 'not found',
      severity: 'critical',
    });
    sourceIdx++;
  }

  return {
    match: differences.length === 0,
    differences,
  };
}


/**
 * Checks visual parity between source and clone page analyses
 * 
 * @param sourceAnalysis - Analysis of source page
 * @param cloneAnalysis - Analysis of clone page
 * @returns Visual parity result
 * 
 * @requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */
export function checkVisualParity(
  sourceAnalysis: PageAnalysis,
  cloneAnalysis: PageAnalysis
): VisualParityResult {
  const differences: SnapshotDifference[] = [];

  // Check section order (Req 6.2)
  const sectionComparison = compareSectionOrder(
    sourceAnalysis.sections,
    cloneAnalysis.sections
  );
  differences.push(...sectionComparison.differences);

  // Check interactive elements (Req 6.5)
  const sourceInteractiveTypes = new Set(
    sourceAnalysis.interactiveElements.map(e => e.type)
  );
  const cloneInteractiveTypes = new Set(
    cloneAnalysis.interactiveElements.map(e => e.type)
  );

  for (const type of sourceInteractiveTypes) {
    if (!cloneInteractiveTypes.has(type)) {
      differences.push({
        type: 'missing_element',
        location: `interactive element type`,
        expected: type,
        actual: 'not found',
        severity: 'major',
      });
    }
  }

  // Check interactive element counts
  const sourceInteractiveCounts: Record<string, number> = {};
  const cloneInteractiveCounts: Record<string, number> = {};

  for (const el of sourceAnalysis.interactiveElements) {
    sourceInteractiveCounts[el.type] = (sourceInteractiveCounts[el.type] || 0) + 1;
  }
  for (const el of cloneAnalysis.interactiveElements) {
    cloneInteractiveCounts[el.type] = (cloneInteractiveCounts[el.type] || 0) + 1;
  }

  for (const [type, count] of Object.entries(sourceInteractiveCounts)) {
    const cloneCount = cloneInteractiveCounts[type] || 0;
    if (cloneCount < count) {
      differences.push({
        type: 'missing_element',
        location: `${type} elements`,
        expected: `${count} ${type}(s)`,
        actual: `${cloneCount} ${type}(s)`,
        severity: 'major',
      });
    }
  }

  // Typography check - compare heading structure
  const sourceHeadings = sourceAnalysis.interactiveElements.filter(
    e => e.action.toLowerCase().includes('heading')
  );
  const cloneHeadings = cloneAnalysis.interactiveElements.filter(
    e => e.action.toLowerCase().includes('heading')
  );

  const typographyMatch = sourceHeadings.length <= cloneHeadings.length;

  return {
    passed: differences.length === 0,
    sectionOrderMatch: sectionComparison.match,
    typographyMatch,
    interactiveElementsMatch: sourceInteractiveTypes.size <= cloneInteractiveTypes.size,
    differences,
  };
}

// =============================================================================
// Data Completeness Check
// =============================================================================

/**
 * Checks data completeness between source and clone extracted data
 * 
 * @param sourceData - Extracted data from source
 * @param cloneData - Extracted data from clone
 * @returns Data completeness result
 * 
 * @requirements 10.1, 10.2, 12.1, 12.2, 12.3, 12.4, 12.5
 */
export function checkDataCompleteness(
  sourceData: ExtractedData,
  cloneData: ExtractedData
): DataCompletenessResult {
  const missingItems: string[] = [];

  // Compare text content
  const sourceTextSet = new Set(
    sourceData.textContent.map(t => t.content.toLowerCase().trim())
  );
  const cloneTextSet = new Set(
    cloneData.textContent.map(t => t.content.toLowerCase().trim())
  );

  for (const text of sourceTextSet) {
    if (text.length > 10 && !cloneTextSet.has(text)) {
      // Check for partial match
      const hasPartial = Array.from(cloneTextSet).some(
        ct => ct.includes(text) || text.includes(ct)
      );
      if (!hasPartial) {
        missingItems.push(`Text: "${text.slice(0, 50)}..."`);
      }
    }
  }

  // Compare images
  const sourceImageSrcs = new Set(sourceData.images.map(i => i.src));
  const cloneImageSrcs = new Set(cloneData.images.map(i => i.src));

  for (const src of sourceImageSrcs) {
    if (!cloneImageSrcs.has(src)) {
      missingItems.push(`Image: ${src}`);
    }
  }

  // Compare links
  const sourceLinkHrefs = new Set(sourceData.links.map(l => l.href));
  const cloneLinkHrefs = new Set(cloneData.links.map(l => l.href));

  for (const href of sourceLinkHrefs) {
    if (!cloneLinkHrefs.has(href)) {
      missingItems.push(`Link: ${href}`);
    }
  }

  const textComplete = sourceData.itemCounts.text <= cloneData.itemCounts.text;
  const imagesComplete = sourceData.itemCounts.images <= cloneData.itemCounts.images;
  const linksComplete = sourceData.itemCounts.links <= cloneData.itemCounts.links;

  return {
    passed: missingItems.length === 0 && textComplete && imagesComplete && linksComplete,
    textComplete,
    imagesComplete,
    linksComplete,
    itemCounts: {
      source: {
        text: sourceData.itemCounts.text,
        images: sourceData.itemCounts.images,
        links: sourceData.itemCounts.links,
      },
      clone: {
        text: cloneData.itemCounts.text,
        images: cloneData.itemCounts.images,
        links: cloneData.itemCounts.links,
      },
    },
    missingItems,
  };
}

// =============================================================================
// Link Integrity Check
// =============================================================================

/**
 * Checks link integrity for a list of links
 * 
 * @param links - Links to check
 * @param baseUrl - Base URL for resolving relative links
 * @returns Link integrity result
 * 
 * @requirements 7.1, 7.2, 7.3, 7.4, 10.3
 */
export function checkLinkIntegrity(
  links: LinkData[],
  baseUrl: string
): LinkIntegrityResult {
  const invalidLinks: Array<{ href: string; reason: string }> = [];
  const missingSecurityAttributes: string[] = [];

  for (const link of links) {
    // Check for empty href
    if (!link.href || link.href.trim() === '') {
      invalidLinks.push({
        href: link.href || '(empty)',
        reason: 'Empty href attribute',
      });
      continue;
    }

    // Check for javascript: links (should be avoided)
    if (link.href.startsWith('javascript:')) {
      invalidLinks.push({
        href: link.href,
        reason: 'JavaScript href should be avoided',
      });
      continue;
    }

    // Check external links for security attributes
    if (link.type === 'external') {
      const hasTarget = link.attributes.target === '_blank';
      const hasRel = link.attributes.rel?.includes('noopener') && 
                     link.attributes.rel?.includes('noreferrer');

      if (!hasTarget || !hasRel) {
        missingSecurityAttributes.push(link.href);
      }
    }

    // Validate URL format for external links
    if (link.type === 'external') {
      try {
        new URL(link.href);
      } catch {
        invalidLinks.push({
          href: link.href,
          reason: 'Invalid URL format',
        });
      }
    }

    // Validate internal links format
    if (link.type === 'internal') {
      // Internal links should start with / or be relative
      if (link.href.startsWith('http') && !link.href.startsWith(baseUrl)) {
        invalidLinks.push({
          href: link.href,
          reason: 'Internal link has external URL',
        });
      }
    }

    // Validate anchor links
    if (link.type === 'anchor') {
      if (!link.href.startsWith('#')) {
        invalidLinks.push({
          href: link.href,
          reason: 'Anchor link should start with #',
        });
      }
    }
  }

  return {
    passed: invalidLinks.length === 0 && missingSecurityAttributes.length === 0,
    totalLinks: links.length,
    validLinks: links.length - invalidLinks.length,
    invalidLinks,
    missingSecurityAttributes,
  };
}


// =============================================================================
// QA Checklist
// =============================================================================

/**
 * Runs the full QA checklist for a cloned page
 * 
 * @param params - QA checklist parameters
 * @returns QA result
 * 
 * @requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9
 */
export function runQAChecklist(params: QAChecklistParams): QAResult {
  const {
    sourceAnalysis,
    cloneAnalysis,
    sourceData,
    cloneData,
    consoleMessages = [],
    diagnostics = [],
    testResults,
    responsiveChecks,
  } = params;

  const deviations: string[] = [];

  // 10.1: Text content match
  let textContentMatch = true;
  if (sourceData && cloneData) {
    const dataCompleteness = checkDataCompleteness(sourceData, cloneData);
    textContentMatch = dataCompleteness.textComplete;
    if (!textContentMatch) {
      deviations.push(`Text content incomplete: ${dataCompleteness.missingItems.length} items missing`);
    }
  }

  // 10.2: Images displayed
  let imagesDisplayed = true;
  if (sourceData && cloneData) {
    imagesDisplayed = sourceData.itemCounts.images <= cloneData.itemCounts.images;
    if (!imagesDisplayed) {
      deviations.push(
        `Images incomplete: ${sourceData.itemCounts.images - cloneData.itemCounts.images} images missing`
      );
    }
  }

  // 10.3: Links working
  let linksWorking = true;
  if (cloneData) {
    const linkIntegrity = checkLinkIntegrity(cloneData.links, '');
    linksWorking = linkIntegrity.passed;
    if (!linksWorking) {
      deviations.push(`${linkIntegrity.invalidLinks.length} invalid links found`);
    }
  }

  // 10.4: Responsive design
  const responsiveDesign: ResponsiveDesignResult = responsiveChecks || {
    mobile: true,
    tablet: true,
    desktop: true,
  };

  // 10.5: Keyboard navigation (assumed true if interactive elements match)
  let keyboardNavigation = true;
  if (sourceAnalysis && cloneAnalysis) {
    const visualParity = checkVisualParity(sourceAnalysis, cloneAnalysis);
    keyboardNavigation = visualParity.interactiveElementsMatch;
    if (!keyboardNavigation) {
      deviations.push('Interactive elements mismatch - keyboard navigation may be affected');
    }
  }

  // 10.6: No console errors
  const errorMessages = consoleMessages.filter(m => m.level === 'error');
  const noConsoleErrors = errorMessages.length === 0;
  if (!noConsoleErrors) {
    deviations.push(`${errorMessages.length} console errors found`);
  }

  // 10.7: TypeScript clean
  const typescriptClean = diagnostics.length === 0;
  if (!typescriptClean) {
    deviations.push(`${diagnostics.length} TypeScript/lint errors found`);
  }

  // 10.8: Tests pass
  const testsPass = testResults?.passed ?? true;
  if (!testsPass && testResults?.failures) {
    deviations.push(`${testResults.failures.length} test failures`);
  }

  return {
    textContentMatch,
    imagesDisplayed,
    linksWorking,
    responsiveDesign,
    keyboardNavigation,
    noConsoleErrors,
    typescriptClean,
    testsPass,
    deviations,
  };
}

// =============================================================================
// Main Verification Function
// =============================================================================

/**
 * Generates fix suggestions based on differences found
 */
function generateFixSuggestions(
  differences: SnapshotDifference[],
  qaResult: QAResult
): string[] {
  const suggestions: string[] = [];

  // Group differences by type
  const byType: Record<string, SnapshotDifference[]> = {};
  for (const diff of differences) {
    byType[diff.type] = byType[diff.type] || [];
    byType[diff.type].push(diff);
  }

  // Generate suggestions based on difference types
  if (byType.missing_section?.length) {
    suggestions.push(
      `Add missing sections: ${byType.missing_section.map(d => d.expected).join(', ')}`
    );
  }

  if (byType.missing_text?.length) {
    suggestions.push(
      `Add missing text content (${byType.missing_text.length} blocks)`
    );
  }

  if (byType.missing_link?.length) {
    suggestions.push(
      `Add missing links (${byType.missing_link.length} links)`
    );
  }

  if (byType.missing_image?.length) {
    suggestions.push(
      `Add missing images (${byType.missing_image.length} images)`
    );
  }

  if (byType.order_mismatch?.length) {
    suggestions.push('Reorder sections to match source page layout');
  }

  if (byType.missing_element?.length) {
    suggestions.push(
      `Add missing interactive elements: ${byType.missing_element.map(d => d.expected).join(', ')}`
    );
  }

  // QA-based suggestions
  if (!qaResult.noConsoleErrors) {
    suggestions.push('Fix console errors in the clone page');
  }

  if (!qaResult.typescriptClean) {
    suggestions.push('Fix TypeScript/lint errors');
  }

  if (!qaResult.testsPass) {
    suggestions.push('Fix failing tests');
  }

  if (!qaResult.responsiveDesign.mobile) {
    suggestions.push('Fix mobile responsive layout');
  }

  if (!qaResult.responsiveDesign.tablet) {
    suggestions.push('Fix tablet responsive layout');
  }

  return suggestions;
}

/**
 * Verifies a cloned page against the source
 * 
 * This is the main entry point for verification. It orchestrates
 * all verification checks and implements the iterative refinement loop.
 * 
 * @param sourceSnapshot - Raw snapshot from source page
 * @param cloneSnapshot - Raw snapshot from clone page
 * @param sourceAnalysis - Analysis of source page (optional)
 * @param cloneAnalysis - Analysis of clone page (optional)
 * @param sourceData - Extracted data from source (optional)
 * @param cloneData - Extracted data from clone (optional)
 * @param attemptNumber - Current attempt number (1-based)
 * @param additionalParams - Additional QA parameters
 * @returns Verification result
 * 
 * @requirements 6.1, 6.7, 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7
 */
export function verifyClone(
  sourceSnapshot: string,
  cloneSnapshot: string,
  sourceAnalysis?: PageAnalysis,
  cloneAnalysis?: PageAnalysis,
  sourceData?: ExtractedData,
  cloneData?: ExtractedData,
  attemptNumber: number = 1,
  additionalParams?: Partial<QAChecklistParams>
): VerificationResult {
  // Compare snapshots
  const snapshotComparison = compareSnapshots(sourceSnapshot, cloneSnapshot);

  // Run QA checklist
  const qaResult = runQAChecklist({
    sourceAnalysis,
    cloneAnalysis,
    sourceData,
    cloneData,
    ...additionalParams,
  });

  // Determine if verification passed
  const passed = snapshotComparison.isMatch && 
    qaResult.textContentMatch &&
    qaResult.imagesDisplayed &&
    qaResult.linksWorking &&
    qaResult.noConsoleErrors &&
    qaResult.typescriptClean &&
    qaResult.testsPass;

  // Generate fix suggestions if not passed
  const fixSuggestions = passed 
    ? [] 
    : generateFixSuggestions(snapshotComparison.differences, qaResult);

  // Determine if retry is allowed (max 3 attempts per Req 17.6)
  const canRetry = !passed && attemptNumber < MAX_VERIFICATION_ATTEMPTS;

  return {
    passed,
    qaResult,
    snapshotComparison,
    attemptNumber,
    canRetry,
    fixSuggestions,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a verification summary for logging
 * 
 * @param result - Verification result
 * @returns Human-readable summary
 */
export function createVerificationSummary(result: VerificationResult): string {
  const lines: string[] = [
    '=== Verification Summary ===',
    `Status: ${result.passed ? 'PASSED ✓' : 'FAILED ✗'}`,
    `Attempt: ${result.attemptNumber}/${MAX_VERIFICATION_ATTEMPTS}`,
    '',
  ];

  if (result.snapshotComparison) {
    lines.push(
      `Snapshot Match Score: ${result.snapshotComparison.score}%`,
      `Elements: ${result.snapshotComparison.stats.matchedElements} matched, ` +
      `${result.snapshotComparison.stats.missingElements} missing, ` +
      `${result.snapshotComparison.stats.extraElements} extra`,
      ''
    );
  }

  lines.push(
    'QA Checklist:',
    `  Text Content: ${result.qaResult.textContentMatch ? '✓' : '✗'}`,
    `  Images: ${result.qaResult.imagesDisplayed ? '✓' : '✗'}`,
    `  Links: ${result.qaResult.linksWorking ? '✓' : '✗'}`,
    `  Responsive (Mobile): ${result.qaResult.responsiveDesign.mobile ? '✓' : '✗'}`,
    `  Responsive (Tablet): ${result.qaResult.responsiveDesign.tablet ? '✓' : '✗'}`,
    `  Responsive (Desktop): ${result.qaResult.responsiveDesign.desktop ? '✓' : '✗'}`,
    `  Keyboard Navigation: ${result.qaResult.keyboardNavigation ? '✓' : '✗'}`,
    `  No Console Errors: ${result.qaResult.noConsoleErrors ? '✓' : '✗'}`,
    `  TypeScript Clean: ${result.qaResult.typescriptClean ? '✓' : '✗'}`,
    `  Tests Pass: ${result.qaResult.testsPass ? '✓' : '✗'}`,
    ''
  );

  if (result.qaResult.deviations.length > 0) {
    lines.push('Deviations:', ...result.qaResult.deviations.map(d => `  - ${d}`), '');
  }

  if (result.fixSuggestions.length > 0) {
    lines.push('Fix Suggestions:', ...result.fixSuggestions.map(s => `  - ${s}`), '');
  }

  if (result.canRetry) {
    lines.push(`Can retry: Yes (${MAX_VERIFICATION_ATTEMPTS - result.attemptNumber} attempts remaining)`);
  } else if (!result.passed) {
    lines.push('Can retry: No (max attempts reached - user intervention required)');
  }

  lines.push('============================');

  return lines.join('\n');
}
