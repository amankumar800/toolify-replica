/**
 * SEO Metadata Generator Utility
 * 
 * Generates SEO metadata, JSON-LD structured data, and sitemap entries
 * following Next.js App Router patterns and schema.org specifications.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

// =============================================================================
// Types and Interfaces
// =============================================================================

/**
 * Open Graph metadata configuration
 */
export interface OpenGraphConfig {
  /** OG title (defaults to page title) */
  title?: string;
  /** OG description (defaults to page description) */
  description?: string;
  /** OG image URL */
  image?: string;
  /** OG image alt text */
  imageAlt?: string;
  /** OG type (default: 'website') */
  type?: 'website' | 'article' | 'product' | 'profile';
  /** Site name */
  siteName?: string;
  /** Locale (default: 'en_US') */
  locale?: string;
}

/**
 * Twitter card metadata configuration
 */
export interface TwitterConfig {
  /** Card type */
  card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  /** Twitter site handle */
  site?: string;
  /** Twitter creator handle */
  creator?: string;
  /** Title (defaults to OG title) */
  title?: string;
  /** Description (defaults to OG description) */
  description?: string;
  /** Image URL (defaults to OG image) */
  image?: string;
}

/**
 * Configuration for generating page metadata
 */
export interface MetadataConfig {
  /** Page title */
  title: string;
  /** Meta description */
  description: string;
  /** Page URL path (without base URL) */
  path: string;
  /** Base URL (defaults to env variable) */
  baseUrl?: string;
  /** Keywords for meta keywords tag */
  keywords?: string[];
  /** Open Graph configuration */
  openGraph?: OpenGraphConfig;
  /** Twitter card configuration */
  twitter?: TwitterConfig;
  /** Canonical URL (defaults to baseUrl + path) */
  canonical?: string;
  /** Robots directives */
  robots?: {
    index?: boolean;
    follow?: boolean;
    noarchive?: boolean;
    nosnippet?: boolean;
  };
  /** Alternate language versions */
  alternates?: Array<{
    hrefLang: string;
    href: string;
  }>;
  /** Whether this is a dynamic page with params */
  isDynamic?: boolean;
  /** Param name for dynamic pages */
  paramName?: string;
}

/**
 * JSON-LD structured data types
 */
export type JsonLdType = 
  | 'WebPage'
  | 'CollectionPage'
  | 'Article'
  | 'BlogPosting'
  | 'Product'
  | 'SoftwareApplication'
  | 'Organization'
  | 'BreadcrumbList'
  | 'FAQPage'
  | 'HowTo'
  | 'ItemList';

/**
 * Breadcrumb item for structured data
 */
export interface BreadcrumbItem {
  /** Display name */
  name: string;
  /** URL (optional for last item) */
  url?: string;
}

/**
 * FAQ item for structured data
 */
export interface FAQItem {
  /** Question text */
  question: string;
  /** Answer text */
  answer: string;
}

/**
 * HowTo step for structured data
 */
export interface HowToStep {
  /** Step name/title */
  name: string;
  /** Step description */
  text: string;
  /** Step image URL (optional) */
  image?: string;
}

/**
 * Configuration for generating JSON-LD structured data
 */
export interface StructuredDataConfig {
  /** Schema.org type */
  type: JsonLdType;
  /** Page name/title */
  name: string;
  /** Page description */
  description: string;
  /** Page URL */
  url: string;
  /** Main image URL */
  image?: string;
  /** Date published (ISO string) */
  datePublished?: string;
  /** Date modified (ISO string) */
  dateModified?: string;
  /** Author information */
  author?: {
    name: string;
    url?: string;
  };
  /** Publisher/organization information */
  publisher?: {
    name: string;
    logo?: string;
    url?: string;
  };
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];
  /** FAQ items (for FAQPage type) */
  faqItems?: FAQItem[];
  /** HowTo steps (for HowTo type) */
  howToSteps?: HowToStep[];
  /** Item list items (for ItemList/CollectionPage) */
  listItems?: Array<{
    name: string;
    url: string;
    position?: number;
  }>;
  /** Software application specific fields */
  softwareApplication?: {
    applicationCategory: string;
    operatingSystem?: string;
    offers?: {
      price: string;
      priceCurrency: string;
    };
    aggregateRating?: {
      ratingValue: number;
      reviewCount: number;
    };
  };
  /** Additional custom properties */
  additionalProperties?: Record<string, unknown>;
}

