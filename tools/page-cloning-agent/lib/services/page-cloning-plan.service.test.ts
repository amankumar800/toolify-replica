/**
 * Unit Tests for Page Cloning Implementation Planner Service
 * 
 * Tests pattern matching, component reuse detection, and plan generation.
 * 
 * @see .kiro/specs/page-cloning-agent/design.md
 * @requirements 3.1, 3.2
 */

import { describe, it, expect } from 'vitest';
import {
  slugify,
  pascalCase,
  camelCase,
  extractImageDomains,
  analyzeProjectPatterns,
  identifyReusableComponents,
  planDataFiles,
  planServiceUpdates,
  planTypeDefinitions,
  planConfigUpdates,
  createImplementationPlan,
  type ProjectPatterns,
} from './page-cloning-plan.service';
import type {
  PageAnalysis,
  ExtractedData,
  Section,
  ImageData,
} from '../types/page-cloning';

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockPageAnalysis = (overrides?: Partial<PageAnalysis>): PageAnalysis => ({
  url: 'https://example.com/test-page',
  title: 'Test Page',
  sections: [
    {
      id: 'section-0',
      type: 'header',
      selector: '[role="banner"]',
      children: [],
    },
    {
      id: 'section-1',
      type: 'main',
      selector: '[role="main"]',
      children: [
        {
          id: 'section-2',
          type: 'panel',
          selector: '[role="region"]',
          children: [],
        },
      ],
    },
    {
      id: 'section-3',
      type: 'sidebar',
      selector: '[role="complementary"]',
      children: [],
    },
    {
      id: 'section-4',
      type: 'footer',
      selector: '[role="contentinfo"]',
      children: [],
    },
  ],
  navigation: [
    { type: 'internal', href: '/about', text: 'About' },
    { type: 'external', href: 'https://external.com', text: 'External' },
    { type: 'anchor', href: '#section', text: 'Section' },
  ],
  interactiveElements: [
    { type: 'button', selector: '[role="button"]', action: 'Click button' },
    { type: 'link', selector: '[role="link"]', action: 'Navigate' },
  ],
  responsiveBreakpoints: ['640px', '768px', '1024px'],
  dependencies: ['/about', '/contact'],
  ...overrides,
});

const createMockExtractedData = (overrides?: Partial<ExtractedData>): ExtractedData => ({
  metadata: {
    title: 'Test Page',
    description: 'A test page description',
    ogTitle: 'Test Page OG',
    ogDescription: 'OG Description',
    ogImage: 'https://example.com/og.jpg',
    canonical: 'https://example.com/test-page',
  },
  textContent: [
    { id: 'text-1', content: 'Hello World', tag: 'h1', order: 0 },
    { id: 'text-2', content: 'Some paragraph', tag: 'p', order: 1 },
  ],
  images: [
    { src: 'https://cdn.example.com/image1.jpg', alt: 'Image 1', width: 800, height: 600 },
    { src: 'https://images.other.com/image2.png', alt: 'Image 2' },
  ],
  links: [
    { href: '/about', text: 'About', type: 'internal', attributes: {} },
    { href: 'https://external.com', text: 'External', type: 'external', attributes: {} },
  ],
  lists: [
    { id: 'list-1', items: ['Item 1', 'Item 2', 'Item 3'], ordered: false, order: 0 },
  ],
  forms: [],
  structuredData: {},
  extractedAt: '2025-12-15T10:00:00Z',
  itemCounts: {
    text: 2,
    images: 2,
    links: 2,
    listItems: 3,
  },
  ...overrides,
});

const createMockProjectPatterns = (overrides?: Partial<ProjectPatterns>): ProjectPatterns => ({
  routingPattern: 'src/app/(site)/{route}',
  componentPattern: 'src/components/features/{feature}',
  servicePattern: 'src/lib/services/{feature}.service.ts',
  typePattern: 'src/lib/types/{feature}.ts',
  dataPattern: 'src/data/{feature}',
  existingFeatures: ['free-ai-tools', 'category'],
  uiComponents: ['Button', 'Card', 'Badge', 'Input'],
  featureComponents: {
    'free-ai-tools': ['CategorySidebar', 'FeaturedToolsPanel'],
    'category': ['CategoryLayout', 'CategorySection'],
  },
  ...overrides,
});


