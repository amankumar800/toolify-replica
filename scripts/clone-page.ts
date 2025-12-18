#!/usr/bin/env npx ts-node
/**
 * Page Cloning CLI Tool
 * 
 * IDE-agnostic CLI script for cloning web pages into Next.js components.
 * Works with any IDE (Kiro, Cursor, VS Code, etc.) via npm command.
 * 
 * Usage:
 *   npm run clone-page -- <url> <feature-name> [options]
 *   npx ts-node scripts/clone-page.ts <url> <feature-name> [options]
 * 
 * Examples:
 *   npm run clone-page -- "https://example.com/page" "my-feature"
 *   npm run clone-page -- "https://toolify.ai/free-ai-tools" "free-ai-tools" --slug "index"
 * 
 * Options:
 *   --slug <slug>       Page slug (default: derived from URL)
 *   --dynamic           Create dynamic route [slug]
 *   --parent <route>    Parent route path
 *   --output <dir>      Output directory (default: src)
 *   --verbose           Enable verbose logging
 *   --dry-run           Show plan without creating files
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Import services (using relative paths for ts-node)
// Note: These imports work because ts-node resolves from project root

// =============================================================================
// Types (inline to avoid import issues with ts-node)
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

interface ListData {
  id: string;
  items: string[];
  ordered: boolean;
  order: number;
}

interface ExtractedData {
  metadata: PageMetadata;
  textContent: TextBlock[];
  images: ImageData[];
  links: LinkData[];
  lists: ListData[];
  extractedAt: string;
  itemCounts: {
    text: number;
    images: number;
    links: number;
    listItems: number;
  };
}

interface Section {
  id: string;
  type: string;
  selector: string;
  children: Section[];
}

interface PageAnalysis {
  url: string;
  title: string;
  sections: Section[];
  navigation: Array<{ type: string; href: string; text: string }>;
  interactiveElements: Array<{ type: string; selector: string; action: string }>;
  responsiveBreakpoints: string[];
  dependencies: string[];
}

interface ComponentPlan {
  name: string;
  path: string;
  props: string[];
  reusesExisting: string | null;
}

interface DataFilePlan {
  path: string;
  schema: Record<string, string>;
  sourceMapping: Record<string, string>;
}

interface ImplementationPlan {
  pageRoute: string;
  components: ComponentPlan[];
  dataFiles: DataFilePlan[];
  serviceUpdates: Array<{ path: string; functions: string[] }>;
  typeDefinitions: Array<{ name: string; path: string; properties: Record<string, string> }>;
  configUpdates: Array<{ path: string; changes: Record<string, unknown> }>;
}

// =============================================================================
// Configuration
// =============================================================================

interface CLIOptions {
  url: string;
  featureName: string;
  slug: string;
  isDynamic: boolean;
  parentRoute?: string;
  outputDir: string;
  verbose: boolean;
  dryRun: boolean;
}

const DEFAULT_OPTIONS: Partial<CLIOptions> = {
  outputDir: 'src',
  verbose: false,
  dryRun: false,
  isDynamic: false,
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
  
  // Parse optional flags
  for (let i = 2; i < args.length; i++) {
    switch (args[i]) {
      case '--slug':
        options.slug = args[++i];
        break;
      case '--dynamic':
        options.isDynamic = true;
        break;
      case '--parent':
        options.parentRoute = args[++i];
        break;
      case '--output':
        options.outputDir = args[++i];
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
    }
  }
  
  return options;
}

function printUsage(): void {
  console.log(`
Page Cloning CLI Tool
=====================

Usage:
  npm run clone-page -- <url> <feature-name> [options]

Arguments:
  url           URL of the page to clone
  feature-name  Name for the feature (used for file/folder naming)

Options:
  --slug <slug>       Page slug (default: derived from URL)
  --dynamic           Create dynamic route [slug]
  --parent <route>    Parent route path
  --output <dir>      Output directory (default: src)
  --verbose           Enable verbose logging
  --dry-run           Show plan without creating files
  --help, -h          Show this help message

Examples:
  npm run clone-page -- "https://example.com/products" "products"
  npm run clone-page -- "https://toolify.ai/free-ai-tools/chatbots" "free-ai-tools" --slug "chatbots" --parent "free-ai-tools"
  npm run clone-page -- "https://example.com/blog" "blog" --dynamic --dry-run
`);
}

function generateSlugFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const segments = urlObj.pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || 'index';
    return lastSegment
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') || 'page';
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

  constructor(verbose: boolean) {
    this.verbose = verbose;
    this.startTime = Date.now();
  }

  info(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  debug(message: string): void {
    if (this.verbose) {
      console.log(`[DEBUG] ${message}`);
    }
  }

  success(message: string): void {
    console.log(`[✓] ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }

  section(title: string): void {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${title}`);
    console.log(`${'='.repeat(60)}`);
  }

  duration(): string {
    return `${((Date.now() - this.startTime) / 1000).toFixed(2)}s`;
  }
}


// =============================================================================
// Page Analysis (simplified inline version)
// =============================================================================

function parseSnapshot(snapshot: string): any[] {
  if (!snapshot || typeof snapshot !== 'string') return [];
  
  const lines = snapshot.split('\n').filter(line => line.trim());
  const rootNodes: any[] = [];
  const stack: { node: any; depth: number }[] = [];

  for (const line of lines) {
    const leadingMatch = line.match(/^(\s*)-\s*/);
    if (!leadingMatch) continue;

    const depth = Math.floor(leadingMatch[1].length / 2);
    const content = line.slice(leadingMatch[0].length);
    const roleMatch = content.match(/^(\w+)/);
    if (!roleMatch) continue;

    const role = roleMatch[1].toLowerCase();
    let remaining = content.slice(roleMatch[0].length).trim();

    let name = '';
    const nameMatch = remaining.match(/^"([^"]*)"/);
    if (nameMatch) {
      name = nameMatch[1];
      remaining = remaining.slice(nameMatch[0].length).trim();
    }

    const attributes: Record<string, string> = {};
    const attrMatch = remaining.match(/^\[([^\]]*)\]/);
    if (attrMatch) {
      const pairs = attrMatch[1].split(/,\s*(?=[a-zA-Z_]+=)/);
      for (const pair of pairs) {
        const eqIndex = pair.indexOf('=');
        if (eqIndex > 0) {
          const key = pair.slice(0, eqIndex).trim();
          let value = pair.slice(eqIndex + 1).trim().replace(/^"|"$/g, '');
          attributes[key] = value;
        }
      }
    }

    const node = { role, name, attributes, depth, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      rootNodes.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ node, depth });
  }

  return rootNodes;
}

