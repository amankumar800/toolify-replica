/**
 * Page Cloning Agent - Implementation Planner Service
 * 
 * Analyzes project patterns and creates implementation plans for cloned pages.
 * This service examines the existing project structure to ensure cloned pages
 * follow established conventions and reuse existing components where possible.
 * 
 * @module page-cloning-plan.service
 * @requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */

import type {
  PageAnalysis,
  ExtractedData,
  ImplementationPlan,
  ComponentPlan,
  DataFilePlan,
  ServiceUpdate,
  TypeDefinition,
  ConfigUpdate,
  Section,
  ImageData,
} from '../types/page-cloning';

// =============================================================================
// Types
// =============================================================================

/**
 * Discovered project patterns from analyzing the codebase
 */
export interface ProjectPatterns {
  /** Route pattern for pages (e.g., "src/app/(site)/{route}") */
  routingPattern: string;
  /** Component pattern (e.g., "src/components/features/{feature}") */
  componentPattern: string;
  /** Service pattern (e.g., "src/lib/services/{feature}.service.ts") */
  servicePattern: string;
  /** Type pattern (e.g., "src/lib/types/{feature}.ts") */
  typePattern: string;
  /** Data pattern (e.g., "src/data/{feature}") */
  dataPattern: string;
  /** List of existing feature names */
  existingFeatures: string[];
  /** Available UI components */
  uiComponents: string[];
  /** Map of feature name to its components */
  featureComponents: Record<string, string[]>;
}

/**
 * Options for creating an implementation plan
 */
export interface PlanOptions {
  /** Feature name for the cloned page */
  featureName: string;
  /** Page slug for routing */
  pageSlug: string;
  /** Whether to create a dynamic route (e.g., [slug]) */
  isDynamicRoute?: boolean;
  /** Parent route if nested (e.g., "free-ai-tools") */
  parentRoute?: string;
}

// =============================================================================
// Constants
// =============================================================================

/** Default project patterns based on Next.js App Router conventions */
const DEFAULT_PATTERNS: ProjectPatterns = {
  routingPattern: 'src/app/(site)/{route}',
  componentPattern: 'src/components/features/{feature}',
  servicePattern: 'src/lib/services/{feature}.service.ts',
  typePattern: 'src/lib/types/{feature}.ts',
  dataPattern: 'src/data/{feature}',
  existingFeatures: [],
  uiComponents: [],
  featureComponents: {},
};

/** Known UI components that can be reused */
const KNOWN_UI_COMPONENTS = [
  'Button',
  'Card',
  'Badge',
  'Input',
  'Label',
  'Breadcrumb',
  'ScrollToTop',
  'SkipLink',
  'AdPlaceholder',
];