// =============================================================================
// Helper Function Tests
// =============================================================================

describe('slugify', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('Free AI Tools')).toBe('free-ai-tools');
  });

  it('converts to lowercase', () => {
    expect(slugify('MyFeature')).toBe('myfeature');
  });

  it('removes special characters', () => {
    expect(slugify('Test@Feature#123')).toBe('testfeature123');
  });

  it('handles multiple spaces', () => {
    expect(slugify('Multiple   Spaces   Here')).toBe('multiple-spaces-here');
  });

  it('removes leading and trailing hyphens', () => {
    expect(slugify('-test-feature-')).toBe('test-feature');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('handles string with only special characters', () => {
    expect(slugify('@#$%')).toBe('');
  });
});

describe('pascalCase', () => {
  it('converts hyphenated string to PascalCase', () => {
    expect(pascalCase('free-ai-tools')).toBe('FreeAiTools');
  });

  it('converts space-separated string to PascalCase', () => {
    expect(pascalCase('free ai tools')).toBe('FreeAiTools');
  });

  it('converts underscore-separated string to PascalCase', () => {
    expect(pascalCase('free_ai_tools')).toBe('FreeAiTools');
  });

  it('handles single word', () => {
    expect(pascalCase('feature')).toBe('Feature');
  });

  it('handles already PascalCase', () => {
    expect(pascalCase('MyFeature')).toBe('Myfeature');
  });

  it('handles empty string', () => {
    expect(pascalCase('')).toBe('');
  });
});

describe('camelCase', () => {
  it('converts hyphenated string to camelCase', () => {
    expect(camelCase('free-ai-tools')).toBe('freeAiTools');
  });

  it('starts with lowercase letter', () => {
    const result = camelCase('MyFeature');
    expect(result[0]).toBe(result[0].toLowerCase());
  });

  it('handles single word', () => {
    expect(camelCase('feature')).toBe('feature');
  });
});

describe('extractImageDomains', () => {
  it('extracts unique domains from image URLs', () => {
    const images: ImageData[] = [
      { src: 'https://cdn.example.com/image1.jpg', alt: 'Image 1' },
      { src: 'https://images.other.com/image2.png', alt: 'Image 2' },
      { src: 'https://cdn.example.com/image3.jpg', alt: 'Image 3' },
    ];
    
    const domains = extractImageDomains(images);
    
    expect(domains).toContain('cdn.example.com');
    expect(domains).toContain('images.other.com');
    expect(domains.length).toBe(2); // Unique domains only
  });

  it('skips data URLs', () => {
    const images: ImageData[] = [
      { src: 'data:image/png;base64,abc123', alt: 'Data URL' },
      { src: 'https://example.com/image.jpg', alt: 'Normal' },
    ];
    
    const domains = extractImageDomains(images);
    
    expect(domains).toEqual(['example.com']);
  });

  it('skips invalid URLs', () => {
    const images: ImageData[] = [
      { src: 'not-a-valid-url', alt: 'Invalid' },
      { src: 'https://example.com/image.jpg', alt: 'Valid' },
    ];
    
    const domains = extractImageDomains(images);
    
    expect(domains).toEqual(['example.com']);
  });

  it('handles empty array', () => {
    const domains = extractImageDomains([]);
    expect(domains).toEqual([]);
  });

  it('handles http and https protocols', () => {
    const images: ImageData[] = [
      { src: 'http://http-site.com/image.jpg', alt: 'HTTP' },
      { src: 'https://https-site.com/image.jpg', alt: 'HTTPS' },
    ];
    
    const domains = extractImageDomains(images);
    
    expect(domains).toContain('http-site.com');
    expect(domains).toContain('https-site.com');
  });
});

// =============================================================================
// analyzeProjectPatterns Tests - Requirements 3.1
// =============================================================================

