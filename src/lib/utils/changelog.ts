/**
 * Changelog Management Utility
 * 
 * Provides functions to manage the Page Cloning Agent changelog.
 * Records all cloned pages with timestamps, files created/modified, and summaries.
 * 
 * @module changelog
 * @see Requirements 26.3, 26.6
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Path to the changelog file
 */
export const CHANGELOG_PATH = '.kiro/specs/page-cloning-agent/CHANGELOG.md';

/**
 * Represents a single changelog entry for a cloned page
 */
export interface ChangelogEntry {
  /** ISO timestamp when the clone was completed */
  date: string;
  /** URL of the source page that was cloned */
  sourceUrl: string;
  /** Slug identifier for the cloned page */
  pageSlug: string;
  /** List of files created during the clone */
  filesCreated: string[];
  /** List of files modified during the clone */
  filesModified: string[];
  /** Summary of what was accomplished */
  summary: string;
  /** Any deviations from the source with justifications */
  deviations?: string[];
}

/**
 * Parsed changelog structure
 */
export interface Changelog {
  /** Title of the changelog */
  title: string;
  /** Description of the changelog */
  description: string;
  /** All changelog entries, newest first */
  entries: ChangelogEntry[];
}

/**
 * Result of adding a changelog entry
 */
export interface AddEntryResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Path to the changelog file */
  path: string;
  /** Error message if operation failed */
  error?: string;
}

/**
 * Formats a date string for display in the changelog
 * 
 * @param isoDate - ISO date string
 * @returns Formatted date string (e.g., "December 15, 2025")
 */
export function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

/**
 * Formats a changelog entry as markdown
 * 
 * @param entry - The changelog entry to format
 * @returns Markdown string representation of the entry
 */
