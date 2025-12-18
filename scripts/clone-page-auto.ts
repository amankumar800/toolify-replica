#!/usr/bin/env npx ts-node
/**
 * Page Cloning CLI Tool - AUTO MODE
 * 
 * Runs in a continuous loop until the clone matches the original perfectly.
 * Analyzes errors, fixes issues, and verifies until 100% satisfaction.
 * 
 * Usage:
 *   npm run clone-page:auto -- <url> <feature-name> [options]
 * 
 * Examples:
 *   npm run clone-page:auto -- "https://example.com/page" "my-feature"
 *   npm run clone-page:auto -- "https://toolify.ai/free-ai-tools" "free-ai-tools" --max-iterations 10
 * 
 * Options:
 *   --slug <slug>           Page slug (default: derived from URL)
 *   --max-iterations <n>    Maximum fix iterations (default: 5)
 *   --threshold <n>         Similarity threshold 0-100 (default: 95)
 *   --verbose               Enable verbose logging
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// Types
// =============================================================================

interface PageMetadata {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonical: string;
}

interface TextBlock {
  id: string;
  content: string;
  tag: string;
  order: number;
}

interface ImageData {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

interface LinkData {
  href: string;
  text: string;
  type: 'internal' | 'external' | 'anchor';
  attributes: Record<string, string>;
}

interface ExtractedData {
  metadata: PageMetadata;
  textContent: TextBlock[];
  images: ImageData[];
  links: LinkData[];
  extractedAt: string;
  itemCounts: {
    text: number;
    images: number;
    links: number;
    listItems: number;
  };
}

interface VerificationResult {
  passed: boolean;
  score: number; // 0-100
  issues: VerificationIssue[];
  suggestions: string[];
}

interface VerificationIssue {
  type: 'missing_text' | 'missing_image' | 'missing_link' | 'broken_link' | 'style_mismatch' | 'data_mismatch';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  expected?: string;
  actual?: string;
  fix?: string;
}

interface CLIOptions {
  url: string;
  featureName: string;
  slug: string;
  maxIterations: number;
  threshold: number;
  verbose: boolean;
}

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_OPTIONS: Partial<CLIOptions> = {
  maxIterations: 5,
  threshold: 95,
  verbose: false,
};

// =============================================================================
// Argument Parsing
// =============================================================================

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  
  if (args.length < 2 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
  }
  
  const url = args[0];
  const featureName = args[1];
  
  const options: CLIOptions = {
    url,
    featureName,
    slug: generateSlugFromUrl(url),
    ...DEFAULT_OPTIONS,
  } as CLIOptions;
  
  for (let i = 2; i < args.length; i++) {
    switch (args[i]) {
      case '--slug':
        options.slug = args[++i];
        break;
      case '--max-iterations':
        options.maxIterations = parseInt(args[++i], 10);
        break;
      case '--threshold':
        options.threshold = parseInt(args[++i], 10);
        break;
      case '--verbose':
        options.verbose = true;
        break;
    }
  }
  
  return options;
}

function printUsage(): void {
  console.log(`
Page Cloning CLI - AUTO MODE
=============================

Runs in a continuous loop until the clone matches the original.

Usage:
  npm run clone-page:auto -- <url> <feature-name> [options]

Arguments:
  url           URL of the page to clone
  feature-name  Name for the feature

Options:
  --slug <slug>           Page slug (default: derived from URL)
  --max-iterations <n>    Maximum fix iterations (default: 5)
  --threshold <n>         Similarity threshold 0-100 (default: 95)
  --verbose               Enable verbose logging
  --help, -h              Show this help message

Examples:
  npm run clone-page:auto -- "https://example.com/page" "my-feature"
  npm run clone-page:auto -- "https://toolify.ai/free-ai-tools" "free-ai-tools" --threshold 98
`);
}

function generateSlugFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const segments = urlObj.pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || 'index';
    return lastSegment.toLowerCase().replace(/[^\w-]/g, '-').replace(/-+/g, '-') || 'page';
  } catch {
    return 'page';
  }
}

// =============================================================================
// Logger
// =============================================================================

class Logger {
  private verbose: boolean;
  private startTime: number;
  private iteration: number = 0;

  constructor(verbose: boolean) {
    this.verbose = verbose;
    this.startTime = Date.now();
  }

  setIteration(n: number): void {
    this.iteration = n;
  }

  info(message: string): void {
    const prefix = this.iteration > 0 ? `[Iter ${this.iteration}]` : '[INFO]';
    console.log(`${prefix} ${message}`);
  }

  debug(message: string): void {
    if (this.verbose) {
      console.log(`[DEBUG] ${message}`);
    }
  }

  success(message: string): void {
    console.log(`[✓] ${message}`);
  }

  warning(message: string): void {
    console.log(`[⚠] ${message}`);
  }

  error(message: string): void {
    console.error(`[✗] ${message}`);
  }

  section(title: string): void {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  ${title}`);
    console.log(`${'═'.repeat(60)}`);
  }

  progress(current: number, total: number, label: string): void {
    const percent = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
    console.log(`[${bar}] ${percent}% - ${label}`);
  }

  duration(): string {
    return `${((Date.now() - this.startTime) / 1000).toFixed(2)}s`;
  }
}


// =============================================================================
// Data Extraction
// =============================================================================

function extractPageData(html: string, baseUrl: string): ExtractedData {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  
  const metadata: PageMetadata = {
    title: titleMatch?.[1]?.trim() || '',
    description: descMatch?.[1]?.trim() || '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    canonical: '',
  };
  
  // Extract text content
  const textContent: TextBlock[] = [];
  let textId = 0;
  let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  const textTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'li'];
  for (const tag of textTags) {
    const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    let match;
    while ((match = pattern.exec(cleanHtml)) !== null) {
      const text = match[1].replace(/<[^>]+>/g, '').trim();
      if (text && text.length > 2) {
        textContent.push({ id: `${tag}-${textId++}`, content: text, tag, order: textId });
      }
    }
  }
  
  // Extract images
  const images: ImageData[] = [];
  const imgPattern = /<img[^>]*src=["']([^"']*)["'][^>]*>/gi;
  let imgMatch;
  while ((imgMatch = imgPattern.exec(html)) !== null) {
    const src = imgMatch[1];
    const altMatch = imgMatch[0].match(/alt=["']([^"']*)["']/i);
    if (src && !src.startsWith('data:')) {
      images.push({ src, alt: altMatch?.[1] || '' });
    }
  }
  
  // Extract links
  const links: LinkData[] = [];
  const linkPattern = /<a[^>]*href=["']([^"']*)["'][^>]*>([^<]*)<\/a>/gi;
  let linkMatch;
  while ((linkMatch = linkPattern.exec(html)) !== null) {
    const href = linkMatch[1];
    const text = linkMatch[2].trim();
    if (href && !href.startsWith('javascript:')) {
      let type: 'internal' | 'external' | 'anchor' = 'internal';
      if (href.startsWith('#')) type = 'anchor';
      else if (href.startsWith('http')) {
        try {
          if (new URL(href).hostname !== new URL(baseUrl).hostname) type = 'external';
        } catch {}
      }
      links.push({ href, text, type, attributes: {} });
    }
  }
  
  return {
    metadata,
    textContent,
    images,
    links,
    extractedAt: new Date().toISOString(),
    itemCounts: {
      text: textContent.length,
      images: images.length,
      links: links.length,
      listItems: 0,
    },
  };
}

// =============================================================================
// Verification Engine
// =============================================================================

function verifyClone(
  sourceData: ExtractedData,
  cloneData: ExtractedData,
  sourceHtml: string,
  cloneHtml: string
): VerificationResult {
  const issues: VerificationIssue[] = [];
  let totalChecks = 0;
  let passedChecks = 0;

  // Check metadata
  totalChecks++;
  if (sourceData.metadata.title && cloneData.metadata.title?.includes(sourceData.metadata.title.substring(0, 20))) {
    passedChecks++;
  } else {
    issues.push({
      type: 'data_mismatch',
      severity: 'major',
      description: 'Page title mismatch',
      expected: sourceData.metadata.title,
      actual: cloneData.metadata.title,
      fix: `Update page title to: "${sourceData.metadata.title}"`,
    });
  }

  // Check text content coverage
  const sourceTexts = new Set(sourceData.textContent.map(t => t.content.toLowerCase().substring(0, 50)));
  const cloneTexts = new Set(cloneData.textContent.map(t => t.content.toLowerCase().substring(0, 50)));
  
  let textMatches = 0;
  for (const text of sourceTexts) {
    totalChecks++;
    let found = false;
    for (const cloneText of cloneTexts) {
      if (cloneText.includes(text.substring(0, 30)) || text.includes(cloneText.substring(0, 30))) {
        found = true;
        break;
      }
    }
    if (found) {
      passedChecks++;
      textMatches++;
    }
  }
  
  if (textMatches < sourceTexts.size * 0.8) {
    issues.push({
      type: 'missing_text',
      severity: 'critical',
      description: `Missing ${sourceTexts.size - textMatches} text blocks out of ${sourceTexts.size}`,
      fix: 'Extract and include all text content from source page',
    });
  }

  // Check images
  const sourceImages = new Set(sourceData.images.map(i => i.src));
  const cloneImages = new Set(cloneData.images.map(i => i.src));
  
  let imageMatches = 0;
  for (const src of sourceImages) {
    totalChecks++;
    if (cloneImages.has(src)) {
      passedChecks++;
      imageMatches++;
    }
  }
  
  if (imageMatches < sourceImages.size * 0.7) {
    issues.push({
      type: 'missing_image',
      severity: 'major',
      description: `Missing ${sourceImages.size - imageMatches} images out of ${sourceImages.size}`,
      fix: 'Include all image URLs from source page',
    });
  }

  // Check links
  const sourceLinks = new Set(sourceData.links.filter(l => l.type !== 'anchor').map(l => l.href));
  const cloneLinks = new Set(cloneData.links.filter(l => l.type !== 'anchor').map(l => l.href));
  
  let linkMatches = 0;
  for (const href of sourceLinks) {
    totalChecks++;
    if (cloneLinks.has(href)) {
      passedChecks++;
      linkMatches++;
    }
  }
  
  if (linkMatches < sourceLinks.size * 0.7) {
    issues.push({
      type: 'missing_link',
      severity: 'major',
      description: `Missing ${sourceLinks.size - linkMatches} links out of ${sourceLinks.size}`,
      fix: 'Include all navigation links from source page',
    });
  }

  // Calculate score
  const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
  
  // Generate suggestions
  const suggestions: string[] = [];
  if (issues.some(i => i.type === 'missing_text')) {
    suggestions.push('Re-extract text content ensuring all headings and paragraphs are captured');
  }
  if (issues.some(i => i.type === 'missing_image')) {
    suggestions.push('Verify image URLs are correctly resolved and included');
  }
  if (issues.some(i => i.type === 'missing_link')) {
    suggestions.push('Ensure all navigation links are properly extracted and rendered');
  }

  return {
    passed: score >= 95 && !issues.some(i => i.severity === 'critical'),
    score,
    issues,
    suggestions,
  };
}

// =============================================================================
// File Generation
// =============================================================================

function slugify(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function pascalCase(name: string): string {
  return name.split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function generateDataFile(data: ExtractedData, sourceUrl: string): string {
  return JSON.stringify({
    _metadata: { sourceUrl, extractedAt: data.extractedAt, itemCounts: data.itemCounts },
    ...data,
  }, null, 2);
}

function generatePageComponent(featureName: string, data: ExtractedData): string {
  const pascalName = pascalCase(featureName);
  
  // Generate actual content from extracted data
  const headings = data.textContent.filter(t => t.tag.startsWith('h'));
  const paragraphs = data.textContent.filter(t => t.tag === 'p');
  
  return `/**
 * ${pascalName} Page - Auto-generated
 */
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '${data.metadata.title.replace(/'/g, "\\'")}',
  description: '${data.metadata.description.replace(/'/g, "\\'")}',
};

export default function ${pascalName}Page() {
  return (
    <main className="container mx-auto px-4 py-8">
      {/* Headings */}
${headings.slice(0, 10).map(h => `      <${h.tag} className="font-bold mb-4">${h.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</${h.tag}>`).join('\n')}
      
      {/* Content */}
${paragraphs.slice(0, 20).map(p => `      <p className="mb-4">${p.content.substring(0, 200).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('\n')}
      
      {/* Links */}
      <nav className="mt-8">
${data.links.slice(0, 20).map(l => `        <Link href="${l.href}" className="block text-blue-600 hover:underline mb-2">${l.text || l.href}</Link>`).join('\n')}
      </nav>
    </main>
  );
}
`;
}