describe('analyzeProjectPatterns', () => {
  it('returns default patterns when no inputs provided', () => {
    const patterns = analyzeProjectPatterns();
    
    expect(patterns.routingPattern).toBe('src/app/(site)/{route}');
    expect(patterns.componentPattern).toBe('src/components/features/{feature}');
    expect(patterns.servicePattern).toBe('src/lib/services/{feature}.service.ts');
    expect(patterns.typePattern).toBe('src/lib/types/{feature}.ts');
    expect(patterns.dataPattern).toBe('src/data/{feature}');
  });

  it('extracts feature names from routes', () => {
    const routes = ['free-ai-tools', 'category', 'tool'];
    const patterns = analyzeProjectPatterns(routes);
    
    expect(patterns.existingFeatures).toContain('free-ai-tools');
    expect(patterns.existingFeatures).toContain('category');
    expect(patterns.existingFeatures).toContain('tool');
  });

  it('excludes dynamic route segments', () => {
    const routes = ['free-ai-tools', '[slug]', '(site)'];
    const patterns = analyzeProjectPatterns(routes);
    
    expect(patterns.existingFeatures).toContain('free-ai-tools');
    expect(patterns.existingFeatures).not.toContain('[slug]');
    expect(patterns.existingFeatures).not.toContain('(site)');
  });

  it('extracts feature names from services', () => {
    const services = ['free-ai-tools.service.ts', 'auth.service.ts'];
    const patterns = analyzeProjectPatterns([], [], services);
    
    expect(patterns.existingFeatures).toContain('free-ai-tools');
    expect(patterns.existingFeatures).toContain('auth');
  });

  it('includes known UI components', () => {
    const patterns = analyzeProjectPatterns();
    
    expect(patterns.uiComponents).toContain('Button');
    expect(patterns.uiComponents).toContain('Card');
    expect(patterns.uiComponents).toContain('Badge');
  });

  it('combines features from all sources', () => {
    const routes = ['route-feature'];
    const components = ['component-feature'];
    const services = ['service-feature.service.ts'];
    const dataDirs = ['data-feature'];
    
    const patterns = analyzeProjectPatterns(routes, components, services, dataDirs);
    
    expect(patterns.existingFeatures).toContain('route-feature');
    expect(patterns.existingFeatures).toContain('component-feature');
    expect(patterns.existingFeatures).toContain('service-feature');
    expect(patterns.existingFeatures).toContain('data-feature');
  });
});


// =============================================================================
// identifyReusableComponents Tests - Requirements 3.2
// =============================================================================