function analyzePage(snapshot: string, url: string, title: string): PageAnalysis {
  const nodes = parseSnapshot(snapshot);
  
  const sections: Section[] = [];
  const navigation: Array<{ type: string; href: string; text: string }> = [];
  const interactiveElements: Array<{ type: string; selector: string; action: string }> = [];
  
  let sectionIndex = 0;
  
  function processNode(node: any, parentSelector: string = ''): void {
    const sectionTypes: Record<string, string> = {
      banner: 'header', header: 'header', navigation: 'header',
      main: 'main', complementary: 'sidebar', aside: 'sidebar',
      contentinfo: 'footer', footer: 'footer', dialog: 'modal',
      region: 'panel', article: 'panel', section: 'panel',
    };
    
    if (sectionTypes[node.role]) {
      sections.push({
        id: `section-${sectionIndex++}`,
        type: sectionTypes[node.role],
        selector: `[role="${node.role}"]`,
        children: [],
      });
    }
    
    if (node.role === 'link' && node.attributes.href) {
      const href = node.attributes.href;
      let type: 'internal' | 'external' | 'anchor' = 'internal';
      if (href.startsWith('#')) type = 'anchor';
      else if (href.startsWith('http') && !href.includes(new URL(url).hostname)) type = 'external';
      
      navigation.push({ type, href, text: node.name || href });
    }
    
    const interactiveRoles: Record<string, string> = {
      button: 'button', link: 'link', tab: 'tab',
      combobox: 'dropdown', listbox: 'dropdown',
    };
    
    if (interactiveRoles[node.role]) {
      interactiveElements.push({
        type: interactiveRoles[node.role],
        selector: `[role="${node.role}"]`,
        action: `Interact with "${node.name}"`,
      });
    }
    
    for (const child of node.children || []) {
      processNode(child, parentSelector);
    }
  }
  
  for (const node of nodes) {
    processNode(node);
  }
  
  return {
    url,
    title,
    sections,
    navigation,
    interactiveElements,
    responsiveBreakpoints: ['640px', '768px', '1024px', '1280px'],
    dependencies: navigation.filter(n => n.type === 'internal').map(n => n.href),
  };
}