export function formatEntry(entry: ChangelogEntry): string {
  const lines: string[] = [];
  
  // Header with date and page slug
  lines.push(`## [${entry.pageSlug}] - ${formatDate(entry.date)}`);
  lines.push('');
  
  // Source URL
  lines.push(`**Source:** ${entry.sourceUrl}`);
  lines.push('');
  
  // Summary
  lines.push(`### Summary`);
  lines.push('');
  lines.push(entry.summary);
  lines.push('');
  
  // Files created
  if (entry.filesCreated.length > 0) {
    lines.push(`### Files Created`);
    lines.push('');
    for (const file of entry.filesCreated) {
      lines.push(`- \`${file}\``);
    }
    lines.push('');
  }
  
  // Files modified
  if (entry.filesModified.length > 0) {
    lines.push(`### Files Modified`);
    lines.push('');
    for (const file of entry.filesModified) {
      lines.push(`- \`${file}\``);
    }
    lines.push('');
  }
  
  // Deviations
  if (entry.deviations && entry.deviations.length > 0) {
    lines.push(`### Deviations from Source`);
    lines.push('');
    for (const deviation of entry.deviations) {
      lines.push(`- ${deviation}`);
    }
    lines.push('');
  }
  
  lines.push('---');
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Creates the initial changelog file with header
 * 
 * @returns The initial changelog content
 */
export function createInitialChangelog(): string {
  const lines: string[] = [
    '# Page Cloning Agent - Changelog',
    '',
    'This changelog records all pages cloned by the Page Cloning Agent.',
    'Each entry includes the source URL, files created/modified, and a summary of the work.',
    '',
    '---',
    '',
  ];
  
  return lines.join('\n');
}

/**
 * Parses a changelog entry from markdown text
 * 
 * @param entryText - The markdown text of a single entry
 * @returns Parsed ChangelogEntry or null if parsing fails
 */
export function parseEntry(entryText: string): ChangelogEntry | null {
  try {
    // Extract page slug and date from header
    const headerMatch = entryText.match(/^## \[([^\]]+)\] - (.+)$/m);
    if (!headerMatch) return null;
    
    const pageSlug = headerMatch[1];
    const dateStr = headerMatch[2];
    
    // Extract source URL
    const sourceMatch = entryText.match(/\*\*Source:\*\* (.+)$/m);
    const sourceUrl = sourceMatch ? sourceMatch[1].trim() : '';
    
    // Extract summary (text after ### Summary until next ###)
    const summaryMatch = entryText.match(/### Summary\s*\n\s*\n([\s\S]*?)(?=\n###|\n---|\n$)/);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';
    
    // Extract files created
    const filesCreated: string[] = [];
    const filesCreatedMatch = entryText.match(/### Files Created\s*\n\s*\n([\s\S]*?)(?=\n###|\n---|\n$)/);
    if (filesCreatedMatch) {
      const fileLines = filesCreatedMatch[1].match(/- `([^`]+)`/g);
      if (fileLines) {
        for (const line of fileLines) {
          const fileMatch = line.match(/- `([^`]+)`/);
          if (fileMatch) filesCreated.push(fileMatch[1]);
        }
      }
    }
    
    // Extract files modified
    const filesModified: string[] = [];
    const filesModifiedMatch = entryText.match(/### Files Modified\s*\n\s*\n([\s\S]*?)(?=\n###|\n---|\n$)/);
    if (filesModifiedMatch) {
      const fileLines = filesModifiedMatch[1].match(/- `([^`]+)`/g);
      if (fileLines) {
        for (const line of fileLines) {
          const fileMatch = line.match(/- `([^`]+)`/);
          if (fileMatch) filesModified.push(fileMatch[1]);
        }
      }
    }
    
    // Extract deviations
    const deviations: string[] = [];
    const deviationsMatch = entryText.match(/### Deviations from Source\s*\n\s*\n([\s\S]*?)(?=\n###|\n---|\n$)/);
    if (deviationsMatch) {
      const devLines = deviationsMatch[1].match(/- .+/g);
      if (devLines) {
        for (const line of devLines) {
          deviations.push(line.replace(/^- /, ''));
        }
      }
    }
    
    // Try to parse the date back to ISO format
    let isoDate: string;
    try {
      const parsedDate = new Date(dateStr);
      isoDate = parsedDate.toISOString();
    } catch {
      isoDate = new Date().toISOString();
    }
    
    return {
      date: isoDate,
      sourceUrl,
      pageSlug,
      filesCreated,
      filesModified,
      summary,
      deviations: deviations.length > 0 ? deviations : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Reads and parses the changelog file
 * 
 * @param changelogPath - Path to the changelog file (defaults to CHANGELOG_PATH)
 * @returns Parsed Changelog object
 */
export function readChangelog(changelogPath?: string): Changelog {
  const resolvedPath = changelogPath || path.join(process.cwd(), CHANGELOG_PATH);
  
  const changelog: Changelog = {
    title: 'Page Cloning Agent - Changelog',
    description: 'This changelog records all pages cloned by the Page Cloning Agent.',
    entries: [],
  };
  
  try {
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    
    // Extract title
    const titleMatch = content.match(/^# (.+)$/m);
    if (titleMatch) {
      changelog.title = titleMatch[1];
    }
    
    // Extract description (first paragraph after title)
    const descMatch = content.match(/^# .+\n\n([\s\S]+?)(?=\n\n---|\n\n##)/);
    if (descMatch) {
      changelog.description = descMatch[1].trim();
    }
    
    // Split into entries (each starts with ## [)
    const entryTexts = content.split(/(?=^## \[)/m).filter(text => text.startsWith('## ['));
    
    for (const entryText of entryTexts) {
      const entry = parseEntry(entryText);
      if (entry) {
        changelog.entries.push(entry);
      }
    }
  } catch {
    // File doesn't exist or can't be read - return empty changelog
  }
  
  return changelog;
}

/**
 * Ensures the changelog directory exists
 * 
 * @param changelogPath - Path to the changelog file
 */
function ensureDirectoryExists(changelogPath: string): void {
  const dir = path.dirname(changelogPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Adds a new entry to the changelog
 * New entries are added at the top (after the header)
 * 
 * @param entry - The changelog entry to add
 * @param changelogPath - Path to the changelog file (defaults to CHANGELOG_PATH)
 * @returns Result of the operation
 * 
 * @example
 * addChangelogEntry({
 *   date: new Date().toISOString(),
 *   sourceUrl: 'https://example.com/page',
 *   pageSlug: 'example-page',
 *   filesCreated: ['src/app/(site)/example-page/page.tsx'],
 *   filesModified: ['next.config.js'],
 *   summary: 'Cloned the example page with all content and styling.',
 * });
 */
export function addChangelogEntry(
  entry: ChangelogEntry,
  changelogPath?: string
): AddEntryResult {
  const resolvedPath = changelogPath || path.join(process.cwd(), CHANGELOG_PATH);
  
  try {
    ensureDirectoryExists(resolvedPath);
    
    let content: string;
    
    // Check if file exists
    if (fs.existsSync(resolvedPath)) {
      content = fs.readFileSync(resolvedPath, 'utf-8');
      
      // Find the position after the header (after first ---)
      const headerEndIndex = content.indexOf('---');
      if (headerEndIndex !== -1) {
        // Insert new entry after the header separator
        const insertPosition = headerEndIndex + 3;
        const formattedEntry = '\n\n' + formatEntry(entry);
        content = content.slice(0, insertPosition) + formattedEntry + content.slice(insertPosition);
      } else {
        // No separator found, append to end
        content += '\n' + formatEntry(entry);
      }
    } else {
      // Create new changelog with initial content
      content = createInitialChangelog() + formatEntry(entry);
    }
    
    fs.writeFileSync(resolvedPath, content, 'utf-8');
    
    return {
      success: true,
      path: resolvedPath,
    };
  } catch (error) {
    return {
      success: false,
      path: resolvedPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Gets the most recent changelog entry
 * 
 * @param changelogPath - Path to the changelog file (defaults to CHANGELOG_PATH)
 * @returns The most recent entry or null if none exist
 */
export function getLatestEntry(changelogPath?: string): ChangelogEntry | null {
  const changelog = readChangelog(changelogPath);
  return changelog.entries.length > 0 ? changelog.entries[0] : null;
}

/**
 * Gets all entries for a specific page slug
 * 
 * @param pageSlug - The page slug to search for
 * @param changelogPath - Path to the changelog file (defaults to CHANGELOG_PATH)
 * @returns Array of entries for the specified page
 */
export function getEntriesByPageSlug(
  pageSlug: string,
  changelogPath?: string
): ChangelogEntry[] {
  const changelog = readChangelog(changelogPath);
  return changelog.entries.filter(entry => entry.pageSlug === pageSlug);
}

/**
 * Checks if a page has been cloned before
 * 
 * @param pageSlug - The page slug to check
 * @param changelogPath - Path to the changelog file (defaults to CHANGELOG_PATH)
 * @returns True if the page has been cloned before
 */
export function hasBeenCloned(pageSlug: string, changelogPath?: string): boolean {
  return getEntriesByPageSlug(pageSlug, changelogPath).length > 0;
}