describe('identifyReusableComponents', () => {
  it('creates component plans for each section', () => {
    const analysis = createMockPageAnalysis();
    const patterns = createMockProjectPatterns();
    
    const components = identifyReusableComponents(analysis, patterns, 'test-feature');
    
    // Should have components for header, main, sidebar, footer, panel (nested), plus page, loading, error
    expect(components.length).toBeGreaterThanOrEqual(7);
  });

  it('generates correct component names', () => {
    const analysis = createMockPageAnalysis({
      sections: [
        { id: 'section-0', type: 'header', selector: '', children: [] },
      ],
    });
    const patterns = createMockProjectPatterns();
    
    const components = identifyReusableComponents(analysis, patterns, 'my-feature');
    
    const headerComponent = components.find(c => c.name.includes('Header'));
    expect(headerComponent).toBeDefined();
    expect(headerComponent?.name).toBe('MyFeatureHeader');
  });

  it('generates correct file paths', () => {
    const analysis = createMockPageAnalysis({
      sections: [
        { id: 'section-0', type: 'main', selector: '', children: [] },
      ],
    });
    const patterns = createMockProjectPatterns();
    
    const components = identifyReusableComponents(analysis, patterns, 'test-feature');
    
    const mainComponent = components.find(c => c.name.includes('MainContent'));
    expect(mainComponent?.path).toContain('src/components/features/test-feature');
  });

  it('includes page component', () => {
    const analysis = createMockPageAnalysis();
    const patterns = createMockProjectPatterns();
    
    const components = identifyReusableComponents(analysis, patterns, 'test-feature');
    
    const pageComponent = components.find(c => c.name.includes('Page'));
    expect(pageComponent).toBeDefined();
    expect(pageComponent?.path).toContain('src/app/(site)');
  });

  it('includes loading skeleton component', () => {
    const analysis = createMockPageAnalysis();
    const patterns = createMockProjectPatterns();
    
    const components = identifyReusableComponents(analysis, patterns, 'test-feature');
    
    const loadingComponent = components.find(c => c.name.includes('Loading'));
    expect(loadingComponent).toBeDefined();
    expect(loadingComponent?.path).toContain('loading.tsx');
  });

  it('includes error boundary component', () => {
    const analysis = createMockPageAnalysis();
    const patterns = createMockProjectPatterns();
    
    const components = identifyReusableComponents(analysis, patterns, 'test-feature');
    
    const errorComponent = components.find(c => c.name.includes('Error'));
    expect(errorComponent).toBeDefined();
    expect(errorComponent?.path).toContain('error.tsx');
  });

  it('identifies reusable existing components', () => {
    const analysis = createMockPageAnalysis({
      sections: [
        { id: 'section-0', type: 'sidebar', selector: '', children: [] },
      ],
    });
    const patterns = createMockProjectPatterns({
      featureComponents: {
        'free-ai-tools': ['CategorySidebar'],
      },
    });
    
    const components = identifyReusableComponents(analysis, patterns, 'new-feature');
    
    const sidebarComponent = components.find(c => c.name.includes('Sidebar'));
    expect(sidebarComponent?.reusesExisting).toContain('CategorySidebar');
  });

  it('handles nested sections', () => {
    const analysis = createMockPageAnalysis({
      sections: [
        {
          id: 'section-0',
          type: 'main',
          selector: '',
          children: [
            { id: 'section-1', type: 'panel', selector: '', children: [] },
          ],
        },
      ],
    });
    const patterns = createMockProjectPatterns();
    
    const components = identifyReusableComponents(analysis, patterns, 'test-feature');
    
    const panelComponent = components.find(c => c.name.includes('Panel'));
    expect(panelComponent).toBeDefined();
  });

  it('assigns appropriate props based on section type', () => {
    const analysis = createMockPageAnalysis({
      sections: [
        { id: 'section-0', type: 'main', selector: '', children: [] },
        { id: 'section-1', type: 'sidebar', selector: '', children: [] },
      ],
    });
    const patterns = createMockProjectPatterns();
    
    const components = identifyReusableComponents(analysis, patterns, 'test-feature');
    
    const mainComponent = components.find(c => c.name.includes('MainContent'));
    expect(mainComponent?.props).toContain('data');
    
    const sidebarComponent = components.find(c => c.name.includes('Sidebar'));
    expect(sidebarComponent?.props).toContain('navigation');
  });
});

// =============================================================================
// planDataFiles Tests - Requirements 3.6
// =============================================================================

describe('planDataFiles', () => {
  it('creates main data file plan', () => {
    const extractedData = createMockExtractedData();
    
    const dataFiles = planDataFiles(extractedData, 'test-feature', 'test-page');
    
    const mainFile = dataFiles.find(f => f.path.includes('test-page.json'));
    expect(mainFile).toBeDefined();
    expect(mainFile?.path).toBe('src/data/test-feature/test-page.json');
  });

  it('creates metadata file plan', () => {
    const extractedData = createMockExtractedData();
    
    const dataFiles = planDataFiles(extractedData, 'test-feature', 'test-page');
    
    const metadataFile = dataFiles.find(f => f.path.includes('metadata.json'));
    expect(metadataFile).toBeDefined();
  });

  it('includes source mapping in data file plans', () => {
    const extractedData = createMockExtractedData();
    
    const dataFiles = planDataFiles(extractedData, 'test-feature', 'test-page');
    
    const mainFile = dataFiles.find(f => f.path.includes('test-page.json'));
    expect(mainFile?.sourceMapping).toBeDefined();
    expect(Object.keys(mainFile?.sourceMapping || {})).toContain('metadata');
  });

  it('includes schema in data file plans', () => {
    const extractedData = createMockExtractedData();
    
    const dataFiles = planDataFiles(extractedData, 'test-feature', 'test-page');
    
    const mainFile = dataFiles.find(f => f.path.includes('test-page.json'));
    expect(mainFile?.schema).toBeDefined();
    expect(mainFile?.schema).toHaveProperty('metadata');
  });

  it('creates index file for large datasets', () => {
    const extractedData = createMockExtractedData({
      itemCounts: {
        text: 50,
        images: 30,
        links: 30,
        listItems: 10,
      },
    });
    
    const dataFiles = planDataFiles(extractedData, 'test-feature', 'test-page');
    
    const indexFile = dataFiles.find(f => f.path.includes('index.json'));
    expect(indexFile).toBeDefined();
  });

  it('uses slugified feature name in path', () => {
    const extractedData = createMockExtractedData();
    
    const dataFiles = planDataFiles(extractedData, 'My Feature Name', 'test-page');
    
    const mainFile = dataFiles.find(f => f.path.includes('test-page.json'));
    expect(mainFile?.path).toContain('my-feature-name');
  });
});