/**
 * Configuration for generating sitemap entry
 */
export interface SitemapEntryConfig {
  /** Page URL path (without base URL) */
  path: string;
  /** Last modified date */
  lastModified?: Date;
  /** Change frequency */
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  /** Priority (0.0 to 1.0) */
  priority?: number;
}

// =============================================================================
// Metadata Generator
// =============================================================================

/**
 * Generates Next.js Metadata object for a page
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 * 
 * @param config - Metadata configuration
 * @returns Next.js Metadata object code as string
 */
export function generateMetadata(config: MetadataConfig): string {
  const {
    title,
    description,
    path,
    baseUrl = "process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'",
    keywords = [],
    openGraph = {},
    twitter = {},
    canonical,
    robots = { index: true, follow: true },
    alternates = [],
    isDynamic = false,
    paramName = 'slug',
  } = config;

  const lines: string[] = [];

  // Import statement
  lines.push("import { Metadata } from 'next';");
  lines.push('');

  // Function signature
  if (isDynamic) {
    lines.push(`export async function generateMetadata(`);
    lines.push(`  { params }: { params: Promise<{ ${paramName}: string }> }`);
    lines.push(`): Promise<Metadata> {`);
    lines.push(`  const { ${paramName} } = await params;`);
    lines.push(`  const baseUrl = ${baseUrl};`);
    lines.push('');
  } else {
    lines.push(`export const metadata: Metadata = {`);
  }

  // Build metadata object
  const metadataLines: string[] = [];
  
  // Title
  if (isDynamic) {
    metadataLines.push(`  title: \`${title}\`,`);
  } else {
    metadataLines.push(`  title: '${escapeString(title)}',`);
  }
  
  // Description
  if (isDynamic) {
    metadataLines.push(`  description: \`${description}\`,`);
  } else {
    metadataLines.push(`  description: '${escapeString(description)}',`);
  }
  
  // Keywords
  if (keywords.length) {
    metadataLines.push(`  keywords: [${keywords.map(k => `'${escapeString(k)}'`).join(', ')}],`);
  }
  
  // Robots
  if (!robots.index || !robots.follow || robots.noarchive || robots.nosnippet) {
    const robotsDirectives: string[] = [];
    if (!robots.index) robotsDirectives.push('noindex');
    if (!robots.follow) robotsDirectives.push('nofollow');
    if (robots.noarchive) robotsDirectives.push('noarchive');
    if (robots.nosnippet) robotsDirectives.push('nosnippet');
    metadataLines.push(`  robots: '${robotsDirectives.join(', ')}',`);
  }
  
  // Open Graph
  metadataLines.push('  openGraph: {');
  metadataLines.push(`    title: ${isDynamic ? `\`${openGraph.title || title}\`` : `'${escapeString(openGraph.title || title)}'`},`);
  metadataLines.push(`    description: ${isDynamic ? `\`${openGraph.description || description}\`` : `'${escapeString(openGraph.description || description)}'`},`);
  
  if (isDynamic) {
    metadataLines.push(`    url: \`\${baseUrl}/${path}\`,`);
  } else {
    metadataLines.push(`    url: '${path}',`);
  }
  
  metadataLines.push(`    type: '${openGraph.type || 'website'}',`);
  
  if (openGraph.siteName) {
    metadataLines.push(`    siteName: '${escapeString(openGraph.siteName)}',`);
  }
  
  if (openGraph.locale) {
    metadataLines.push(`    locale: '${openGraph.locale}',`);
  }
  
  if (openGraph.image) {
    metadataLines.push('    images: [');
    metadataLines.push('      {');
    metadataLines.push(`        url: '${openGraph.image}',`);
    if (openGraph.imageAlt) {
      metadataLines.push(`        alt: '${escapeString(openGraph.imageAlt)}',`);
    }
    metadataLines.push('      },');
    metadataLines.push('    ],');
  }
  
  metadataLines.push('  },');
  
  // Twitter
  metadataLines.push('  twitter: {');
  metadataLines.push(`    card: '${twitter.card || 'summary_large_image'}',`);
  
  if (twitter.site) {
    metadataLines.push(`    site: '${twitter.site}',`);
  }
  
  if (twitter.creator) {
    metadataLines.push(`    creator: '${twitter.creator}',`);
  }
  
  metadataLines.push('  },');
  
  // Alternates (canonical URL)
  metadataLines.push('  alternates: {');
  if (isDynamic) {
    metadataLines.push(`    canonical: ${canonical ? `'${canonical}'` : `\`\${baseUrl}/${path}\``},`);
  } else {
    metadataLines.push(`    canonical: '${canonical || path}',`);
  }
  
  if (alternates.length) {
    metadataLines.push('    languages: {');
    alternates.forEach(alt => {
      metadataLines.push(`      '${alt.hrefLang}': '${alt.href}',`);
    });
    metadataLines.push('    },');
  }
  
  metadataLines.push('  },');

  // Close metadata object
  if (isDynamic) {
    lines.push('  return {');
    metadataLines.forEach(line => lines.push('  ' + line));
    lines.push('  };');
    lines.push('}');
  } else {
    metadataLines.forEach(line => lines.push(line));
    lines.push('};');
  }

  return lines.join('\n');
}

// =============================================================================
// Structured Data Generator
// =============================================================================

/**
 * Generates JSON-LD structured data following schema.org specifications
 * 
 * Requirements: 8.5
 * 
 * @param config - Structured data configuration
 * @returns JSON-LD object
 */
export function generateStructuredData(config: StructuredDataConfig): Record<string, unknown> {
  const {
    type,
    name,
    description,
    url,
    image,
    datePublished,
    dateModified,
    author,
    publisher,
    breadcrumbs,
    faqItems,
    howToSteps,
    listItems,
    softwareApplication,
    additionalProperties = {},
  } = config;

  const baseData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    description,
    url,
  };

  // Add image if provided
  if (image) {
    baseData.image = image;
  }

  // Add dates if provided
  if (datePublished) {
    baseData.datePublished = datePublished;
  }
  if (dateModified) {
    baseData.dateModified = dateModified;
  }

  // Add author if provided
  if (author) {
    baseData.author = {
      '@type': 'Person',
      name: author.name,
      ...(author.url && { url: author.url }),
    };
  }

  // Add publisher if provided
  if (publisher) {
    baseData.publisher = {
      '@type': 'Organization',
      name: publisher.name,
      ...(publisher.url && { url: publisher.url }),
      ...(publisher.logo && {
        logo: {
          '@type': 'ImageObject',
          url: publisher.logo,
        },
      }),
    };
  }

  // Handle specific types
  switch (type) {
    case 'BreadcrumbList':
      if (breadcrumbs?.length) {
        baseData.itemListElement = breadcrumbs.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          ...(item.url && { item: item.url }),
        }));
      }
      break;

    case 'FAQPage':
      if (faqItems?.length) {
        baseData.mainEntity = faqItems.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        }));
      }
      break;

    case 'HowTo':
      if (howToSteps?.length) {
        baseData.step = howToSteps.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.name,
          text: step.text,
          ...(step.image && { image: step.image }),
        }));
      }
      break;

    case 'ItemList':
    case 'CollectionPage':
      if (listItems?.length) {
        baseData.mainEntity = {
          '@type': 'ItemList',
          itemListElement: listItems.map((item, index) => ({
            '@type': 'ListItem',
            position: item.position ?? index + 1,
            name: item.name,
            url: item.url,
          })),
        };
      }
      break;

    case 'SoftwareApplication':
      if (softwareApplication) {
        baseData.applicationCategory = softwareApplication.applicationCategory;
        if (softwareApplication.operatingSystem) {
          baseData.operatingSystem = softwareApplication.operatingSystem;
        }
        if (softwareApplication.offers) {
          baseData.offers = {
            '@type': 'Offer',
            price: softwareApplication.offers.price,
            priceCurrency: softwareApplication.offers.priceCurrency,
          };
        }
        if (softwareApplication.aggregateRating) {
          baseData.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: softwareApplication.aggregateRating.ratingValue,
            reviewCount: softwareApplication.aggregateRating.reviewCount,
          };
        }
      }
      break;
  }

  // Merge additional properties
  return { ...baseData, ...additionalProperties };
}

/**
 * Generates JSON-LD script tag code for embedding in a page
 * 
 * @param config - Structured data configuration
 * @returns JSX code for JSON-LD script tag
 */
export function generateStructuredDataScript(config: StructuredDataConfig): string {
  const data = generateStructuredData(config);
  
  return `<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(${JSON.stringify(data, null, 2).split('\n').map((line, i) => i === 0 ? line : '    ' + line).join('\n')}),
  }}