/** Section type to component name mapping */
const SECTION_TO_COMPONENT: Record<string, string> = {
  header: 'Header',
  sidebar: 'Sidebar',
  main: 'MainContent',
  footer: 'Footer',
  panel: 'Panel',
  modal: 'Modal',
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Converts a string to a URL-safe slug
 * 
 * @param name - String to convert
 * @returns URL-safe slug
 * 
 * @example
 * slugify("Free AI Tools") // "free-ai-tools"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Converts a string to PascalCase for component names
 * 
 * @param name - String to convert
 * @returns PascalCase string
 * 
 * @example
 * pascalCase("free-ai-tools") // "FreeAiTools"
 */
export function pascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Converts a string to camelCase
 * 
 * @param name - String to convert
 * @returns camelCase string
 */
export function camelCase(name: string): string {
  const pascal = pascalCase(name);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Extracts unique domains from image URLs
 * 
 * @param images - Array of image data
 * @returns Array of unique domain strings
 */
export function extractImageDomains(images: ImageData[]): string[] {
  const domains = new Set<string>();
  
  for (const image of images) {
    try {
      const url = new URL(image.src);
      // Skip data URLs and relative paths
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        domains.add(url.hostname);
      }
    } catch {
      // Skip invalid URLs
    }
  }
  
  return Array.from(domains);
}

/**
 * Generates component name from section type
 */
function generateComponentName(section: Section, featureName: string): string {
  const baseName = SECTION_TO_COMPONENT[section.type] || 'Section';
  const featurePrefix = pascalCase(featureName);
  return `${featurePrefix}${baseName}`;
}

// =============================================================================
// Project Pattern Analysis
// =============================================================================

/**
 * Analyzes the existing project structure to discover patterns
 * 
 * This function examines the project directories to understand:
 * - Routing patterns in src/app/(site)
 * - Component organization in src/components
 * - Service layer patterns in src/lib/services
 * - Data storage patterns in src/data
 * 
 * @param existingRoutes - List of existing route directories
 * @param existingComponents - List of existing component directories
 * @param existingServices - List of existing service files
 * @param existingDataDirs - List of existing data directories
 * @returns Discovered project patterns
 * 
 * @requirements 3.1, 3.2
 */
export function analyzeProjectPatterns(
  existingRoutes: string[] = [],
  existingComponents: string[] = [],
  existingServices: string[] = [],
  existingDataDirs: string[] = []
): ProjectPatterns {
  const patterns: ProjectPatterns = { ...DEFAULT_PATTERNS };
  
  // Extract feature names from routes
  const routeFeatures = existingRoutes
    .filter(route => !route.startsWith('[') && !route.startsWith('('))
    .map(route => route.replace(/\\/g, '/').split('/').pop() || '')
    .filter(Boolean);
  
  // Extract feature names from component directories
  const componentFeatures = existingComponents
    .map(comp => comp.replace(/\\/g, '/').split('/').pop() || '')
    .filter(Boolean);
  
  // Extract feature names from services
  const serviceFeatures = existingServices
    .map(svc => {
      const match = svc.match(/([^/\\]+)\.service\.ts$/);
      return match ? match[1] : '';
    })
    .filter(Boolean);
  
  // Combine all discovered features
  const allFeatures = new Set([
    ...routeFeatures,
    ...componentFeatures,
    ...serviceFeatures,
    ...existingDataDirs,
  ]);
  
  patterns.existingFeatures = Array.from(allFeatures);
  
  // Set known UI components
  patterns.uiComponents = [...KNOWN_UI_COMPONENTS];
  
  // Build feature components map
  for (const feature of componentFeatures) {
    patterns.featureComponents[feature] = [];
  }
  
  return patterns;
}


// =============================================================================
// Component Identification
// =============================================================================

/**
 * Identifies reusable components based on page analysis
 * 
 * Examines the page analysis to find:
 * - Sections that match existing feature components
 * - Interactive elements that can use UI components
 * - Patterns that suggest component reuse
 * 
 * @param analysis - Page analysis from the analyze phase
 * @param patterns - Discovered project patterns
 * @param featureName - Name of the feature being implemented
 * @returns Array of component plans
 * 
 * @requirements 3.2
 */
export function identifyReusableComponents(
  analysis: PageAnalysis,
  patterns: ProjectPatterns,
  featureName: string
): ComponentPlan[] {
  const components: ComponentPlan[] = [];
  const featureDir = patterns.componentPattern.replace('{feature}', featureName);
  
  // Process each section
  for (const section of analysis.sections) {
    const componentName = generateComponentName(section, featureName);
    const componentPath = `${featureDir}/${componentName}.tsx`;
    
    // Check if a similar component exists
    const existingComponent = findExistingComponent(section, patterns);
    
    // Determine props based on section type
    const props = determineComponentProps(section, analysis);
    
    components.push({
      name: componentName,
      path: componentPath,
      props,
      reusesExisting: existingComponent,
    });
    
    // Process nested sections
    for (const child of section.children) {
      const childName = generateComponentName(child, featureName);
      const childPath = `${featureDir}/${childName}.tsx`;
      const childExisting = findExistingComponent(child, patterns);
      const childProps = determineComponentProps(child, analysis);
      
      components.push({
        name: childName,
        path: childPath,
        props: childProps,
        reusesExisting: childExisting,
      });
    }
  }
  
  // Add page component
  components.push({
    name: `${pascalCase(featureName)}Page`,
    path: `src/app/(site)/${slugify(featureName)}/page.tsx`,
    props: ['data'],
    reusesExisting: null,
  });
  
  // Add loading skeleton
  components.push({
    name: `${pascalCase(featureName)}Loading`,
    path: `src/app/(site)/${slugify(featureName)}/loading.tsx`,
    props: [],
    reusesExisting: 'src/components/features/GridSkeleton.tsx',
  });
  
  // Add error boundary
  components.push({
    name: `${pascalCase(featureName)}Error`,
    path: `src/app/(site)/${slugify(featureName)}/error.tsx`,
    props: ['error', 'reset'],
    reusesExisting: null,
  });
  
  return components;
}

/**
 * Finds an existing component that matches the section type
 */
function findExistingComponent(
  section: Section,
  patterns: ProjectPatterns
): string | null {
  // Check feature components for matching types
  for (const [feature, components] of Object.entries(patterns.featureComponents)) {
    for (const component of components) {
      const componentLower = component.toLowerCase();
      if (componentLower.includes(section.type)) {
        return `src/components/features/${feature}/${component}.tsx`;
      }
    }
  }
  
  // Check UI components
  const sectionComponent = SECTION_TO_COMPONENT[section.type];
  if (sectionComponent && patterns.uiComponents.includes(sectionComponent)) {
    return `src/components/ui/${sectionComponent.toLowerCase()}.tsx`;
  }
  
  return null;
}

/**
 * Determines props for a component based on section analysis
 */
function determineComponentProps(section: Section, analysis: PageAnalysis): string[] {
  const props: string[] = [];
  
  // Add data prop for main content sections
  if (section.type === 'main' || section.type === 'panel') {
    props.push('data');
  }
  
  // Add navigation props for header/sidebar
  if (section.type === 'header' || section.type === 'sidebar') {
    props.push('navigation');
  }
  
  // Add items prop for sections with lists
  if (section.children.length > 0) {
    props.push('items');
  }
  
  // Add className for styling flexibility
  props.push('className');
  
  return props;
}

// =============================================================================
// Data File Planning
// =============================================================================

/**
 * Plans data file structure based on extracted data
 * 
 * Creates a plan for storing extracted data following the project's
 * existing data storage patterns (JSON files in src/data).
 * 
 * @param extractedData - Data extracted from the source page
 * @param featureName - Name of the feature
 * @param pageSlug - Slug for the specific page
 * @returns Array of data file plans
 * 
 * @requirements 3.6
 */
export function planDataFiles(
  extractedData: ExtractedData,
  featureName: string,
  pageSlug: string
): DataFilePlan[] {
  const dataFiles: DataFilePlan[] = [];
  const dataDir = `src/data/${slugify(featureName)}`;
  
  // Main data file for the page
  dataFiles.push({
    path: `${dataDir}/${pageSlug}.json`,
    schema: {
      _metadata: {
        sourceUrl: 'string',
        extractedAt: 'string (ISO date)',
        itemCounts: 'ItemCounts',
      },
      metadata: 'PageMetadata',
      textContent: 'TextBlock[]',
      images: 'ImageData[]',
      links: 'LinkData[]',
      lists: 'ListData[]',
    },
    sourceMapping: {
      'metadata': 'extractedData.metadata',
      'textContent': 'extractedData.textContent',
      'images': 'extractedData.images',
      'links': 'extractedData.links',
      'lists': 'extractedData.lists',
    },
  });
  
  // If there are many items, plan for category-based splitting
  const totalItems = extractedData.itemCounts.text + 
                     extractedData.itemCounts.images + 
                     extractedData.itemCounts.links;
  
  if (totalItems > 100) {
    // Plan for split data files
    dataFiles.push({
      path: `${dataDir}/index.json`,
      schema: {
        categories: 'CategoryRef[]',
        totalItems: 'number',
        lastUpdated: 'string (ISO date)',
      },
      sourceMapping: {
        'categories': 'derived from content structure',
        'totalItems': 'extractedData.itemCounts',
      },
    });
  }
  
  // Metadata file for scraping info
  dataFiles.push({
    path: `${dataDir}/metadata.json`,
    schema: {
      lastScrapedAt: 'string (ISO date)',
      sourceUrl: 'string',
      version: 'string',
      itemCounts: 'ItemCounts',
    },
    sourceMapping: {
      'lastScrapedAt': 'extractedData.extractedAt',
      'sourceUrl': 'analysis.url',
      'itemCounts': 'extractedData.itemCounts',
    },
  });
  
  return dataFiles;
}


// =============================================================================
// Service Planning
// =============================================================================

/**
 * Plans service layer updates for the cloned page
 * 
 * Creates a plan for service functions following the project's
 * existing service layer patterns (caching, error handling, typed responses).
 * 
 * @param featureName - Name of the feature
 * @param dataFiles - Planned data files
 * @returns Array of service updates
 * 
 * @requirements 3.7
 */
export function planServiceUpdates(
  featureName: string,
  dataFiles: DataFilePlan[]
): ServiceUpdate[] {
  const servicePath = `src/lib/services/${slugify(featureName)}.service.ts`;
  const pascalName = pascalCase(featureName);
  const camelName = camelCase(featureName);
  
  // Determine functions based on data structure
  const functions: string[] = [];
  
  // Basic data fetching function
  functions.push(`get${pascalName}Data`);
  
  // If there are multiple data files, add category/item functions
  if (dataFiles.length > 2) {
    functions.push(`get${pascalName}Categories`);
    functions.push(`get${pascalName}BySlug`);
    functions.push(`get${pascalName}ByCategory`);
  }
  
  // Search function
  functions.push(`search${pascalName}`);
  
  // Cache invalidation
  functions.push(`invalidate${pascalName}Cache`);
  
  return [{
    path: servicePath,
    functions,
  }];
}

/**
 * Plans type definitions for the cloned page
 * 
 * @param featureName - Name of the feature
 * @param extractedData - Extracted data to derive types from
 * @returns Array of type definitions
 */
export function planTypeDefinitions(
  featureName: string,
  extractedData: ExtractedData
): TypeDefinition[] {
  const typePath = `src/lib/types/${slugify(featureName)}.ts`;
  const pascalName = pascalCase(featureName);
  
  const types: TypeDefinition[] = [];
  
  // Main data type
  types.push({
    name: `${pascalName}Data`,
    path: typePath,
    properties: {
      metadata: 'PageMetadata',
      textContent: 'TextBlock[]',
      images: 'ImageData[]',
      links: 'LinkData[]',
      lists: 'ListData[]',
      extractedAt: 'string',
    },
  });
  
  // If forms exist, add form types
  if (extractedData.forms.length > 0) {
    types.push({
      name: `${pascalName}FormData`,
      path: typePath,
      properties: {
        fields: 'FormField[]',
        action: 'string',
        method: 'string',
      },
    });
  }
  
  // List item type if lists exist
  if (extractedData.lists.length > 0) {
    types.push({
      name: `${pascalName}ListItem`,
      path: typePath,
      properties: {
        id: 'string',
        content: 'string',
        order: 'number',
      },
    });
  }
  
  return types;
}

/**
 * Plans configuration updates needed for the cloned page
 * 
 * @param extractedData - Extracted data containing images
 * @returns Array of config updates
 */
export function planConfigUpdates(extractedData: ExtractedData): ConfigUpdate[] {
  const updates: ConfigUpdate[] = [];
  
  // Extract image domains for next.config.js
  const imageDomains = extractImageDomains(extractedData.images);
  
  if (imageDomains.length > 0) {
    updates.push({
      path: 'next.config.js',
      changes: {
        'images.remotePatterns': imageDomains.map(domain => ({
          protocol: 'https',
          hostname: domain,
        })),
      },
    });
  }
  
  return updates;
}

// =============================================================================
// Main Implementation Plan Creation
// =============================================================================

/**
 * Creates a complete implementation plan for a cloned page
 * 
 * This is the main entry point for implementation planning. It orchestrates
 * all planning functions to produce a comprehensive ImplementationPlan.
 * 
 * @param analysis - Page analysis from the analyze phase
 * @param extractedData - Data extracted from the source page
 * @param options - Planning options (feature name, slug, etc.)
 * @param patterns - Optional pre-analyzed project patterns
 * @returns Complete implementation plan
 * 
 * @requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 * 
 * @example
 * const plan = createImplementationPlan(
 *   pageAnalysis,
 *   extractedData,
 *   { featureName: 'free-ai-tools', pageSlug: 'chatbots' }
 * );
 */
export function createImplementationPlan(
  analysis: PageAnalysis,
  extractedData: ExtractedData,
  options: PlanOptions,
  patterns?: ProjectPatterns
): ImplementationPlan {
  const { featureName, pageSlug, isDynamicRoute, parentRoute } = options;
  
  // Use provided patterns or defaults
  const projectPatterns = patterns || analyzeProjectPatterns();
  
  // Determine page route
  let pageRoute: string;
  if (parentRoute) {
    pageRoute = isDynamicRoute
      ? `${parentRoute}/[slug]`
      : `${parentRoute}/${pageSlug}`;
  } else {
    pageRoute = isDynamicRoute
      ? `${slugify(featureName)}/[slug]`
      : slugify(featureName);
  }
  
  // Plan all components
  const components = identifyReusableComponents(
    analysis,
    projectPatterns,
    featureName
  );
  
  // Plan data files
  const dataFiles = planDataFiles(extractedData, featureName, pageSlug);
  
  // Plan service updates
  const serviceUpdates = planServiceUpdates(featureName, dataFiles);
  
  // Plan type definitions
  const typeDefinitions = planTypeDefinitions(featureName, extractedData);
  
  // Plan config updates
  const configUpdates = planConfigUpdates(extractedData);
  
  return {
    pageRoute,
    components,
    dataFiles,
    serviceUpdates,
    typeDefinitions,
    configUpdates,
  };
}

/**
 * Creates an implementation plan with logging for debugging
 * 
 * @param analysis - Page analysis
 * @param extractedData - Extracted data
 * @param options - Planning options
 * @param patterns - Optional project patterns
 * @returns Implementation plan with console logging
 */
export function createImplementationPlanWithLogging(
  analysis: PageAnalysis,
  extractedData: ExtractedData,
  options: PlanOptions,
  patterns?: ProjectPatterns
): ImplementationPlan {
  console.log('=== Creating Implementation Plan ===');
  console.log(`Feature: ${options.featureName}`);
  console.log(`Page Slug: ${options.pageSlug}`);
  
  const plan = createImplementationPlan(analysis, extractedData, options, patterns);
  
  console.log(`\nPage Route: ${plan.pageRoute}`);
  console.log(`\nComponents to create: ${plan.components.length}`);
  for (const comp of plan.components) {
    const reuse = comp.reusesExisting ? ` (reuses: ${comp.reusesExisting})` : '';
    console.log(`  - ${comp.name}${reuse}`);
  }
  
  console.log(`\nData files to create: ${plan.dataFiles.length}`);
  for (const file of plan.dataFiles) {
    console.log(`  - ${file.path}`);
  }
  
  console.log(`\nService updates: ${plan.serviceUpdates.length}`);
  for (const svc of plan.serviceUpdates) {
    console.log(`  - ${svc.path}: ${svc.functions.join(', ')}`);
  }
  
  console.log(`\nType definitions: ${plan.typeDefinitions.length}`);
  for (const type of plan.typeDefinitions) {
    console.log(`  - ${type.name} in ${type.path}`);
  }
  
  console.log(`\nConfig updates: ${plan.configUpdates.length}`);
  for (const config of plan.configUpdates) {
    console.log(`  - ${config.path}`);
  }
  
  console.log('===================================');
  
  return plan;
}