// =============================================================================
// planServiceUpdates Tests - Requirements 3.7
// =============================================================================

describe('planServiceUpdates', () => {
  it('creates service file plan', () => {
    const dataFiles = planDataFiles(createMockExtractedData(), 'test-feature', 'test-page');
    
    const serviceUpdates = planServiceUpdates('test-feature', dataFiles);
    
    expect(serviceUpdates.length).toBe(1);
    expect(serviceUpdates[0].path).toBe('src/lib/services/test-feature.service.ts');
  });

  it('includes basic data fetching function', () => {
    const dataFiles = planDataFiles(createMockExtractedData(), 'test-feature', 'test-page');
    
    const serviceUpdates = planServiceUpdates('test-feature', dataFiles);
    
    expect(serviceUpdates[0].functions).toContain('getTestFeatureData');
  });

  it('includes search function', () => {
    const dataFiles = planDataFiles(createMockExtractedData(), 'test-feature', 'test-page');
    
    const serviceUpdates = planServiceUpdates('test-feature', dataFiles);
    
    expect(serviceUpdates[0].functions).toContain('searchTestFeature');
  });

  it('includes cache invalidation function', () => {
    const dataFiles = planDataFiles(createMockExtractedData(), 'test-feature', 'test-page');
    
    const serviceUpdates = planServiceUpdates('test-feature', dataFiles);
    
    expect(serviceUpdates[0].functions).toContain('invalidateTestFeatureCache');
  });

  it('includes category functions for multiple data files', () => {
    const dataFiles = [
      { path: 'src/data/test/file1.json', schema: {}, sourceMapping: {} },
      { path: 'src/data/test/file2.json', schema: {}, sourceMapping: {} },
      { path: 'src/data/test/file3.json', schema: {}, sourceMapping: {} },
    ];
    
    const serviceUpdates = planServiceUpdates('test-feature', dataFiles);
    
    expect(serviceUpdates[0].functions).toContain('getTestFeatureCategories');
    expect(serviceUpdates[0].functions).toContain('getTestFeatureBySlug');
  });
});


// =============================================================================
// planTypeDefinitions Tests
// =============================================================================

describe('planTypeDefinitions', () => {
  it('creates main data type definition', () => {
    const extractedData = createMockExtractedData();
    
    const types = planTypeDefinitions('test-feature', extractedData);
    
    const mainType = types.find(t => t.name === 'TestFeatureData');
    expect(mainType).toBeDefined();
    expect(mainType?.path).toBe('src/lib/types/test-feature.ts');
  });

  it('includes expected properties in main type', () => {
    const extractedData = createMockExtractedData();
    
    const types = planTypeDefinitions('test-feature', extractedData);
    
    const mainType = types.find(t => t.name === 'TestFeatureData');
    expect(mainType?.properties).toHaveProperty('metadata');
    expect(mainType?.properties).toHaveProperty('textContent');
    expect(mainType?.properties).toHaveProperty('images');
  });

  it('creates form type when forms exist', () => {
    const extractedData = createMockExtractedData({
      forms: [
        { id: 'form-1', action: '/submit', method: 'POST', fields: [] },
      ],
    });
    
    const types = planTypeDefinitions('test-feature', extractedData);
    
    const formType = types.find(t => t.name === 'TestFeatureFormData');
    expect(formType).toBeDefined();
  });

  it('creates list item type when lists exist', () => {
    const extractedData = createMockExtractedData({
      lists: [
        { id: 'list-1', items: ['Item 1'], ordered: false, order: 0 },
      ],
    });
    
    const types = planTypeDefinitions('test-feature', extractedData);
    
    const listType = types.find(t => t.name === 'TestFeatureListItem');
    expect(listType).toBeDefined();
  });

  it('does not create form type when no forms', () => {
    const extractedData = createMockExtractedData({ forms: [] });
    
    const types = planTypeDefinitions('test-feature', extractedData);
    
    const formType = types.find(t => t.name.includes('FormData'));
    expect(formType).toBeUndefined();
  });
});