/>`;
}

/**
 * Generates a reusable JSON-LD component
 * 
 * @param componentName - Name for the component
 * @param type - Schema.org type
 * @returns React component code as string
 */
export function generateJsonLdComponent(componentName: string, type: JsonLdType): string {
  const lines: string[] = [];

  lines.push('/**');
  lines.push(` * ${componentName} - JSON-LD Structured Data Component`);
  lines.push(' *');
  lines.push(` * Renders schema.org ${type} structured data for SEO.`);
  lines.push(' */');
  lines.push(`interface ${componentName}Props {`);
  lines.push('  data: {');
  lines.push('    name: string;');
  lines.push('    description: string;');
  lines.push('    url: string;');
  lines.push('    [key: string]: unknown;');
  lines.push('  };');
  lines.push('}');
  lines.push('');
  lines.push(`export function ${componentName}({ data }: ${componentName}Props) {`);
  lines.push('  const structuredData = {');
  lines.push("    '@context': 'https://schema.org',");
  lines.push(`    '@type': '${type}',`);
  lines.push('    ...data,');
  lines.push('  };');
  lines.push('');
  lines.push('  return (');
  lines.push('    <script');
  lines.push('      type="application/ld+json"');
  lines.push('      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}');
  lines.push('    />');
  lines.push('  );');
  lines.push('}');

  return lines.join('\n');
}

// =============================================================================
// Sitemap Entry Generator
// =============================================================================

/**
 * Generates a sitemap entry object
 * 
 * Requirements: 8.6
 * 
 * @param config - Sitemap entry configuration
 * @param baseUrl - Base URL for the site
 * @returns Sitemap entry object
 */
export function generateSitemapEntry(
  config: SitemapEntryConfig,
  baseUrl: string = ''
): {
  url: string;
  lastModified: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
} {
  const {
    path,
    lastModified = new Date(),
    changeFrequency,
    priority,
  } = config;

  const entry: {
    url: string;
    lastModified: Date;
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
  } = {
    url: `${baseUrl}${path.startsWith('/') ? path : '/' + path}`,
    lastModified,
  };

  if (changeFrequency) {
    entry.changeFrequency = changeFrequency;
  }

  if (priority !== undefined) {
    entry.priority = priority;
  }

  return entry;
}

/**
 * Generates sitemap entries for a collection of items
 * 
 * @param items - Array of items with path property
 * @param baseUrl - Base URL for the site
 * @param defaults - Default values for changeFrequency and priority
 * @returns Array of sitemap entries
 */
export function generateSitemapEntries<T extends { path?: string; slug?: string }>(
  items: T[],
  baseUrl: string,
  pathPrefix: string = '',
  defaults: {
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
  } = {}
): Array<{
  url: string;
  lastModified: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}> {
  return items.map(item => {
    const itemPath = item.path || item.slug || '';
    const fullPath = pathPrefix ? `${pathPrefix}/${itemPath}` : itemPath;
    
    return generateSitemapEntry(
      {
        path: fullPath,
        changeFrequency: defaults.changeFrequency,
        priority: defaults.priority,
      },
      baseUrl
    );
  });
}

/**
 * Generates a complete sitemap.ts file
 * 
 * @param config - Configuration for sitemap generation
 * @returns Sitemap file code as string
 */
export function generateSitemapFile(config: {
  staticRoutes: string[];
  dynamicRoutes: Array<{
    serviceName: string;
    servicePath: string;
    fetcherMethod: string;
    pathPrefix: string;
    slugField?: string;
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
  }>;
}): string {
  const { staticRoutes, dynamicRoutes } = config;
  const lines: string[] = [];

  // Imports
  lines.push("import { MetadataRoute } from 'next';");
  
  // Service imports
  const serviceImports = new Map<string, Set<string>>();
  dynamicRoutes.forEach(route => {
    if (!serviceImports.has(route.servicePath)) {
      serviceImports.set(route.servicePath, new Set());
    }
    serviceImports.get(route.servicePath)!.add(route.serviceName);
  });
  
  serviceImports.forEach((services, path) => {
    lines.push(`import { ${Array.from(services).join(', ')} } from '${path}';`);
  });
  
  lines.push('');

  // Main function
  lines.push('export default async function sitemap(): Promise<MetadataRoute.Sitemap> {');
  lines.push("  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';");
  lines.push('');

  // Static routes
  lines.push('  // Static Routes');
  lines.push(`  const staticRoutes = [${staticRoutes.map(r => `'${r}'`).join(', ')}].map((route) => ({`);
  lines.push('    url: `${baseUrl}${route}`,');
  lines.push('    lastModified: new Date(),');
  lines.push('  }));');
  lines.push('');

  // Dynamic routes
  dynamicRoutes.forEach((route, index) => {
    const varName = `dynamicRoutes${index + 1}`;
    lines.push(`  // Dynamic Routes: ${route.pathPrefix}`);
    lines.push(`  const ${varName}Items = await ${route.serviceName}.${route.fetcherMethod}();`);
    lines.push(`  const ${varName} = ${varName}Items.map((item) => ({`);
    lines.push(`    url: \`\${baseUrl}${route.pathPrefix}/\${item.${route.slugField || 'slug'}}\`,`);
    lines.push('    lastModified: new Date(),');
    if (route.changeFrequency) {
      lines.push(`    changeFrequency: '${route.changeFrequency}' as const,`);
    }
    if (route.priority !== undefined) {
      lines.push(`    priority: ${route.priority},`);
    }
    lines.push('  }));');
    lines.push('');
  });

  // Return combined routes
  const routeVars = ['...staticRoutes', ...dynamicRoutes.map((_, i) => `...dynamicRoutes${i + 1}`)];
  lines.push('  return [');
  lines.push(`    ${routeVars.join(',\n    ')},`);
  lines.push('  ];');
  lines.push('}');

  return lines.join('\n');
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Escapes special characters in strings for use in generated code
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Generates breadcrumb structured data for a page
 * 
 * @param items - Breadcrumb items
 * @param baseUrl - Base URL for the site
 * @returns JSON-LD breadcrumb object
 */
export function generateBreadcrumbData(
  items: BreadcrumbItem[],
  baseUrl: string = ''
): Record<string, unknown> {
  return generateStructuredData({
    type: 'BreadcrumbList',
    name: 'Breadcrumb',
    description: 'Navigation breadcrumb',
    url: baseUrl,
    breadcrumbs: items.map(item => ({
      name: item.name,
      url: item.url ? (item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`) : undefined,
    })),
  });
}

/**
 * Generates FAQ structured data
 * 
 * @param items - FAQ items
 * @param pageUrl - URL of the FAQ page
 * @returns JSON-LD FAQ object
 */
export function generateFAQData(
  items: FAQItem[],
  pageUrl: string
): Record<string, unknown> {
  return generateStructuredData({
    type: 'FAQPage',
    name: 'Frequently Asked Questions',
    description: 'Common questions and answers',
    url: pageUrl,
    faqItems: items,
  });
}
