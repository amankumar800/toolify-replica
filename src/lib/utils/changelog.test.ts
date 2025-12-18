/**
 * Unit Tests for Changelog Management Utility
 * 
 * Tests changelog entry creation, reading, and formatting.
 * 
 * @see Requirements 26.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  formatDate,
  formatEntry,
  createInitialChangelog,
  parseEntry,
  readChangelog,
  addChangelogEntry,
  getLatestEntry,
  getEntriesByPageSlug,
  hasBeenCloned,
  type ChangelogEntry,
} from './changelog';

// =============================================================================
// Test Fixtures
// =============================================================================

const TEST_DIR = path.join(process.cwd(), '.test-temp-changelog');
const TEST_CHANGELOG_PATH = path.join(TEST_DIR, 'CHANGELOG.md');

const SAMPLE_ENTRY: ChangelogEntry = {
  date: '2025-12-15T10:00:00.000Z',
  sourceUrl: 'https://example.com/page',
  pageSlug: 'example-page',
  filesCreated: [
    'src/app/(site)/example-page/page.tsx',
    'src/components/features/example/ExampleComponent.tsx',
  ],
  filesModified: [
    'next.config.js',
  ],
  summary: 'Cloned the example page with all content and styling.',
  deviations: [
    'Replaced external font with system font for performance',
  ],
};

const SAMPLE_ENTRY_2: ChangelogEntry = {
  date: '2025-12-14T09:00:00.000Z',
  sourceUrl: 'https://example.com/another-page',
  pageSlug: 'another-page',
  filesCreated: [
    'src/app/(site)/another-page/page.tsx',
  ],
  filesModified: [],
  summary: 'Cloned another page.',
};

// =============================================================================
// Test Setup and Teardown
// =============================================================================

function setupTestDir(): void {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
}

function cleanupTestDir(): void {
  try {
    if (fs.existsSync(TEST_CHANGELOG_PATH)) {
      fs.unlinkSync(TEST_CHANGELOG_PATH);
    }
    if (fs.existsSync(TEST_DIR)) {
      fs.rmdirSync(TEST_DIR, { recursive: true });
    }
  } catch {
    // Ignore cleanup errors
  }
}

// =============================================================================
// Unit Tests
// =============================================================================

describe('Changelog Management', () => {
  beforeEach(() => {
    setupTestDir();
  });

  afterEach(() => {
    cleanupTestDir();
  });

  describe('formatDate', () => {
    it('should format ISO date to readable format', () => {
      const result = formatDate('2025-12-15T10:00:00.000Z');
      expect(result).toContain('December');
      expect(result).toContain('15');
      expect(result).toContain('2025');
    });

    it('should handle invalid date gracefully', () => {
      const result = formatDate('invalid-date');
      // Invalid dates return 'Invalid Date' from toLocaleDateString
      expect(result).toBe('Invalid Date');
    });
  });

  describe('formatEntry', () => {
    it('should format entry with all fields', () => {
      const result = formatEntry(SAMPLE_ENTRY);
      
      expect(result).toContain('[example-page]');
      expect(result).toContain('https://example.com/page');
      expect(result).toContain('### Summary');
      expect(result).toContain('Cloned the example page');
      expect(result).toContain('### Files Created');
      expect(result).toContain('`src/app/(site)/example-page/page.tsx`');
      expect(result).toContain('### Files Modified');
      expect(result).toContain('`next.config.js`');
      expect(result).toContain('### Deviations from Source');
      expect(result).toContain('Replaced external font');
      expect(result).toContain('---');
    });

    it('should omit empty sections', () => {
      const entryWithoutDeviations: ChangelogEntry = {
        ...SAMPLE_ENTRY,
        deviations: undefined,
        filesModified: [],
      };
      
      const result = formatEntry(entryWithoutDeviations);
      
      expect(result).not.toContain('### Deviations from Source');
      expect(result).not.toContain('### Files Modified');
    });
  });

  describe('createInitialChangelog', () => {
    it('should create changelog with header', () => {
      const result = createInitialChangelog();
      
      expect(result).toContain('# Page Cloning Agent - Changelog');
      expect(result).toContain('This changelog records all pages cloned');
      expect(result).toContain('---');
    });
  });

  describe('parseEntry', () => {
    it('should parse a formatted entry back to object', () => {
      const formatted = formatEntry(SAMPLE_ENTRY);
      const parsed = parseEntry(formatted);
      
      expect(parsed).not.toBeNull();
      expect(parsed!.pageSlug).toBe('example-page');
      expect(parsed!.sourceUrl).toBe('https://example.com/page');
      expect(parsed!.summary).toBe('Cloned the example page with all content and styling.');
      expect(parsed!.filesCreated).toContain('src/app/(site)/example-page/page.tsx');
      expect(parsed!.filesModified).toContain('next.config.js');
      expect(parsed!.deviations).toContain('Replaced external font with system font for performance');
    });

    it('should return null for invalid entry text', () => {
      const result = parseEntry('not a valid entry');
      expect(result).toBeNull();
    });
  });

  describe('addChangelogEntry', () => {
    it('should create new changelog file if not exists', () => {
      const result = addChangelogEntry(SAMPLE_ENTRY, TEST_CHANGELOG_PATH);
      
      expect(result.success).toBe(true);
      expect(fs.existsSync(TEST_CHANGELOG_PATH)).toBe(true);
      
      const content = fs.readFileSync(TEST_CHANGELOG_PATH, 'utf-8');
      expect(content).toContain('# Page Cloning Agent - Changelog');
      expect(content).toContain('[example-page]');
    });

    it('should add entry to existing changelog', () => {
      // Create initial changelog with first entry
      addChangelogEntry(SAMPLE_ENTRY_2, TEST_CHANGELOG_PATH);
      
      // Add second entry
      const result = addChangelogEntry(SAMPLE_ENTRY, TEST_CHANGELOG_PATH);
      
      expect(result.success).toBe(true);
      
      const content = fs.readFileSync(TEST_CHANGELOG_PATH, 'utf-8');
      expect(content).toContain('[example-page]');
      expect(content).toContain('[another-page]');
      
      // Newer entry should appear first
      const exampleIndex = content.indexOf('[example-page]');
      const anotherIndex = content.indexOf('[another-page]');
      expect(exampleIndex).toBeLessThan(anotherIndex);
    });
  });

  describe('readChangelog', () => {
    it('should return empty changelog if file does not exist', () => {
      const result = readChangelog(TEST_CHANGELOG_PATH);
      
      expect(result.entries).toHaveLength(0);
      expect(result.title).toBe('Page Cloning Agent - Changelog');
    });

    it('should parse existing changelog with entries', () => {
      addChangelogEntry(SAMPLE_ENTRY, TEST_CHANGELOG_PATH);
      addChangelogEntry(SAMPLE_ENTRY_2, TEST_CHANGELOG_PATH);
      
      const result = readChangelog(TEST_CHANGELOG_PATH);
      
      expect(result.entries.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getLatestEntry', () => {
    it('should return null if no entries exist', () => {
      const result = getLatestEntry(TEST_CHANGELOG_PATH);
      expect(result).toBeNull();
    });

    it('should return the most recent entry', () => {
      addChangelogEntry(SAMPLE_ENTRY_2, TEST_CHANGELOG_PATH);
      addChangelogEntry(SAMPLE_ENTRY, TEST_CHANGELOG_PATH);
      
      const result = getLatestEntry(TEST_CHANGELOG_PATH);
      
      expect(result).not.toBeNull();
      expect(result!.pageSlug).toBe('example-page');
    });
  });

  describe('getEntriesByPageSlug', () => {
    it('should return empty array if no matching entries', () => {
      addChangelogEntry(SAMPLE_ENTRY, TEST_CHANGELOG_PATH);
      
      const result = getEntriesByPageSlug('non-existent', TEST_CHANGELOG_PATH);
      
      expect(result).toHaveLength(0);
    });

    it('should return all entries for a page slug', () => {
      addChangelogEntry(SAMPLE_ENTRY, TEST_CHANGELOG_PATH);
      
      const result = getEntriesByPageSlug('example-page', TEST_CHANGELOG_PATH);
      
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].pageSlug).toBe('example-page');
    });
  });

  describe('hasBeenCloned', () => {
    it('should return false if page has not been cloned', () => {
      const result = hasBeenCloned('non-existent', TEST_CHANGELOG_PATH);
      expect(result).toBe(false);
    });

    it('should return true if page has been cloned', () => {
      addChangelogEntry(SAMPLE_ENTRY, TEST_CHANGELOG_PATH);
      
      const result = hasBeenCloned('example-page', TEST_CHANGELOG_PATH);
      expect(result).toBe(true);
    });
  });
});
