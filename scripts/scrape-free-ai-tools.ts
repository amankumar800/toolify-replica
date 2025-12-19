/**
 * Free AI Tools Data Scraper
 * 
 * Playwright-based scraper that extracts tool data from toolify.ai/free-ai-tools
 * Implements Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.10, 6.11, 6.12
 * 
 * Now also writes directly to Supabase database using ScraperDbService.
 * Implements Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ScraperDbService,
  createScraperDbService,
  type ScraperCategoryInsert,
  type ScraperToolInsert,
  type ScraperToolCategoryInsert,
  type ScraperFaqInsert,
  type ScraperResult,
} from './lib/scraper-db.service';

// Load environment variables
require('dotenv').config();

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  baseUrl: 'https://www.toolify.ai/free-ai-tools',
  delayBetweenRequests: 2000, // 2 seconds default delay
  maxRetries: 3,
  maxRetryWait: 30000, // 30 seconds max wait
  outputDir: 'src/data/free-ai-tools',
  categoriesDir: 'src/data/free-ai-tools/categories',
  version: '1.0.0',
  // Database configuration
  writeToDatabase: true, // Set to false to only write JSON files
  writeToJsonFiles: true, // Set to false to only write to database
};

// =============================================================================
// Database Client Factory
// =============================================================================

/**
 * Creates a Supabase admin client for database operations.
 * Returns null if credentials are not configured.
 */
function createAdminClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[Database] Supabase credentials not configured. Database writes will be skipped.');
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Normalize pricing value to valid database enum
 */
function normalizePricing(pricing: string | null): string {
  if (!pricing) return 'Freemium';
  
  const validPricing = ['Free', 'Freemium', 'Paid', 'Free Trial', 'Contact for Pricing'];
  
  if (validPricing.includes(pricing)) {
    return pricing;
  }
  
  const lowerPricing = pricing.toLowerCase();
  if (lowerPricing.includes('free') && !lowerPricing.includes('trial')) {
    return lowerPricing === 'free' ? 'Free' : 'Freemium';
  }
  if (lowerPricing.includes('trial')) return 'Free Trial';
  if (lowerPricing.includes('paid') || lowerPricing.includes('$') || lowerPricing.includes('from')) {
    return 'Paid';
  }
  if (lowerPricing.includes('contact')) return 'Contact for Pricing';
  
  return 'Freemium';
}

// =============================================================================
// Types for Scraped Data
// =============================================================================

interface ScrapedCategory {
  name: string;
  slug: string;
  iconUrl: string;
}

interface ScrapedTool {
  name: string;
  slug: string;
  externalUrl: string | null;
  description: string;
  freeTierDetails: string | null;
  pricing: string | null;
}

interface ScrapedSubcategory {
  name: string;
  tools: ScrapedTool[];
}

interface ScrapedCategoryPage {
  title: string;
  description: string;
  subcategories: ScrapedSubcategory[];
  previousCategory: string | null;
  nextCategory: string | null;
}

interface ScrapedFeaturedTool {
  name: string;
  slug: string;
  imageUrl: string;
  description: string;
  badge: 'Free' | 'New' | 'Popular' | null;
}

interface ScrapedFAQItem {
  question: string;
  answer: string;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Delay execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}


/**
 * Sanitize HTML content to prevent XSS
 * Requirement 6.11: HTML entity sanitization
 */
function sanitizeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract slug from URL path
 */
function extractSlug(url: string): string {
  const match = url.match(/\/tool\/([^/?]+)/);
  return match ? match[1] : '';
}

/**
 * Extract category slug from URL
 */
function extractCategorySlug(url: string): string {
  const match = url.match(/\/free-ai-tools\/([^/?]+)/);
  return match ? match[1] : '';
}

/**
 * Parse tool description to extract free tier details and pricing
 */
function parseToolDescription(rawText: string): {
  description: string;
  freeTierDetails: string | null;
  pricing: string | null;
} {
  // Format: "- Free tier / Features / More - From $X/month"
  const text = rawText.replace(/^-\s*/, '').trim();
  
  // Try to extract pricing (From $X/month pattern)
  const pricingMatch = text.match(/\s*-\s*From\s+(.+)$/i);
  const pricing = pricingMatch ? pricingMatch[1].trim() : null;
  
  // Remove pricing from description
  let description = pricingMatch ? text.replace(pricingMatch[0], '').trim() : text;
  
  // Extract free tier details (first part before /)
  const parts = description.split('/').map(p => p.trim());
  const freeTierDetails = parts.length > 0 ? parts[0] : null;
  
  return {
    description: sanitizeHtml(description),
    freeTierDetails: freeTierDetails ? sanitizeHtml(freeTierDetails) : null,
    pricing: pricing ? sanitizeHtml(pricing) : null,
  };
}

