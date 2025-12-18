/**
 * Unit Tests for Code Generators
 * 
 * Tests component generation, service generation, and SEO metadata generation.
 * Requirements: 4.1, 5.5, 8.1
 */

import { describe, it, expect } from 'vitest';
import {
  generateComponent,
  generatePage,
  formatImports,
  formatPropsInterface,
  indent,
  type ComponentConfig,
  type PageConfig,
} from './component-generator';
import {
  generateService,
  generateDataFetcher,
  generateCacheWrapper,
  type ServiceConfig,
  type DataFetcherConfig,
  type CacheWrapperConfig,
} from './service-generator';
import {
  generateMetadata,
  generateStructuredData,
  generateSitemapEntry,
  generateBreadcrumbData,
  generateFAQData,
  generateJsonLdComponent,
  type MetadataConfig,
  type StructuredDataConfig,
  type SitemapEntryConfig,
} from './seo-generator';

// =============================================================================
// Component Generator Tests
// =============================================================================

describe('Component Generator', () => {
  describe('generateComponent', () => {
    it('should generate a basic component with props', () => {
      const config: ComponentConfig = {
        name: 'TestCard',
        description: 'A test card component',
        props: [
          { name: 'title', type: 'string', required: true, description: 'Card title' },
          { name: 'count', type: 'number', required: false, defaultValue: '0' },
        ],
      };

      const result = generateComponent(config);

      expect(result).toContain('export function TestCard');
      expect(result).toContain('interface TestCardProps');
      expect(result).toContain('title: string;');
      expect(result).toContain('count?: number;');
      expect(result).toContain('/** Card title */');
      expect(result).toContain('export default TestCard');
    });

    it('should add use client directive for client components', () => {
      const config: ComponentConfig = {
        name: 'ClientComponent',
        description: 'A client component',
        props: [],
        isClientComponent: true,
      };

      const result = generateComponent(config);

      expect(result).toMatch(/^'use client';/);
    });

    it('should include className prop when specified', () => {
      const config: ComponentConfig = {
        name: 'StyledComponent',
        description: 'A styled component',
        props: [],
        className: true,
      };

      const result = generateComponent(config);

      expect(result).toContain('className?: string;');
      expect(result).toContain("import { cn } from '@/lib/utils'");
    });

    it('should include children prop when specified', () => {
      const config: ComponentConfig = {
        name: 'ContainerComponent',
        description: 'A container component',
        props: [],
        children: true,
      };

      const result = generateComponent(config);

      expect(result).toContain('children?: React.ReactNode;');
      expect(result).toContain('{children}');
    });

    it('should include requirement references in JSDoc', () => {
      const config: ComponentConfig = {
        name: 'RequiredComponent',
        description: 'A component with requirements',
        props: [],
        requirements: ['4.1', '4.2'],
      };

      const result = generateComponent(config);

      expect(result).toContain('Requirements: 4.1, 4.2');
    });
  });

  describe('generatePage', () => {
    it('should generate a basic page with metadata', () => {
      const config: PageConfig = {
        route: 'test-page',
        title: 'Test Page',
        description: 'A test page description',
        serviceName: 'testService',
        servicePath: '@/lib/services/test.service',
        dataFetcher: 'getData',
        components: [{ name: 'TestComponent', path: '@/components/TestComponent' }],
      };

      const result = generatePage(config);

      expect(result).toContain("import { Metadata } from 'next'");
      expect(result).toContain("import { testService } from '@/lib/services/test.service'");
      expect(result).toContain('export const revalidate');
      expect(result).toContain('export async function generateMetadata');
      expect(result).toContain('export default async function Page');
    });

    it('should handle dynamic routes with params', () => {
      const config: PageConfig = {
        route: 'tools/[slug]',
        title: '${data.name} - Tools',
        description: '${data.description}',
        serviceName: 'toolsService',
        servicePath: '@/lib/services/tools.service',
        dataFetcher: 'getToolBySlug',
        components: [],
        hasParams: true,
        paramName: 'slug',
      };

      const result = generatePage(config);

      expect(result).toContain('params: Promise<{ slug: string }>');
      expect(result).toContain('const { slug } = await params');
      expect(result).toContain('notFound()');
    });

    it('should include JSON-LD when specified', () => {
      const config: PageConfig = {
        route: 'article',
        title: 'Article',
        description: 'An article',
        serviceName: 'articleService',
        servicePath: '@/lib/services/article.service',
        dataFetcher: 'getArticle',
        components: [],
        jsonLd: true,
        jsonLdType: 'Article',
      };

      const result = generatePage(config);

      expect(result).toContain('JsonLdScript');
      expect(result).toContain("'@type': 'Article'");
    });
  });

  describe('formatImports', () => {
    it('should format named imports correctly', () => {
      const imports = [
        { module: 'react', imports: ['useState', 'useEffect'] },
      ];

      const result = formatImports(imports);

      expect(result).toBe("import { useState, useEffect } from 'react';");
    });

    it('should format default imports correctly', () => {
      const imports = [
        { module: 'next/image', imports: ['Image'], isDefault: true },
      ];

      const result = formatImports(imports);

      expect(result).toBe("import Image from 'next/image';");
    });

    it('should format type-only imports correctly', () => {
      const imports = [
        { module: './types', imports: ['MyType'], isTypeOnly: true },
      ];

      const result = formatImports(imports);

      expect(result).toBe("import type { MyType } from './types';");
    });
  });

  describe('formatPropsInterface', () => {
    it('should format props interface correctly', () => {
      const result = formatPropsInterface('Test', [
        { name: 'id', type: 'string', required: true },
        { name: 'count', type: 'number', required: false },
      ]);

      expect(result).toContain('interface TestProps');
      expect(result).toContain('id: string;');
      expect(result).toContain('count?: number;');
    });

    it('should return empty string for no props', () => {
      const result = formatPropsInterface('Empty', []);

      expect(result).toBe('');
    });
  });

  describe('indent', () => {
    it('should indent code correctly', () => {
      const code = 'line1\nline2\nline3';
      const result = indent(code, 2);

      expect(result).toBe('  line1\n  line2\n  line3');
    });

    it('should not indent empty lines', () => {
      const code = 'line1\n\nline2';
      const result = indent(code, 2);

      expect(result).toBe('  line1\n\n  line2');
    });
  });
});

