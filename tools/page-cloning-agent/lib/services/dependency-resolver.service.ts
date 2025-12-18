/**
 * Dependency Resolver Service
 * 
 * Handles dependency analysis and resolution for page cloning operations.
 * Identifies shared components, data files, and routes, and manages
 * circular dependency detection and stub creation.
 * 
 * @see .kiro/specs/page-cloning-agent/design.md
 * @requirements 22.1, 22.2, 22.3, 22.4, 22.5, 22.6
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  PageAnalysis,
  ImplementationPlan,
  PageDependency,
  DependencyGraph,
  DependencyType,
  DependencyStatusType,
  ComponentPlan,
  DataFilePlan,
  ServiceUpdate,
} from '../types/page-cloning';

// =============================================================================
// Types
// =============================================================================

/**
 * Result of circular dependency detection
 */
export interface CircularDependencyResult {
  /** Whether a circular dependency was found */
  hasCircular: boolean;
  /** The cycle path if found, null otherwise */
  cycle: string[] | null;
}

/**
 * Result of dependency resolution
 */
export interface ResolvedDependencies {
  /** All dependencies with updated status */
  resolved: PageDependency[];
  /** Paths to created stub files */
  stubs: string[];
  /** Circular dependencies found (if any) */
  circularDependencies: string[][] | null;
  /** Shared resources identified */
  sharedResources: {
    components: string[];
    data: string[];
  };
}

/**
 * Stub generation result
 */
export interface StubResult {
  /** Path where stub was created */
  path: string;
  /** Content of the stub */
  content: string;
  /** Whether stub was successfully created */
  success: boolean;
}

// =============================================================================
// Constants
// =============================================================================