// =============================================================================
// planConfigUpdates Tests
// =============================================================================

describe('planConfigUpdates', () => {
  it('creates config update for image domains', () => {
    const extractedData = createMockExtractedData({
      images: [
        { src: 'https://cdn.example.com/image.jpg', alt: 'Image' },
      ],
    });
    
    const updates = planConfigUpdates(extractedData);
    
    expect(updates.length).toBe(1);
    expect(updates[0].path).toBe('next.config.js');
  });

  it('includes all unique image domains', () => {
    const extractedData = createMockExtractedData({
      images: [
        { src: 'https://cdn.example.com/image1.jpg', alt: 'Image 1' },
        { src: 'https://images.other.com/image2.jpg', alt: 'Image 2' },
      ],
    });
    
    const updates = planConfigUpdates(extractedData);
    
    const remotePatterns = updates[0].changes['images.remotePatterns'] as Array<{ hostname: string }>;
    const hostnames = remotePatterns.map(p => p.hostname);
    
    expect(hostnames).toContain('cdn.example.com');
    expect(hostnames).toContain('images.other.com');
  });

  it('returns empty array when no external images', () => {
    const extractedData = createMockExtractedData({ images: [] });
    
    const updates = planConfigUpdates(extractedData);
    
    expect(updates).toEqual([]);
  });

  it('skips data URLs', () => {
    const extractedData = createMockExtractedData({
      images: [
        { src: 'data:image/png;base64,abc123', alt: 'Data URL' },
      ],
    });
    
    const updates = planConfigUpdates(extractedData);
    
    expect(updates).toEqual([]);
  });
});

// =============================================================================
// createImplementationPlan Tests - Main Orchestrator
// =============================================================================