// =============================================================================
// Service Generator Tests
// =============================================================================

describe('Service Generator', () => {
  describe('generateService', () => {
    it('should generate a service class with cache management', () => {
      const config: ServiceConfig = {
        name: 'Test',
        description: 'A test service',
        dataPath: '@/data/test',
        typesPath: '@/lib/types/test',
        types: ['TestItem', 'TestCategory'],
        errorCodes: [
          { code: 'NOT_FOUND', retryable: false },
          { code: 'NETWORK_ERROR', retryable: true },
        ],
        methods: [
          {
            name: 'getItems',
            description: 'Get all items',
            params: [],
            returnType: 'TestItem[]',
            async: true,
            body: 'return [];',
          },
        ],
      };

      const result = generateService(config);

      expect(result).toContain('class TestService');
      expect(result).toContain('export class TestError extends Error');
      expect(result).toContain("export type TestErrorCode = 'NOT_FOUND' | 'NETWORK_ERROR'");
      expect(result).toContain('private cache = new Map');
      expect(result).toContain('getCached<T>');
      expect(result).toContain('setCache<T>');
      expect(result).toContain('invalidateCache');
      expect(result).toContain('async getItems()');
      expect(result).toContain('export const testService = new TestService()');
    });

    it('should include Zod schemas when specified', () => {
      const config: ServiceConfig = {
        name: 'Validated',
        description: 'A validated service',
        dataPath: '@/data/validated',
        typesPath: '@/lib/types/validated',
        types: ['Item'],
        schemas: ['ItemSchema'],
        errorCodes: [{ code: 'VALIDATION_ERROR', retryable: false }],
        methods: [],
      };

      const result = generateService(config);

      expect(result).toContain('ItemSchema');
    });

    it('should include requirement references', () => {
      const config: ServiceConfig = {
        name: 'Required',
        description: 'A service with requirements',
        dataPath: '@/data/required',
        typesPath: '@/lib/types/required',
        types: ['Item'],
        errorCodes: [],
        methods: [],
        requirements: ['5.5', '5.6'],
      };

      const result = generateService(config);

      expect(result).toContain('Requirements: 5.5, 5.6');
    });
  });

  describe('generateDataFetcher', () => {
    it('should generate a data fetcher with dynamic import', () => {
      const config: DataFetcherConfig = {
        name: 'fetchItems',
        description: 'Fetch items from data file',
        dataPath: '@/data/items.json',
        returnType: 'Item[]',
        dynamicImport: true,
      };

      const result = generateDataFetcher(config);

      expect(result).toContain('export async function fetchItems');
      expect(result).toContain('await import');
      expect(result).toContain('return data.default');
    });

    it('should include Zod validation when schema is specified', () => {
      const config: DataFetcherConfig = {
        name: 'fetchValidatedItems',
        description: 'Fetch and validate items',
        dataPath: '@/data/items.json',
        returnType: 'Item[]',
        schema: 'ItemsSchema',
      };

      const result = generateDataFetcher(config);

      expect(result).toContain('ItemsSchema.parse');
    });

    it('should handle return-null error handling', () => {
      const config: DataFetcherConfig = {
        name: 'fetchOptionalItems',
        description: 'Fetch items or return null',
        dataPath: '@/data/items.json',
        returnType: 'Item[] | null',
        errorHandling: 'return-null',
      };

      const result = generateDataFetcher(config);

      expect(result).toContain('return null');
    });
  });

  describe('generateCacheWrapper', () => {
    it('should generate a cache wrapper using React cache', () => {
      const config: CacheWrapperConfig = {
        name: 'getCachedItems',
        description: 'Get items with caching',
        wrappedFunction: 'fetchItems',
        cacheKeyPattern: 'items',
        ttl: 3600000,
        params: [{ name: 'id', type: 'string' }],
        returnType: 'Item[]',
      };

      const result = generateCacheWrapper(config);

      expect(result).toContain('export const getCachedItems = cache');
      expect(result).toContain('return fetchItems(id)');
      expect(result).toContain('TTL: 3600s');
    });
  });
});