// =============================================================================
// Data Extraction (simplified inline version)
// =============================================================================

function extractPageData(html: string, baseUrl: string): ExtractedData {
  // Extract metadata
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  
  const metadata: PageMetadata = {
    title: titleMatch?.[1]?.trim() || '',
    description: descMatch?.[1]?.trim() || '',
    ogTitle: ogTitleMatch?.[1]?.trim() || '',
    ogDescription: ogDescMatch?.[1]?.trim() || '',
    ogImage: ogImageMatch?.[1]?.trim() || '',
    canonical: canonicalMatch?.[1]?.trim() || '',
  };
  
  // Extract text content
  const textContent: TextBlock[] = [];
  let textId = 0;
  const textTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'];
  let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  for (const tag of textTags) {
    const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    let match;
    while ((match = pattern.exec(cleanHtml)) !== null) {
      const text = match[1].replace(/<[^>]+>/g, '').trim();
      if (text) {
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
    images.push({ src, alt: altMatch?.[1] || '' });
  }
  
  // Extract links
  const links: LinkData[] = [];
  const linkPattern = /<a[^>]*href=["']([^"']*)["'][^>]*>([^<]*)<\/a>/gi;
  let linkMatch;
  while ((linkMatch = linkPattern.exec(html)) !== null) {
    const href = linkMatch[1];
    const text = linkMatch[2].trim();
    let type: 'internal' | 'external' | 'anchor' = 'internal';
    if (href.startsWith('#')) type = 'anchor';
    else if (href.startsWith('http')) {
      try {
        if (new URL(href).hostname !== new URL(baseUrl).hostname) type = 'external';
      } catch {}
    }
    links.push({ href, text, type, attributes: {} });
  }
  
  // Extract lists
  const lists: ListData[] = [];
  let listId = 0;
  const listPattern = /<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi;
  let listMatch;
  while ((listMatch = listPattern.exec(cleanHtml)) !== null) {
    const ordered = listMatch[1].toLowerCase() === 'ol';
    const items: string[] = [];
    const liPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let liMatch;
    while ((liMatch = liPattern.exec(listMatch[2])) !== null) {
      const text = liMatch[1].replace(/<[^>]+>/g, '').trim();
      if (text) items.push(text);
    }
    if (items.length > 0) {
      lists.push({ id: `list-${listId++}`, items, ordered, order: listId });
    }
  }
  
  return {
    metadata,
    textContent,
    images,
    links,
    lists,
    extractedAt: new Date().toISOString(),
    itemCounts: {
      text: textContent.length,
      images: images.length,
      links: links.length,
      listItems: lists.reduce((sum, l) => sum + l.items.length, 0),
    },
  };
}


// =============================================================================
// Implementation Planning (simplified inline version)
// =============================================================================

function slugify(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function pascalCase(name: string): string {
  return name.split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function createImplementationPlan(
  analysis: PageAnalysis,
  extractedData: ExtractedData,
  options: { featureName: string; pageSlug: string; isDynamic?: boolean; parentRoute?: string }
): ImplementationPlan {
  const { featureName, pageSlug, isDynamic, parentRoute } = options;
  const pascalName = pascalCase(featureName);
  const slugName = slugify(featureName);
  
  // Determine page route
  let pageRoute: string;
  if (parentRoute) {
    pageRoute = isDynamic ? `${parentRoute}/[slug]` : `${parentRoute}/${pageSlug}`;
  } else {
    pageRoute = isDynamic ? `${slugName}/[slug]` : slugName;
  }
  
  // Plan components
  const components: ComponentPlan[] = [];
  const featureDir = `src/components/features/${slugName}`;
  
  // Add section components
  for (const section of analysis.sections) {
    const compName = `${pascalName}${pascalCase(section.type)}`;
    components.push({
      name: compName,
      path: `${featureDir}/${compName}.tsx`,
      props: ['data', 'className'],
      reusesExisting: null,
    });
  }
  
  // Add page components
  components.push({
    name: `${pascalName}Page`,
    path: `src/app/(site)/${pageRoute}/page.tsx`,
    props: ['params'],
    reusesExisting: null,
  });
  
  components.push({
    name: `${pascalName}Loading`,
    path: `src/app/(site)/${pageRoute}/loading.tsx`,
    props: [],
    reusesExisting: null,
  });
  
  components.push({
    name: `${pascalName}Error`,
    path: `src/app/(site)/${pageRoute}/error.tsx`,
    props: ['error', 'reset'],
    reusesExisting: null,
  });
  
  // Plan data files
  const dataFiles: DataFilePlan[] = [
    {
      path: `src/data/${slugName}/${pageSlug}.json`,
      schema: { metadata: 'PageMetadata', content: 'ExtractedData' },
      sourceMapping: { metadata: 'extractedData.metadata', content: 'extractedData' },
    },
  ];
  
  // Plan service updates
  const serviceUpdates = [{
    path: `src/lib/services/${slugName}.service.ts`,
    functions: [`get${pascalName}Data`, `get${pascalName}BySlug`, `search${pascalName}`],
  }];
  
  // Plan type definitions
  const typeDefinitions = [{
    name: `${pascalName}Data`,
    path: `src/lib/types/${slugName}.ts`,
    properties: {
      metadata: 'PageMetadata',
      textContent: 'TextBlock[]',
      images: 'ImageData[]',
      links: 'LinkData[]',
    },
  }];
  
  // Plan config updates (image domains)
  const configUpdates: Array<{ path: string; changes: Record<string, unknown> }> = [];
  const domains = new Set<string>();
  for (const img of extractedData.images) {
    try {
      const url = new URL(img.src);
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        domains.add(url.hostname);
      }
    } catch {}
  }
  
  if (domains.size > 0) {
    configUpdates.push({
      path: 'next.config.js',
      changes: {
        'images.remotePatterns': Array.from(domains).map(d => ({ protocol: 'https', hostname: d })),
      },
    });
  }
  
  return { pageRoute, components, dataFiles, serviceUpdates, typeDefinitions, configUpdates };
}

// =============================================================================
// File Generation
// =============================================================================

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function generateComponentFile(component: ComponentPlan, extractedData: ExtractedData): string {
  const propsInterface = component.props.length > 0
    ? `interface ${component.name}Props {\n${component.props.map(p => `  ${p}?: any;`).join('\n')}\n}\n\n`
    : '';
  
  return `/**
 * ${component.name} Component
 * Auto-generated by page-cloning CLI
 */

${propsInterface}export function ${component.name}(${component.props.length > 0 ? `props: ${component.name}Props` : ''}) {
  return (
    <div className="${component.name.toLowerCase()}">
      {/* TODO: Implement ${component.name} */}
      <p>${component.name} component</p>
    </div>
  );
}

export default ${component.name};
`;
}

function generatePageFile(plan: ImplementationPlan, extractedData: ExtractedData, featureName: string): string {
  const pascalName = pascalCase(featureName);
  
  return `/**
 * ${pascalName} Page
 * Auto-generated by page-cloning CLI
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${extractedData.metadata.title || pascalName}',
  description: '${extractedData.metadata.description || ''}',
};

export default function ${pascalName}Page() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">${extractedData.metadata.title || pascalName}</h1>
      {/* TODO: Add page content */}
    </main>
  );
}
`;
}

function generateLoadingFile(featureName: string): string {
  const pascalName = pascalCase(featureName);
  
  return `/**
 * ${pascalName} Loading Skeleton
 * Auto-generated by page-cloning CLI
 */

export default function ${pascalName}Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );
}
`;
}

function generateErrorFile(featureName: string): string {
  const pascalName = pascalCase(featureName);
  
  return `/**
 * ${pascalName} Error Boundary
 * Auto-generated by page-cloning CLI
 */

'use client';

export default function ${pascalName}Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong!</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  );
}
`;
}

function generateDataFile(extractedData: ExtractedData, sourceUrl: string): string {
  return JSON.stringify({
    _metadata: {
      sourceUrl,
      extractedAt: extractedData.extractedAt,
      itemCounts: extractedData.itemCounts,
    },
    ...extractedData,
  }, null, 2);
}

function generateServiceFile(featureName: string, dataPath: string): string {
  const pascalName = pascalCase(featureName);
  const slugName = slugify(featureName);
  
  return `/**
 * ${pascalName} Service
 * Auto-generated by page-cloning CLI
 */

import data from '@/data/${slugName}/${path.basename(dataPath, '.json')}.json';

export interface ${pascalName}Data {
  metadata: {
    title: string;
    description: string;
  };
  textContent: Array<{ id: string; content: string; tag: string }>;
  images: Array<{ src: string; alt: string }>;
  links: Array<{ href: string; text: string; type: string }>;
}

export function get${pascalName}Data(): ${pascalName}Data {
  return data as ${pascalName}Data;
}

export function search${pascalName}(query: string): ${pascalName}Data['textContent'] {
  const lowerQuery = query.toLowerCase();
  return data.textContent.filter((item: any) => 
    item.content.toLowerCase().includes(lowerQuery)
  );
}
`;
}

function generateTypeFile(featureName: string): string {
  const pascalName = pascalCase(featureName);
  
  return `/**
 * ${pascalName} Types
 * Auto-generated by page-cloning CLI
 */

export interface ${pascalName}Metadata {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
}

export interface ${pascalName}TextBlock {
  id: string;
  content: string;
  tag: string;
  order: number;
}

export interface ${pascalName}Image {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface ${pascalName}Link {
  href: string;
  text: string;
  type: 'internal' | 'external' | 'anchor';
}

export interface ${pascalName}Data {
  metadata: ${pascalName}Metadata;
  textContent: ${pascalName}TextBlock[];
  images: ${pascalName}Image[];
  links: ${pascalName}Link[];
  extractedAt: string;
}
`;
}


// =============================================================================
// Main Page Cloner Class
// =============================================================================

class PageCloner {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private logger: Logger;
  private options: CLIOptions;

  constructor(options: CLIOptions) {
    this.options = options;
    this.logger = new Logger(options.verbose);
  }

  async init(): Promise<void> {
    this.logger.debug('Launching browser...');
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1280, height: 800 });
    this.logger.debug('Browser launched');
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.logger.debug('Browser closed');
    }
  }

  async navigateAndCapture(): Promise<{ snapshot: string; html: string; title: string }> {
    if (!this.page) throw new Error('Page not initialized');
    
    this.logger.info(`Navigating to ${this.options.url}...`);
    await this.page.goto(this.options.url, { waitUntil: 'networkidle' });
    
    const title = await this.page.title();
    this.logger.debug(`Page title: ${title}`);
    
    // Get accessibility snapshot
    const snapshot = await this.page.accessibility.snapshot() || {};
    const snapshotStr = JSON.stringify(snapshot, null, 2);
    this.logger.debug(`Snapshot captured (${snapshotStr.length} chars)`);
    
    // Get HTML content
    const html = await this.page.content();
    this.logger.debug(`HTML captured (${html.length} chars)`);
    
    return { snapshot: snapshotStr, html, title };
  }

  async run(): Promise<void> {
    this.logger.section('Page Cloning CLI');
    this.logger.info(`URL: ${this.options.url}`);
    this.logger.info(`Feature: ${this.options.featureName}`);
    this.logger.info(`Slug: ${this.options.slug}`);
    if (this.options.dryRun) {
      this.logger.info('Mode: DRY RUN (no files will be created)');
    }

    try {
      await this.init();

      // Phase 1: Navigate and capture
      this.logger.section('Phase 1: Capture');
      const { snapshot, html, title } = await this.navigateAndCapture();
      this.logger.success(`Captured page: ${title}`);

      // Phase 2: Analyze
      this.logger.section('Phase 2: Analyze');
      const analysis = analyzePage(snapshot, this.options.url, title);
      this.logger.success(`Found ${analysis.sections.length} sections`);
      this.logger.success(`Found ${analysis.navigation.length} navigation links`);
      this.logger.success(`Found ${analysis.interactiveElements.length} interactive elements`);

      // Phase 3: Extract
      this.logger.section('Phase 3: Extract');
      const extractedData = extractPageData(html, this.options.url);
      this.logger.success(`Extracted ${extractedData.itemCounts.text} text blocks`);
      this.logger.success(`Extracted ${extractedData.itemCounts.images} images`);
      this.logger.success(`Extracted ${extractedData.itemCounts.links} links`);
      this.logger.success(`Extracted ${extractedData.itemCounts.listItems} list items`);

      // Phase 4: Plan
      this.logger.section('Phase 4: Plan');
      const plan = createImplementationPlan(analysis, extractedData, {
        featureName: this.options.featureName,
        pageSlug: this.options.slug,
        isDynamic: this.options.isDynamic,
        parentRoute: this.options.parentRoute,
      });
      
      this.logger.success(`Page route: ${plan.pageRoute}`);
      this.logger.success(`Components to create: ${plan.components.length}`);
      this.logger.success(`Data files to create: ${plan.dataFiles.length}`);
      this.logger.success(`Service updates: ${plan.serviceUpdates.length}`);
      this.logger.success(`Type definitions: ${plan.typeDefinitions.length}`);

      // Show plan details
      this.logger.section('Implementation Plan');
      console.log('\nComponents:');
      for (const comp of plan.components) {
        console.log(`  - ${comp.path}`);
      }
      console.log('\nData Files:');
      for (const file of plan.dataFiles) {
        console.log(`  - ${file.path}`);
      }
      console.log('\nServices:');
      for (const svc of plan.serviceUpdates) {
        console.log(`  - ${svc.path}`);
        console.log(`    Functions: ${svc.functions.join(', ')}`);
      }
      console.log('\nTypes:');
      for (const type of plan.typeDefinitions) {
        console.log(`  - ${type.path} (${type.name})`);
      }

      if (this.options.dryRun) {
        this.logger.section('Dry Run Complete');
        this.logger.info('No files were created. Remove --dry-run to generate files.');
        return;
      }

      // Phase 5: Generate Files
      this.logger.section('Phase 5: Generate Files');
      await this.generateFiles(plan, extractedData);

      this.logger.section('Complete!');
      this.logger.success(`Page cloned successfully in ${this.logger.duration()}`);
      this.logger.info(`\nNext steps:`);
      this.logger.info(`  1. Review generated files`);
      this.logger.info(`  2. Customize components with actual styling`);
      this.logger.info(`  3. Run: npm run dev`);
      this.logger.info(`  4. Visit: http://localhost:3000/${plan.pageRoute}`);

    } finally {
      await this.close();
    }
  }

  private async generateFiles(plan: ImplementationPlan, extractedData: ExtractedData): Promise<void> {
    const slugName = slugify(this.options.featureName);
    
    // Create directories
    ensureDir(`src/components/features/${slugName}`);
    ensureDir(`src/data/${slugName}`);
    ensureDir(`src/lib/services`);
    ensureDir(`src/lib/types`);
    ensureDir(`src/app/(site)/${plan.pageRoute}`);

    // Generate component files
    for (const comp of plan.components) {
      const dir = path.dirname(comp.path);
      ensureDir(dir);
      
      let content: string;
      if (comp.name.endsWith('Page')) {
        content = generatePageFile(plan, extractedData, this.options.featureName);
      } else if (comp.name.endsWith('Loading')) {
        content = generateLoadingFile(this.options.featureName);
      } else if (comp.name.endsWith('Error')) {
        content = generateErrorFile(this.options.featureName);
      } else {
        content = generateComponentFile(comp, extractedData);
      }
      
      fs.writeFileSync(comp.path, content, 'utf-8');
      this.logger.success(`Created: ${comp.path}`);
    }

    // Generate data files
    for (const dataFile of plan.dataFiles) {
      const dir = path.dirname(dataFile.path);
      ensureDir(dir);
      
      const content = generateDataFile(extractedData, this.options.url);
      fs.writeFileSync(dataFile.path, content, 'utf-8');
      this.logger.success(`Created: ${dataFile.path}`);
    }

    // Generate service file
    for (const svc of plan.serviceUpdates) {
      if (!fs.existsSync(svc.path)) {
        const content = generateServiceFile(this.options.featureName, plan.dataFiles[0]?.path || '');
        fs.writeFileSync(svc.path, content, 'utf-8');
        this.logger.success(`Created: ${svc.path}`);
      } else {
        this.logger.debug(`Skipped (exists): ${svc.path}`);
      }
    }

    // Generate type file
    for (const type of plan.typeDefinitions) {
      if (!fs.existsSync(type.path)) {
        const content = generateTypeFile(this.options.featureName);
        fs.writeFileSync(type.path, content, 'utf-8');
        this.logger.success(`Created: ${type.path}`);
      } else {
        this.logger.debug(`Skipped (exists): ${type.path}`);
      }
    }

    // Log config updates needed
    if (plan.configUpdates.length > 0) {
      this.logger.info('\nManual config updates needed:');
      for (const config of plan.configUpdates) {
        this.logger.info(`  ${config.path}:`);
        console.log(JSON.stringify(config.changes, null, 2));
      }
    }
  }
}

// =============================================================================
// Main Entry Point
// =============================================================================

async function main(): Promise<void> {
  const options = parseArgs();
  const cloner = new PageCloner(options);
  
  try {
    await cloner.run();
    process.exit(0);
  } catch (error) {
    console.error('\n[FATAL ERROR]', error);
    process.exit(1);
  }
}

main();