describe('createImplementationPlan', () => {
  it('returns complete implementation plan structure', () => {
    const analysis = createMockPageAnalysis();
    const extractedData = createMockExtractedData();
    const options = { featureName: 'test-feature', pageSlug: 'test-page' };
    
    const plan = createImplementationPlan(analysis, extractedData, options);
    
    expect(plan.pageRoute).toBeDefined();
    expect(plan.components).toBeDefined();
    expect(plan.dataFiles).toBeDefined();
    expect(plan.serviceUpdates).toBeDefined();
    expect(plan.typeDefinitions).toBeDefined();
    expect(plan.configUpdates).toBeDefined();
  });

  it('generates correct page route', () => {
    const analysis = createMockPageAnalysis();
    const extractedData = createMockExtractedData();
    const options = { featureName: 'test-feature', pageSlug: 'test-page' };
    
    const plan = createImplementationPlan(analysis, extractedData, options);
    
    expect(plan.pageRoute).toBe('test-feature');
  });

  it('generates dynamic route when specified', () => {
    const analysis = createMockPageAnalysis();
    const extractedData = createMockExtractedData();
    const options = { 
      featureName: 'test-feature', 
      pageSlug: 'test-page',
      isDynamicRoute: true,
    };
    
    const plan = createImplementationPlan(analysis, extractedData, options);
    
    expect(plan.pageRoute).toBe('test-feature/[slug]');
  });

  it('generates nested route with parent', () => {
    const analysis = createMockPageAnalysis();
    const extractedData = createMockExtractedData();
    const options = { 
      featureName: 'test-feature', 
      pageSlug: 'test-page',
      parentRoute: 'free-ai-tools',
    };
    
    const plan = createImplementationPlan(analysis, extractedData, options);
    
    expect(plan.pageRoute).toBe('free-ai-tools/test-page');
  });

  it('generates nested dynamic route', () => {
    const analysis = createMockPageAnalysis();
    const extractedData = createMockExtractedData();
    const options = { 
      featureName: 'test-feature', 
      pageSlug: 'test-page',
      parentRoute: 'free-ai-tools',
      isDynamicRoute: true,
    };
    
    const plan = createImplementationPlan(analysis, extractedData, options);
    
    expect(plan.pageRoute).toBe('free-ai-tools/[slug]');
  });

  it('uses provided project patterns', () => {
    const analysis = createMockPageAnalysis();
    const extractedData = createMockExtractedData();
    const options = { featureName: 'test-feature', pageSlug: 'test-page' };
    const patterns = createMockProjectPatterns({
      featureComponents: {
        'existing-feature': ['ExistingSidebar'],
      },
    });
    
    const plan = createImplementationPlan(analysis, extractedData, options, patterns);
    
    // Plan should be created successfully with custom patterns
    expect(plan.components.length).toBeGreaterThan(0);
  });

  it('includes all component types', () => {
    const analysis = createMockPageAnalysis();
    const extractedData = createMockExtractedData();
    const options = { featureName: 'test-feature', pageSlug: 'test-page' };
    
    const plan = createImplementationPlan(analysis, extractedData, options);
    
    const componentNames = plan.components.map(c => c.name);
    
    // Should have page, loading, and error components
    expect(componentNames.some(n => n.includes('Page'))).toBe(true);
    expect(componentNames.some(n => n.includes('Loading'))).toBe(true);
    expect(componentNames.some(n => n.includes('Error'))).toBe(true);
  });

  it('includes data files', () => {
    const analysis = createMockPageAnalysis();
    const extractedData = createMockExtractedData();
    const options = { featureName: 'test-feature', pageSlug: 'test-page' };
    
    const plan = createImplementationPlan(analysis, extractedData, options);
    
    expect(plan.dataFiles.length).toBeGreaterThan(0);
    expect(plan.dataFiles.some(f => f.path.includes('test-page.json'))).toBe(true);
  });

  it('includes service updates', () => {
    const analysis = createMockPageAnalysis();
    const extractedData = createMockExtractedData();
    const options = { featureName: 'test-feature', pageSlug: 'test-page' };
    
    const plan = createImplementationPlan(analysis, extractedData, options);
    
    expect(plan.serviceUpdates.length).toBe(1);
    expect(plan.serviceUpdates[0].path).toContain('test-feature.service.ts');
  });

  it('includes type definitions', () => {
    const analysis = createMockPageAnalysis();
    const extractedData = createMockExtractedData();
    const options = { featureName: 'test-feature', pageSlug: 'test-page' };
    
    const plan = createImplementationPlan(analysis, extractedData, options);
    
    expect(plan.typeDefinitions.length).toBeGreaterThan(0);
    expect(plan.typeDefinitions.some(t => t.name === 'TestFeatureData')).toBe(true);
  });

  it('includes config updates for images', () => {
    const analysis = createMockPageAnalysis();
    const extractedData = createMockExtractedData({
      images: [
        { src: 'https://cdn.example.com/image.jpg', alt: 'Image' },
      ],
    });
    const options = { featureName: 'test-feature', pageSlug: 'test-page' };
    
    const plan = createImplementationPlan(analysis, extractedData, options);
    
    expect(plan.configUpdates.length).toBe(1);
    expect(plan.configUpdates[0].path).toBe('next.config.js');
  });

  it('handles empty sections', () => {
    const analysis = createMockPageAnalysis({ sections: [] });
    const extractedData = createMockExtractedData();
    const options = { featureName: 'test-feature', pageSlug: 'test-page' };
    
    const plan = createImplementationPlan(analysis, extractedData, options);
    
    // Should still have page, loading, error components
    expect(plan.components.length).toBe(3);
  });

  it('handles empty images', () => {
    const analysis = createMockPageAnalysis();
    const extractedData = createMockExtractedData({ images: [] });
    const options = { featureName: 'test-feature', pageSlug: 'test-page' };
    
    const plan = createImplementationPlan(analysis, extractedData, options);
    
    expect(plan.configUpdates).toEqual([]);
  });
});