// =============================================================================
// SEO Generator Tests
// =============================================================================

describe('SEO Generator', () => {
  describe('generateMetadata', () => {
    it('should generate static metadata', () => {
      const config: MetadataConfig = {
        title: 'Test Page',
        description: 'A test page description',
        path: '/test',
      };

      const result = generateMetadata(config);

      expect(result).toContain("import { Metadata } from 'next'");
      expect(result).toContain('export const metadata: Metadata');
      expect(result).toContain("title: 'Test Page'");
      expect(result).toContain("description: 'A test page description'");
    });

    it('should generate dynamic metadata for pages with params', () => {
      const config: MetadataConfig = {
        title: '${data.name}',
        description: '${data.description}',
        path: 'tools/${slug}',
        isDynamic: true,
        paramName: 'slug',
      };

      const result = generateMetadata(config);

      expect(result).toContain('export async function generateMetadata');
      expect(result).toContain('params: Promise<{ slug: string }>');
      expect(result).toContain('const { slug } = await params');
    });

    it('should include Open Graph metadata', () => {
      const config: MetadataConfig = {
        title: 'OG Test',
        description: 'OG description',
        path: '/og-test',
        openGraph: {
          type: 'article',
          siteName: 'Test Site',
          image: 'https://example.com/image.jpg',
        },
      };

      const result = generateMetadata(config);

      expect(result).toContain('openGraph:');
      expect(result).toContain("type: 'article'");
      expect(result).toContain("siteName: 'Test Site'");
      expect(result).toContain('images:');
    });

    it('should include Twitter card metadata', () => {
      const config: MetadataConfig = {
        title: 'Twitter Test',
        description: 'Twitter description',
        path: '/twitter-test',
        twitter: {
          card: 'summary_large_image',
          site: '@testsite',
        },
      };

      const result = generateMetadata(config);

      expect(result).toContain('twitter:');
      expect(result).toContain("card: 'summary_large_image'");
      expect(result).toContain("site: '@testsite'");
    });
  });

  describe('generateStructuredData', () => {
    it('should generate WebPage structured data', () => {
      const config: StructuredDataConfig = {
        type: 'WebPage',
        name: 'Test Page',
        description: 'A test page',
        url: 'https://example.com/test',
      };

      const result = generateStructuredData(config);

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('WebPage');
      expect(result.name).toBe('Test Page');
      expect(result.description).toBe('A test page');
      expect(result.url).toBe('https://example.com/test');
    });

    it('should generate BreadcrumbList structured data', () => {
      const config: StructuredDataConfig = {
        type: 'BreadcrumbList',
        name: 'Breadcrumb',
        description: 'Navigation',
        url: 'https://example.com',
        breadcrumbs: [
          { name: 'Home', url: 'https://example.com' },
          { name: 'Category', url: 'https://example.com/category' },
          { name: 'Item' },
        ],
      };

      const result = generateStructuredData(config);

      expect(result['@type']).toBe('BreadcrumbList');
      expect(result.itemListElement).toHaveLength(3);
      expect((result.itemListElement as Array<{ position: number }>)[0].position).toBe(1);
    });

    it('should generate FAQPage structured data', () => {
      const config: StructuredDataConfig = {
        type: 'FAQPage',
        name: 'FAQ',
        description: 'Frequently Asked Questions',
        url: 'https://example.com/faq',
        faqItems: [
          { question: 'What is this?', answer: 'This is a test.' },
          { question: 'How does it work?', answer: 'It works well.' },
        ],
      };

      const result = generateStructuredData(config);

      expect(result['@type']).toBe('FAQPage');
      expect(result.mainEntity).toHaveLength(2);
      expect((result.mainEntity as Array<{ '@type': string }>)[0]['@type']).toBe('Question');
    });

    it('should generate SoftwareApplication structured data', () => {
      const config: StructuredDataConfig = {
        type: 'SoftwareApplication',
        name: 'Test App',
        description: 'A test application',
        url: 'https://example.com/app',
        softwareApplication: {
          applicationCategory: 'Productivity',
          operatingSystem: 'Web',
          offers: { price: '0', priceCurrency: 'USD' },
          aggregateRating: { ratingValue: 4.5, reviewCount: 100 },
        },
      };

      const result = generateStructuredData(config);

      expect(result['@type']).toBe('SoftwareApplication');
      expect(result.applicationCategory).toBe('Productivity');
      expect(result.offers).toBeDefined();
      expect(result.aggregateRating).toBeDefined();
    });
  });

  describe('generateSitemapEntry', () => {
    it('should generate a sitemap entry', () => {
      const config: SitemapEntryConfig = {
        path: '/test-page',
        changeFrequency: 'weekly',
        priority: 0.8,
      };

      const result = generateSitemapEntry(config, 'https://example.com');

      expect(result.url).toBe('https://example.com/test-page');
      expect(result.changeFrequency).toBe('weekly');
      expect(result.priority).toBe(0.8);
      expect(result.lastModified).toBeInstanceOf(Date);
    });

    it('should handle paths without leading slash', () => {
      const config: SitemapEntryConfig = {
        path: 'test-page',
      };

      const result = generateSitemapEntry(config, 'https://example.com');

      expect(result.url).toBe('https://example.com/test-page');
    });
  });

  describe('generateBreadcrumbData', () => {
    it('should generate breadcrumb structured data', () => {
      const items = [
        { name: 'Home', url: '/' },
        { name: 'Products', url: '/products' },
        { name: 'Item' },
      ];

      const result = generateBreadcrumbData(items, 'https://example.com');

      expect(result['@type']).toBe('BreadcrumbList');
      expect(result.itemListElement).toHaveLength(3);
    });
  });

  describe('generateFAQData', () => {
    it('should generate FAQ structured data', () => {
      const items = [
        { question: 'Q1?', answer: 'A1' },
        { question: 'Q2?', answer: 'A2' },
      ];

      const result = generateFAQData(items, 'https://example.com/faq');

      expect(result['@type']).toBe('FAQPage');
      expect(result.mainEntity).toHaveLength(2);
    });
  });

  describe('generateJsonLdComponent', () => {
    it('should generate a JSON-LD component', () => {
      const result = generateJsonLdComponent('ArticleJsonLd', 'Article');

      expect(result).toContain('interface ArticleJsonLdProps');
      expect(result).toContain('export function ArticleJsonLd');
      expect(result).toContain("'@type': 'Article'");
      expect(result).toContain('dangerouslySetInnerHTML');
    });
  });
});