// =============================================================================
// Progress Logger
// =============================================================================

class ProgressLogger {
  private startTime: number;
  private pagesScraped: number = 0;
  private toolsExtracted: number = 0;
  private errors: string[] = [];

  constructor() {
    this.startTime = Date.now();
  }

  logStart(): void {
    console.log('='.repeat(60));
    console.log('Free AI Tools Scraper - Starting');
    console.log(`Start time: ${new Date().toISOString()}`);
    console.log('='.repeat(60));
  }

  logPageScraped(url: string): void {
    this.pagesScraped++;
    console.log(`[${this.pagesScraped}] Scraped: ${url}`);
  }

  logToolsExtracted(count: number, category: string): void {
    this.toolsExtracted += count;
    console.log(`    -> Extracted ${count} tools from ${category}`);
  }

  logError(message: string, url?: string): void {
    const errorMsg = url ? `${message} (${url})` : message;
    this.errors.push(errorMsg);
    console.error(`[ERROR] ${errorMsg}`);
  }

  logComplete(): void {
    const duration = Date.now() - this.startTime;
    console.log('='.repeat(60));
    console.log('Scraping Complete');
    console.log(`Pages scraped: ${this.pagesScraped}`);
    console.log(`Tools extracted: ${this.toolsExtracted}`);
    console.log(`Errors: ${this.errors.length}`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log('='.repeat(60));
  }

  getMetadata(): {
    pagesScraped: number;
    toolsExtracted: number;
    errors: number;
    durationMs: number;
  } {
    return {
      pagesScraped: this.pagesScraped,
      toolsExtracted: this.toolsExtracted,
      errors: this.errors.length,
      durationMs: Date.now() - this.startTime,
    };
  }
}


// =============================================================================
// Retry Logic with Exponential Backoff
// =============================================================================

/**
 * Retry wrapper with exponential backoff
 * Requirement 6.6: Exponential backoff (max 3 retries, max wait 30 seconds)
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  logger: ProgressLogger,
  context: string
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const waitTime = Math.min(
        Math.pow(2, attempt - 1) * 1000,
        CONFIG.maxRetryWait
      );
      
      if (attempt < CONFIG.maxRetries) {
        console.log(`    Retry ${attempt}/${CONFIG.maxRetries} for ${context}, waiting ${waitTime}ms...`);
        await delay(waitTime);
      }
    }
  }
  
  logger.logError(`Failed after ${CONFIG.maxRetries} retries: ${lastError?.message}`, context);
  throw lastError;
}

// =============================================================================
// Main Scraper Class
// =============================================================================

class FreeAIToolsScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private logger: ProgressLogger;
  private toolsBySlug: Map<string, ScrapedTool & { categoryIds: string[] }> = new Map();
  private scraperDb: ScraperDbService | null = null;
  private dbResults: {
    categories: ScraperResult;
    tools: ScraperResult;
    toolCategories: ScraperResult;
    faqs: ScraperResult;
  } = {
    categories: { success: 0, failed: 0, errors: [] },
    tools: { success: 0, failed: 0, errors: [] },
    toolCategories: { success: 0, failed: 0, errors: [] },
    faqs: { success: 0, failed: 0, errors: [] },
  };

  constructor() {
    this.logger = new ProgressLogger();
    
    // Initialize database service if configured
    if (CONFIG.writeToDatabase) {
      const supabase = createAdminClient();
      if (supabase) {
        this.scraperDb = createScraperDbService(supabase);
        console.log('[Database] Supabase connection initialized');
      }
    }
  }

  /**
   * Initialize browser and page
   */
  async init(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1280, height: 800 });
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Navigate to URL with delay
   * Requirement 6.2: Configurable delay between requests
   */
  async navigateTo(url: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    await delay(CONFIG.delayBetweenRequests);
    await this.page.goto(url, { waitUntil: 'networkidle' });
    this.logger.logPageScraped(url);
  }

  /**
   * Scrape categories from sidebar
   * Requirement 6.3: Extract category names, slugs, icons
   */
  async scrapeCategories(): Promise<ScrapedCategory[]> {
    if (!this.page) throw new Error('Page not initialized');

    const categories: ScrapedCategory[] = [];
    
    // Find all category links in the navigation
    const categoryLinks = await this.page.$$('nav a[href^="/free-ai-tools/"]');
    
    for (const link of categoryLinks) {
      const href = await link.getAttribute('href');
      if (!href || href === '/free-ai-tools') continue;
      
      const slug = extractCategorySlug(href);
      if (!slug) continue;
      
      // Get category name from text content
      const nameElement = await link.$('div:last-child');
      const name = nameElement ? await nameElement.textContent() : '';
      
      // Get icon URL
      const iconElement = await link.$('img');
      const iconUrl = iconElement ? await iconElement.getAttribute('src') || '' : '';
      
      if (name && slug) {
        categories.push({
          name: sanitizeHtml(name.trim()),
          slug,
          iconUrl,
        });
      }
    }
    
    return categories;
  }

  /**
   * Scrape featured tools from main page
   * Requirement 6.3: Extract featured tools with images, descriptions, badges
   */
  async scrapeFeaturedTools(): Promise<ScrapedFeaturedTool[]> {
    if (!this.page) throw new Error('Page not initialized');

    const featuredTools: ScrapedFeaturedTool[] = [];
    
    // Find featured tools section
    const featuredSection = await this.page.$('h3:has-text("Featured")');
    if (!featuredSection) return featuredTools;
    
    const parent = await featuredSection.evaluateHandle(el => el.parentElement);
    const toolCards = await (parent as any).$$('div[cursor="pointer"], [cursor=pointer]');
    
    for (const card of toolCards) {
      try {
        // Get tool name
        const nameEl = await card.$('div:has-text("")');
        const name = nameEl ? await nameEl.textContent() : '';
        
        // Get image
        const imgEl = await card.$('img');
        const imageUrl = imgEl ? await imgEl.getAttribute('src') || '' : '';
        
        // Get description - usually the last text element
        const allText = await card.textContent();
        const description = allText?.replace(name || '', '').trim() || '';
        
        // Check for badge
        let badge: 'Free' | 'New' | 'Popular' | null = null;
        const badgeText = await card.textContent();
        if (badgeText?.includes('Free')) badge = 'Free';
        else if (badgeText?.includes('New')) badge = 'New';
        else if (badgeText?.includes('Popular')) badge = 'Popular';
        
        // Generate slug from name
        const slug = name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '';
        
        if (name && slug) {
          featuredTools.push({
            name: sanitizeHtml(name.trim()),
            slug,
            imageUrl,
            description: sanitizeHtml(description.substring(0, 500)),
            badge,
          });
        }
      } catch {
        // Skip malformed cards
      }
    }
    
    return featuredTools;
  }


  /**
   * Scrape FAQ items from main page
   * Requirement 15.7: Extract FAQ questions and answers
   */
  async scrapeFAQItems(): Promise<ScrapedFAQItem[]> {
    if (!this.page) throw new Error('Page not initialized');

    const faqItems: ScrapedFAQItem[] = [];
    
    // Find FAQ section by heading
    const faqHeading = await this.page.$('h2:has-text("Frequently Asked Questions")');
    if (!faqHeading) return faqItems;
    
    // Find FAQ items (h3 questions with following answer text)
    const faqContainer = await faqHeading.evaluateHandle(el => el.parentElement);
    const questionElements = await (faqContainer as any).$$('h3');
    
    for (const questionEl of questionElements) {
      try {
        const question = await questionEl.textContent();
        
        // Get the parent container and find the answer
        const parent = await questionEl.evaluateHandle((el: Element) => el.closest('div[cursor]') || el.parentElement);
        const allText = await (parent as any).textContent();
        const answer = allText?.replace(question || '', '').trim() || '';
        
        if (question && answer) {
          faqItems.push({
            question: sanitizeHtml(question.trim()),
            answer: sanitizeHtml(answer.trim()),
          });
        }
      } catch {
        // Skip malformed FAQ items
      }
    }
    
    return faqItems;
  }

  /**
   * Scrape a single category page
   * Requirements 6.4, 6.5: Extract category data, tools, subcategories
   */
  async scrapeCategoryPage(slug: string): Promise<ScrapedCategoryPage | null> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      await this.navigateTo(`${CONFIG.baseUrl}/${slug}`);
      
      // Get category title (H1)
      const titleEl = await this.page.$('h1');
      const title = titleEl ? await titleEl.textContent() : '';
      
      // Get description (paragraph after H1)
      const descEl = await this.page.$('h1 + p, h1 ~ p');
      const description = descEl ? await descEl.textContent() : '';
      
      // Get subcategories and tools
      const subcategories: ScrapedSubcategory[] = [];
      const h3Elements = await this.page.$$('h3');
      
      for (const h3 of h3Elements) {
        const subcategoryName = await h3.textContent();
        if (!subcategoryName || subcategoryName.includes('Featured')) continue;
        
        // Find the list following this h3
        const listEl = await h3.evaluateHandle((el: Element) => {
          let sibling = el.nextElementSibling;
          while (sibling) {
            if (sibling.tagName === 'UL' || sibling.getAttribute('role') === 'list') {
              return sibling;
            }
            sibling = sibling.nextElementSibling;
          }
          return null;
        });
        
        if (!listEl) continue;
        
        const tools: ScrapedTool[] = [];
        const listItems = await (listEl as any).$$('li, [role="listitem"]');
        
        for (const item of listItems) {
          try {
            const tool = await this.extractToolFromListItem(item);
            if (tool) {
              tools.push(tool);
              // Track for deduplication
              this.trackTool(tool, slug);
            }
          } catch {
            // Skip malformed tool items
          }
        }
        
        if (tools.length > 0) {
          subcategories.push({
            name: sanitizeHtml(subcategoryName.trim()),
            tools,
          });
        }
      }
      
      // Get previous/next navigation
      const prevNextNav = await this.extractPrevNextNav();
      
      this.logger.logToolsExtracted(
        subcategories.reduce((sum, s) => sum + s.tools.length, 0),
        title || slug
      );
      
      return {
        title: sanitizeHtml(title?.trim() || ''),
        description: sanitizeHtml(description?.trim() || ''),
        subcategories,
        previousCategory: prevNextNav.previous,
        nextCategory: prevNextNav.next,
      };
    } catch (error) {
      this.logger.logError(`Failed to scrape category: ${(error as Error).message}`, slug);
      return null;
    }
  }

  /**
   * Extract tool data from a list item element
   * Requirement 6.5: Extract tool name, slug, external URL, description, free tier, pricing
   */
  private async extractToolFromListItem(item: any): Promise<ScrapedTool | null> {
    // Get internal link (tool name and slug)
    const internalLink = await item.$('a[href^="/tool/"]');
    if (!internalLink) return null;
    
    const href = await internalLink.getAttribute('href');
    const name = await internalLink.textContent();
    const slug = extractSlug(href || '');
    
    if (!name || !slug) return null;
    
    // Get external link
    const externalLink = await item.$('a[href*="utm_source=toolify"]');
    let externalUrl: string | null = null;
    if (externalLink) {
      externalUrl = await externalLink.getAttribute('href');
    }
    
    // Get description text (everything after the links)
    const fullText = await item.textContent();
    const descriptionText = fullText?.replace(name, '').trim() || '';
    
    const { description, freeTierDetails, pricing } = parseToolDescription(descriptionText);
    
    return {
      name: sanitizeHtml(name.trim()),
      slug: slug.substring(0, 100), // Max 100 chars per requirement
      externalUrl,
      description: description.substring(0, 500), // Max 500 chars
      freeTierDetails,
      pricing,
    };
  }

  /**
   * Track tool for deduplication
   * Requirement 6.12: Handle duplicate tools across categories
   */
  private trackTool(tool: ScrapedTool, categorySlug: string): void {
    const existing = this.toolsBySlug.get(tool.slug);
    if (existing) {
      if (!existing.categoryIds.includes(categorySlug)) {
        existing.categoryIds.push(categorySlug);
      }
    } else {
      this.toolsBySlug.set(tool.slug, {
        ...tool,
        categoryIds: [categorySlug],
      });
    }
  }

  /**
   * Extract previous/next navigation
   */
  private async extractPrevNextNav(): Promise<{ previous: string | null; next: string | null }> {
    if (!this.page) return { previous: null, next: null };
    
    let previous: string | null = null;
    let next: string | null = null;
    
    // Find Previous Page link
    const prevLink = await this.page.$('a[href^="/free-ai-tools/"]:has-text("Previous")');
    if (prevLink) {
      const href = await prevLink.getAttribute('href');
      previous = extractCategorySlug(href || '');
    }
    
    // Find Next Page link
    const nextLink = await this.page.$('a[href^="/free-ai-tools/"]:has-text("Next")');
    if (nextLink) {
      const href = await nextLink.getAttribute('href');
      next = extractCategorySlug(href || '');
    }
    
    return { previous, next };
  }


  /**
   * Run the complete scraping process
   */
  async run(): Promise<void> {
    this.logger.logStart();
    
    try {
      await this.init();
      
      // Step 1: Scrape main page
      console.log('\n[Step 1] Scraping main page...');
      await this.navigateTo(CONFIG.baseUrl);
      
      const categories = await withRetry(
        () => this.scrapeCategories(),
        this.logger,
        'scrapeCategories'
      );
      console.log(`    Found ${categories.length} categories`);
      
      const featuredTools = await withRetry(
        () => this.scrapeFeaturedTools(),
        this.logger,
        'scrapeFeaturedTools'
      );
      console.log(`    Found ${featuredTools.length} featured tools`);
      
      const faqItems = await withRetry(
        () => this.scrapeFAQItems(),
        this.logger,
        'scrapeFAQItems'
      );
      console.log(`    Found ${faqItems.length} FAQ items`);
      
      // Step 2: Scrape each category page
      console.log('\n[Step 2] Scraping category pages...');
      const categoryData: Map<string, ScrapedCategoryPage> = new Map();
      
      for (const category of categories) {
        try {
          const pageData = await withRetry(
            () => this.scrapeCategoryPage(category.slug),
            this.logger,
            category.slug
          );
          
          if (pageData) {
            categoryData.set(category.slug, pageData);
          }
        } catch (error) {
          // Continue with remaining categories on failure
          this.logger.logError(`Skipping category ${category.slug}: ${(error as Error).message}`);
        }
      }
      
      // Step 3: Write output JSON files
      console.log('\n[Step 3] Writing output JSON files...');
      await this.writeOutputFiles(categories, categoryData, featuredTools, faqItems);
      
      // Step 4: Write to Supabase database
      await this.writeToDatabase(categories, categoryData, faqItems);
      
    } finally {
      await this.close();
      this.logComplete();
    }
  }

  /**
   * Log completion summary including database results
   */
  private logComplete(): void {
    this.logger.logComplete();
    
    // Log database results if database writes were enabled
    if (CONFIG.writeToDatabase && this.scraperDb) {
      console.log('\n' + '='.repeat(60));
      console.log('DATABASE SUMMARY');
      console.log('='.repeat(60));
      console.log(`Categories:       ${this.dbResults.categories.success} success, ${this.dbResults.categories.failed} failed`);
      console.log(`Tools:            ${this.dbResults.tools.success} success, ${this.dbResults.tools.failed} failed`);
      console.log(`Tool-Categories:  ${this.dbResults.toolCategories.success} success, ${this.dbResults.toolCategories.failed} failed`);
      console.log(`FAQs:             ${this.dbResults.faqs.success} success, ${this.dbResults.faqs.failed} failed`);
      
      const totalErrors = 
        this.dbResults.categories.errors.length +
        this.dbResults.tools.errors.length +
        this.dbResults.toolCategories.errors.length +
        this.dbResults.faqs.errors.length;
      
      if (totalErrors > 0) {
        console.log(`\n⚠️ Total database errors: ${totalErrors}`);
        
        if (this.dbResults.categories.errors.length > 0) {
          console.log('\nCategory errors:');
          this.dbResults.categories.errors.slice(0, 5).forEach(e => console.log(`  - ${e}`));
          if (this.dbResults.categories.errors.length > 5) {
            console.log(`  ... and ${this.dbResults.categories.errors.length - 5} more`);
          }
        }
        
        if (this.dbResults.tools.errors.length > 0) {
          console.log('\nTool errors:');
          this.dbResults.tools.errors.slice(0, 5).forEach(e => console.log(`  - ${e}`));
          if (this.dbResults.tools.errors.length > 5) {
            console.log(`  ... and ${this.dbResults.tools.errors.length - 5} more`);
          }
        }
      }
      
      console.log('='.repeat(60));
    }
  }

  /**
   * Write data to Supabase database
   * Requirements 12.1, 12.2, 12.3, 12.4, 12.5
   */
  private async writeToDatabase(
    categories: ScrapedCategory[],
    categoryData: Map<string, ScrapedCategoryPage>,
    faqItems: ScrapedFAQItem[]
  ): Promise<void> {
    if (!this.scraperDb) {
      console.log('    [Database] Skipping database writes (not configured)');
      return;
    }

    console.log('\n[Step 4] Writing to Supabase database...');

    // 1. Upsert categories
    console.log('    Upserting categories...');
    const categoryInserts: ScraperCategoryInsert[] = categories.map((cat, index) => ({
      name: cat.name,
      slug: cat.slug,
      icon: cat.iconUrl || null,
      tool_count: categoryData.get(cat.slug)?.subcategories.reduce(
        (sum, s) => sum + s.tools.length, 0
      ) || 0,
      display_order: index,
    }));

    const categoryResult = await this.scraperDb.upsertCategories(categoryInserts);
    this.dbResults.categories = categoryResult;
    console.log(`    ✅ Categories: ${categoryResult.success} success, ${categoryResult.failed} failed`);

    // 2. Build category slug to ID map
    const categorySlugToId = new Map<string, string>();
    for (const cat of categories) {
      const dbCat = await this.scraperDb.getCategoryBySlug(cat.slug);
      if (dbCat) {
        categorySlugToId.set(cat.slug, dbCat.id);
      }
    }

    // 3. Upsert tools from all categories
    console.log('    Upserting tools...');
    const toolInserts: ScraperToolInsert[] = [];
    const toolCategoryRelations: { toolSlug: string; categorySlug: string }[] = [];

    for (const [categorySlug, data] of categoryData) {
      for (const subcategory of data.subcategories) {
        for (const tool of subcategory.tools) {
          // Check if we already have this tool (deduplication)
          const existingIndex = toolInserts.findIndex(t => t.slug === tool.slug);
          if (existingIndex === -1) {
            toolInserts.push({
              name: tool.name,
              slug: tool.slug,
              website_url: tool.externalUrl || `https://${tool.slug}.com`,
              external_url: tool.externalUrl || null,
              description: tool.description || null,
              free_tier_details: tool.freeTierDetails || null,
              pricing: normalizePricing(tool.pricing),
            });
          }
          
          // Track tool-category relationship
          toolCategoryRelations.push({
            toolSlug: tool.slug,
            categorySlug,
          });
        }
      }
    }

    const toolResult = await this.scraperDb.upsertTools(toolInserts);
    this.dbResults.tools = toolResult;
    console.log(`    ✅ Tools: ${toolResult.success} success, ${toolResult.failed} failed`);

    // 4. Build tool slug to ID map and create tool-category relationships
    console.log('    Creating tool-category relationships...');
    const toolCategoryInserts: ScraperToolCategoryInsert[] = [];
    const processedRelations = new Set<string>();

    for (const rel of toolCategoryRelations) {
      const relationKey = `${rel.toolSlug}:${rel.categorySlug}`;
      if (processedRelations.has(relationKey)) continue;
      processedRelations.add(relationKey);

      const tool = await this.scraperDb.getToolBySlug(rel.toolSlug);
      const categoryId = categorySlugToId.get(rel.categorySlug);

      if (tool && categoryId) {
        toolCategoryInserts.push({
          tool_id: tool.id,
          category_id: categoryId,
        });
      }
    }

    const toolCategoryResult = await this.scraperDb.upsertToolCategories(toolCategoryInserts);
    this.dbResults.toolCategories = toolCategoryResult;
    console.log(`    ✅ Tool-Categories: ${toolCategoryResult.success} success, ${toolCategoryResult.failed} failed`);

    // 5. Upsert FAQs
    console.log('    Upserting FAQs...');
    const faqInserts: ScraperFaqInsert[] = faqItems.map((faq, index) => ({
      question: faq.question,
      answer: faq.answer,
      display_order: index,
    }));

    const faqResult = await this.scraperDb.upsertFaqs(faqInserts);
    this.dbResults.faqs = faqResult;
    console.log(`    ✅ FAQs: ${faqResult.success} success, ${faqResult.failed} failed`);
  }

  /**
   * Write all output JSON files
   * Requirements 6.7, 6.8: Output structured JSON with pretty-printing
   */
  private async writeOutputFiles(
    categories: ScrapedCategory[],
    categoryData: Map<string, ScrapedCategoryPage>,
    featuredTools: ScrapedFeaturedTool[],
    faqItems: ScrapedFAQItem[]
  ): Promise<void> {
    if (!CONFIG.writeToJsonFiles) {
      console.log('    [JSON] Skipping JSON file writes (disabled)');
      return;
    }

    // Ensure directories exist
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
    if (!fs.existsSync(CONFIG.categoriesDir)) {
      fs.mkdirSync(CONFIG.categoriesDir, { recursive: true });
    }
    
    const now = new Date().toISOString();
    
    // Build categories list with navigation
    const categoriesList = categories.map((cat, index) => ({
      id: generateId(),
      name: cat.name,
      slug: cat.slug,
      icon: cat.iconUrl,
      toolCount: categoryData.get(cat.slug)?.subcategories.reduce(
        (sum, s) => sum + s.tools.length, 0
      ) || 0,
    }));
    
    // Write categories.json
    this.writeJsonFile(
      path.join(CONFIG.outputDir, 'categories.json'),
      categoriesList
    );
    console.log(`    Written: categories.json (${categoriesList.length} categories)`);
    
    // Write featured-tools.json
    const featuredToolsWithIds = featuredTools.map((tool, index) => ({
      id: generateId(),
      ...tool,
      displayOrder: index,
    }));
    this.writeJsonFile(
      path.join(CONFIG.outputDir, 'featured-tools.json'),
      featuredToolsWithIds
    );
    console.log(`    Written: featured-tools.json (${featuredToolsWithIds.length} tools)`);
    
    // Write faq.json
    this.writeJsonFile(
      path.join(CONFIG.outputDir, 'faq.json'),
      faqItems
    );
    console.log(`    Written: faq.json (${faqItems.length} items)`);
    
    // Write individual category files
    for (const [slug, data] of categoryData) {
      const categoryIndex = categories.findIndex(c => c.slug === slug);
      const category = categories[categoryIndex];
      
      const categoryFile = {
        id: generateId(),
        name: data.title || category?.name || slug,
        slug,
        icon: category?.iconUrl || '',
        description: data.description,
        toolCount: data.subcategories.reduce((sum, s) => sum + s.tools.length, 0),
        subcategories: data.subcategories.map(sub => ({
          id: generateId(),
          name: sub.name,
          toolCount: sub.tools.length,
          tools: sub.tools.map(tool => ({
            id: generateId(),
            ...tool,
            categoryIds: [slug],
          })),
        })),
        previousCategory: categoryIndex > 0 
          ? { name: categories[categoryIndex - 1].name, slug: categories[categoryIndex - 1].slug }
          : null,
        nextCategory: categoryIndex < categories.length - 1
          ? { name: categories[categoryIndex + 1].name, slug: categories[categoryIndex + 1].slug }
          : null,
        createdAt: now,
        updatedAt: now,
      };
      
      this.writeJsonFile(
        path.join(CONFIG.categoriesDir, `${slug}.json`),
        categoryFile
      );
    }
    console.log(`    Written: ${categoryData.size} category files`);
    
    // Write scraping-metadata.json
    const metadata = this.logger.getMetadata();
    this.writeJsonFile(
      path.join(CONFIG.outputDir, 'scraping-metadata.json'),
      {
        lastScrapedAt: now,
        totalTools: metadata.toolsExtracted,
        totalCategories: categories.length,
        scrapeDurationMs: metadata.durationMs,
        version: CONFIG.version,
      }
    );
    console.log('    Written: scraping-metadata.json');
  }

  /**
   * Write JSON file with pretty-printing
   * Requirement 6.8: 2-space indentation, UTF-8 encoding
   */
  private writeJsonFile(filePath: string, data: unknown): void {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}

// =============================================================================
// Main Entry Point
// =============================================================================

async function main(): Promise<void> {
  const scraper = new FreeAIToolsScraper();
  
  try {
    await scraper.run();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