/** Node states for cycle detection */
const enum NodeState {
  WHITE = 0, // Not visited
  GRAY = 1,  // In current path
  BLACK = 2, // Completely processed
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a file exists at the given path
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current ISO timestamp
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Extract component name from file path
 */
function getComponentNameFromPath(filePath: string): string {
  const basename = path.basename(filePath, path.extname(filePath));
  // Convert kebab-case or snake_case to PascalCase
  return basename
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Determine if a path is in a shared location
 */
function isSharedLocation(filePath: string): boolean {
  return (
    filePath.includes('src/components/ui/') ||
    filePath.includes('src/components/features/') ||
    filePath.includes('src/lib/services/') ||
    filePath.includes('src/lib/types/') ||
    filePath.includes('src/data/')
  );
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Analyze dependencies for a page based on its analysis and implementation plan
 * 
 * @param pageAnalysis - Analysis of the source page
 * @param implementationPlan - Plan for implementing the page
 * @returns DependencyGraph with all identified dependencies
 * 
 * @requirements 22.1, 22.3, 22.4, 22.5
 */
export async function analyzeDependencies(
  pageAnalysis: PageAnalysis,
  implementationPlan: ImplementationPlan
): Promise<DependencyGraph> {
  const dependencies: PageDependency[] = [];
  const sharedComponents: string[] = [];
  const sharedData: string[] = [];
  const linkedPages: string[] = [];

  // Analyze component dependencies
  for (const component of implementationPlan.components) {
    const dep = await analyzeComponentDependency(component);
    dependencies.push(dep);
    
    if (dep.status === 'exists' && isSharedLocation(component.path)) {
      sharedComponents.push(component.path);
    }
  }

  // Analyze data file dependencies
  for (const dataFile of implementationPlan.dataFiles) {
    const dep = await analyzeDataDependency(dataFile);
    dependencies.push(dep);
    
    if (dep.status === 'exists' && isSharedLocation(dataFile.path)) {
      sharedData.push(dataFile.path);
    }
  }

  // Analyze service dependencies
  for (const service of implementationPlan.serviceUpdates) {
    const dep = await analyzeServiceDependency(service);
    dependencies.push(dep);
  }

  // Analyze route dependencies from navigation
  for (const nav of pageAnalysis.navigation) {
    if (nav.type === 'internal') {
      linkedPages.push(nav.href);
      
      // Check if the route exists
      const routePath = `src/app/(site)${nav.href}/page.tsx`;
      const exists = await fileExists(routePath);
      
      dependencies.push({
        type: 'route',
        path: routePath,
        status: exists ? 'exists' : 'needs_creation',
        dependsOn: [],
      });
    }
  }

  // Add dependencies from pageAnalysis.dependencies
  for (const depUrl of pageAnalysis.dependencies) {
    if (!linkedPages.includes(depUrl)) {
      linkedPages.push(depUrl);
    }
  }

  return {
    pageSlug: extractSlugFromUrl(pageAnalysis.url),
    dependencies,
    sharedComponents,
    sharedData,
    linkedPages,
  };
}

/**
 * Analyze a component dependency
 */
async function analyzeComponentDependency(
  component: ComponentPlan
): Promise<PageDependency> {
  const exists = await fileExists(component.path);
  const dependsOn: string[] = [];

  // If component reuses existing, add as dependency
  if (component.reusesExisting) {
    dependsOn.push(component.reusesExisting);
  }

  return {
    type: 'component',
    path: component.path,
    status: exists ? 'exists' : 'needs_creation',
    dependsOn,
  };
}

/**
 * Analyze a data file dependency
 */
async function analyzeDataDependency(
  dataFile: DataFilePlan
): Promise<PageDependency> {
  const exists = await fileExists(dataFile.path);

  return {
    type: 'data',
    path: dataFile.path,
    status: exists ? 'exists' : 'needs_creation',
    dependsOn: [],
  };
}

/**
 * Analyze a service dependency
 */
async function analyzeServiceDependency(
  service: ServiceUpdate
): Promise<PageDependency> {
  const exists = await fileExists(service.path);

  return {
    type: 'service',
    path: service.path,
    status: exists ? 'exists' : 'needs_creation',
    dependsOn: [],
  };
}

/**
 * Extract slug from URL
 */
function extractSlugFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // Remove leading/trailing slashes and get last segment
    const segments = pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || 'index';
  } catch {
    // If not a valid URL, treat as path
    const segments = url.split('/').filter(Boolean);
    return segments[segments.length - 1] || 'index';
  }
}

/**
 * Detect circular dependencies in the dependency graph
 * 
 * Uses DFS with three-color marking to detect cycles.
 * 
 * @param dependencies - Array of dependencies to check
 * @returns CircularDependencyResult indicating if cycle exists and the cycle path
 * 
 * @requirements 22.6
 */
export function detectCircularDependency(
  dependencies: PageDependency[]
): CircularDependencyResult {
  // Build adjacency list
  const adjacencyList = new Map<string, string[]>();
  const allNodes = new Set<string>();

  for (const dep of dependencies) {
    allNodes.add(dep.path);
    adjacencyList.set(dep.path, dep.dependsOn);
    
    for (const d of dep.dependsOn) {
      allNodes.add(d);
    }
  }

  // Initialize node states
  const nodeState = new Map<string, NodeState>();
  for (const node of allNodes) {
    nodeState.set(node, NodeState.WHITE);
  }

  // Track path for cycle reporting
  const path: string[] = [];
  let cycleFound: string[] | null = null;

  /**
   * DFS helper function
   */
  function dfs(node: string): boolean {
    nodeState.set(node, NodeState.GRAY);
    path.push(node);

    const neighbors = adjacencyList.get(node) || [];
    for (const neighbor of neighbors) {
      const state = nodeState.get(neighbor) ?? NodeState.WHITE;

      if (state === NodeState.GRAY) {
        // Found a cycle - extract the cycle from path
        const cycleStart = path.indexOf(neighbor);
        cycleFound = path.slice(cycleStart);
        cycleFound.push(neighbor); // Complete the cycle
        return true;
      }

      if (state === NodeState.WHITE) {
        if (dfs(neighbor)) {
          return true;
        }
      }
    }

    nodeState.set(node, NodeState.BLACK);
    path.pop();
    return false;
  }

  // Run DFS from each unvisited node
  for (const node of allNodes) {
    if (nodeState.get(node) === NodeState.WHITE) {
      if (dfs(node)) {
        return {
          hasCircular: true,
          cycle: cycleFound,
        };
      }
    }
  }

  return {
    hasCircular: false,
    cycle: null,
  };
}

/**
 * Create a stub file for a dependency that doesn't exist
 * 
 * @param dependency - The dependency to create a stub for
 * @returns StubResult with the created stub information
 * 
 * @requirements 22.2
 */
export async function createStub(
  dependency: PageDependency
): Promise<StubResult> {
  const content = generateStubContent(dependency);
  
  try {
    // Ensure directory exists
    const dir = path.dirname(dependency.path);
    await fs.mkdir(dir, { recursive: true });
    
    // Write stub file
    await fs.writeFile(dependency.path, content, 'utf-8');
    
    return {
      path: dependency.path,
      content,
      success: true,
    };
  } catch (error) {
    return {
      path: dependency.path,
      content,
      success: false,
    };
  }
}

/**
 * Generate stub content based on dependency type
 */
function generateStubContent(dependency: PageDependency): string {
  const timestamp = getCurrentTimestamp();
  
  switch (dependency.type) {
    case 'component':
      return generateComponentStub(dependency.path, timestamp);
    case 'data':
      return generateDataStub(dependency.path, timestamp);
    case 'service':
      return generateServiceStub(dependency.path, timestamp);
    case 'route':
      return generateRouteStub(dependency.path, timestamp);
    default:
      return `// TODO: Implement stub for ${dependency.path}\n// Created: ${timestamp}\n`;
  }
}

/**
 * Generate a React component stub
 */
function generateComponentStub(filePath: string, timestamp: string): string {
  const componentName = getComponentNameFromPath(filePath);
  
  return `/**
 * ${componentName} Component (Stub)
 * 
 * TODO: This is a stub component that needs implementation.
 * Created as a dependency placeholder during page cloning.
 * 
 * @created ${timestamp}
 */

export interface ${componentName}Props {
  // TODO: Define props
}

export default function ${componentName}(props: ${componentName}Props) {
  return (
    <div className="p-4 border border-dashed border-gray-300 rounded">
      <p className="text-gray-500">
        TODO: Implement ${componentName}
      </p>
    </div>
  );
}
`;
}

/**
 * Generate a JSON data file stub
 */
function generateDataStub(filePath: string, timestamp: string): string {
  return JSON.stringify(
    {
      _metadata: {
        stub: true,
        createdAt: timestamp,
        reason: 'Dependency not yet implemented',
      },
      data: [],
    },
    null,
    2
  );
}

/**
 * Generate a service file stub
 */
function generateServiceStub(filePath: string, timestamp: string): string {
  const serviceName = getComponentNameFromPath(filePath).replace('Service', '');
  
  return `/**
 * ${serviceName} Service (Stub)
 * 
 * TODO: This is a stub service that needs implementation.
 * Created as a dependency placeholder during page cloning.
 * 
 * @created ${timestamp}
 */

// TODO: Implement service functions

export async function getData(): Promise<unknown[]> {
  // TODO: Implement data fetching
  console.warn('${serviceName} service is a stub - implement getData()');
  return [];
}

export async function getById(id: string): Promise<unknown | null> {
  // TODO: Implement single item fetching
  console.warn('${serviceName} service is a stub - implement getById()');
  return null;
}
`;
}

/**
 * Generate a route page stub
 */
function generateRouteStub(filePath: string, timestamp: string): string {
  // Extract route name from path
  const routeMatch = filePath.match(/src\/app\/\(site\)\/(.+)\/page\.tsx$/);
  const routeName = routeMatch ? routeMatch[1] : 'Page';
  const pageName = getComponentNameFromPath(routeName) + 'Page';
  
  return `/**
 * ${pageName} (Stub)
 * 
 * TODO: This is a stub page that needs implementation.
 * Created as a dependency placeholder during page cloning.
 * 
 * @created ${timestamp}
 */

export default function ${pageName}() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">
        TODO: Implement ${pageName}
      </h1>
      <p className="text-gray-500">
        This page is a stub and needs to be implemented.
      </p>
    </main>
  );
}
`;
}

/**
 * Resolve all dependencies in a dependency graph
 * 
 * @param graph - The dependency graph to resolve
 * @returns ResolvedDependencies with resolution results
 * 
 * @requirements 22.2, 22.3, 22.4, 22.6
 */
export async function resolveDependencies(
  graph: DependencyGraph
): Promise<ResolvedDependencies> {
  const resolved: PageDependency[] = [];
  const stubs: string[] = [];
  let circularDependencies: string[][] | null = null;
  const sharedResources = {
    components: [...graph.sharedComponents],
    data: [...graph.sharedData],
  };

  // First, detect circular dependencies
  const circularResult = detectCircularDependency(graph.dependencies);
  
  if (circularResult.hasCircular && circularResult.cycle) {
    circularDependencies = [circularResult.cycle];
    
    // For circular dependencies, we need to create interface stubs first
    // to break the cycle (per requirement 22.6)
    for (const depPath of circularResult.cycle) {
      const dep = graph.dependencies.find(d => d.path === depPath);
      if (dep && dep.status === 'needs_creation') {
        const stubResult = await createStub(dep);
        if (stubResult.success) {
          stubs.push(stubResult.path);
          dep.status = 'stub';
        }
      }
    }
  }

  // Sort dependencies topologically (dependencies first)
  const sortedDeps = topologicalSort(graph.dependencies);

  // Process each dependency
  for (const dep of sortedDeps) {
    // Skip if already processed as part of circular dependency handling
    if (dep.status === 'stub') {
      resolved.push(dep);
      continue;
    }

    // Check if dependency exists
    const exists = await fileExists(dep.path);
    
    if (exists) {
      dep.status = 'exists';
      
      // Track shared resources
      if (isSharedLocation(dep.path)) {
        if (dep.type === 'component' && !sharedResources.components.includes(dep.path)) {
          sharedResources.components.push(dep.path);
        } else if (dep.type === 'data' && !sharedResources.data.includes(dep.path)) {
          sharedResources.data.push(dep.path);
        }
      }
    } else if (dep.status === 'needs_creation') {
      // Create stub for missing dependency
      const stubResult = await createStub(dep);
      if (stubResult.success) {
        stubs.push(stubResult.path);
        dep.status = 'stub';
      }
    }

    resolved.push(dep);
  }

  return {
    resolved,
    stubs,
    circularDependencies,
    sharedResources,
  };
}

/**
 * Topologically sort dependencies (dependencies first)
 */
function topologicalSort(dependencies: PageDependency[]): PageDependency[] {
  const result: PageDependency[] = [];
  const visited = new Set<string>();
  const depMap = new Map<string, PageDependency>();

  // Build map for quick lookup
  for (const dep of dependencies) {
    depMap.set(dep.path, dep);
  }

  function visit(dep: PageDependency) {
    if (visited.has(dep.path)) {
      return;
    }
    visited.add(dep.path);

    // Visit dependencies first
    for (const depPath of dep.dependsOn) {
      const childDep = depMap.get(depPath);
      if (childDep) {
        visit(childDep);
      }
    }

    result.push(dep);
  }

  for (const dep of dependencies) {
    visit(dep);
  }

  return result;
}

/**
 * Check if a dependency should be in a shared location
 * 
 * @param dependency - The dependency to check
 * @param usageCount - Number of pages using this dependency
 * @returns True if dependency should be shared
 * 
 * @requirements 22.3, 22.4
 */
export function shouldBeShared(
  dependency: PageDependency,
  usageCount: number
): boolean {
  // If used by more than one page, should be shared
  if (usageCount > 1) {
    return true;
  }

  // If already in a shared location, keep it shared
  if (isSharedLocation(dependency.path)) {
    return true;
  }

  return false;
}

/**
 * Get the shared location path for a dependency
 * 
 * @param dependency - The dependency to get shared path for
 * @returns The shared location path
 * 
 * @requirements 22.3, 22.4
 */
export function getSharedPath(dependency: PageDependency): string {
  const basename = path.basename(dependency.path);
  
  switch (dependency.type) {
    case 'component':
      return `src/components/features/${basename}`;
    case 'data':
      return `src/data/${basename}`;
    case 'service':
      return `src/lib/services/${basename}`;
    default:
      return dependency.path;
  }
}
