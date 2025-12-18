/**
 * Unit Tests for Dependency Resolver Service
 * 
 * Tests for:
 * - Dependency graph building
 * - Circular dependency detection
 * - Stub creation
 * 
 * @see .kiro/specs/page-cloning-agent/design.md
 * @requirements 22.1, 22.6
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  analyzeDependencies,
  detectCircularDependency,
  createStub,
  resolveDependencies,
  shouldBeShared,
  getSharedPath,
  type CircularDependencyResult,
} from './dependency-resolver.service';
import type {
  PageAnalysis,
  ImplementationPlan,
  PageDependency,
  DependencyGraph,
} from '../types/page-cloning';

// =============================================================================
// Test Setup and Cleanup
// =============================================================================

const TEST_DIR = 'src/lib/services/__test_stubs__';

/**
 * Clean up test stub files after each test
 */
async function cleanupTestStubs(): Promise<void> {
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore if directory doesn't exist
  }
}

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockPageAnalysis(overrides: Partial<PageAnalysis> = {}): PageAnalysis {
  return {
    url: 'https://example.com/test-page',
    title: 'Test Page',
    sections: [],
    navigation: [],
    interactiveElements: [],
    responsiveBreakpoints: ['768px', '1024px'],
    dependencies: [],
    ...overrides,
  };
}

function createMockImplementationPlan(overrides: Partial<ImplementationPlan> = {}): ImplementationPlan {
  return {
    pageRoute: '/test-page',
    components: [],
    dataFiles: [],
    serviceUpdates: [],
    typeDefinitions: [],
    configUpdates: [],
    ...overrides,
  };
}

// =============================================================================
// Unit Tests for detectCircularDependency
// =============================================================================

describe('Dependency Resolver Service - detectCircularDependency', () => {
  it('returns no circular dependency for empty array', () => {
    const result = detectCircularDependency([]);
    
    expect(result.hasCircular).toBe(false);
    expect(result.cycle).toBeNull();
  });

  it('returns no circular dependency for linear dependencies', () => {
    const dependencies: PageDependency[] = [
      { type: 'component', path: 'A', status: 'needs_creation', dependsOn: ['B'] },
      { type: 'component', path: 'B', status: 'needs_creation', dependsOn: ['C'] },
      { type: 'component', path: 'C', status: 'needs_creation', dependsOn: [] },
    ];
    
    const result = detectCircularDependency(dependencies);
    
    expect(result.hasCircular).toBe(false);
    expect(result.cycle).toBeNull();
  });

  it('detects simple circular dependency (A -> B -> A)', () => {
    const dependencies: PageDependency[] = [
      { type: 'component', path: 'A', status: 'needs_creation', dependsOn: ['B'] },
      { type: 'component', path: 'B', status: 'needs_creation', dependsOn: ['A'] },
    ];
    
    const result = detectCircularDependency(dependencies);
    
    expect(result.hasCircular).toBe(true);
    expect(result.cycle).not.toBeNull();
    expect(result.cycle).toContain('A');
    expect(result.cycle).toContain('B');
  });

  it('detects longer circular dependency (A -> B -> C -> A)', () => {
    const dependencies: PageDependency[] = [
      { type: 'component', path: 'A', status: 'needs_creation', dependsOn: ['B'] },
      { type: 'component', path: 'B', status: 'needs_creation', dependsOn: ['C'] },
      { type: 'component', path: 'C', status: 'needs_creation', dependsOn: ['A'] },
    ];
    
    const result = detectCircularDependency(dependencies);
    
    expect(result.hasCircular).toBe(true);
    expect(result.cycle).not.toBeNull();
    expect(result.cycle!.length).toBeGreaterThanOrEqual(3);
  });

  it('handles self-referencing dependency', () => {
    const dependencies: PageDependency[] = [
      { type: 'component', path: 'A', status: 'needs_creation', dependsOn: ['A'] },
    ];
    
    const result = detectCircularDependency(dependencies);
    
    expect(result.hasCircular).toBe(true);
    expect(result.cycle).toContain('A');
  });

  it('handles multiple independent subgraphs with one cycle', () => {
    const dependencies: PageDependency[] = [
      // Subgraph 1: no cycle
      { type: 'component', path: 'X', status: 'needs_creation', dependsOn: ['Y'] },
      { type: 'component', path: 'Y', status: 'needs_creation', dependsOn: [] },
      // Subgraph 2: has cycle
      { type: 'component', path: 'A', status: 'needs_creation', dependsOn: ['B'] },
      { type: 'component', path: 'B', status: 'needs_creation', dependsOn: ['A'] },
    ];
    
    const result = detectCircularDependency(dependencies);
    
    expect(result.hasCircular).toBe(true);
  });

  it('handles dependencies with no dependsOn', () => {
    const dependencies: PageDependency[] = [
      { type: 'component', path: 'A', status: 'exists', dependsOn: [] },
      { type: 'data', path: 'B', status: 'exists', dependsOn: [] },
      { type: 'service', path: 'C', status: 'exists', dependsOn: [] },
    ];
    
    const result = detectCircularDependency(dependencies);
    
    expect(result.hasCircular).toBe(false);
    expect(result.cycle).toBeNull();
  });
});

// =============================================================================
// Unit Tests for createStub
// =============================================================================

describe('Dependency Resolver Service - createStub', () => {
  beforeEach(async () => {
    await cleanupTestStubs();
  });

  afterEach(async () => {
    await cleanupTestStubs();
  });

  it('creates component stub with correct content', async () => {
    const dependency: PageDependency = {
      type: 'component',
      path: `${TEST_DIR}/TestComponent.tsx`,
      status: 'needs_creation',
      dependsOn: [],
    };
    
    const result = await createStub(dependency);
    
    expect(result.success).toBe(true);
    expect(result.path).toBe(dependency.path);
    expect(result.content).toContain('export default function TestComponent');
    expect(result.content).toContain('TODO');
    
    // Verify file was created
    const fileContent = await fs.readFile(dependency.path, 'utf-8');
    expect(fileContent).toBe(result.content);
  });

  it('creates data stub with correct JSON structure', async () => {
    const dependency: PageDependency = {
      type: 'data',
      path: `${TEST_DIR}/test-data.json`,
      status: 'needs_creation',
      dependsOn: [],
    };
    
    const result = await createStub(dependency);
    
    expect(result.success).toBe(true);
    
    // Parse and verify JSON structure
    const parsed = JSON.parse(result.content);
    expect(parsed._metadata.stub).toBe(true);
    expect(parsed._metadata.createdAt).toBeDefined();
    expect(parsed.data).toEqual([]);
  });

  it('creates service stub with correct content', async () => {
    const dependency: PageDependency = {
      type: 'service',
      path: `${TEST_DIR}/test.service.ts`,
      status: 'needs_creation',
      dependsOn: [],
    };
    
    const result = await createStub(dependency);
    
    expect(result.success).toBe(true);
    expect(result.content).toContain('export async function getData');
    expect(result.content).toContain('export async function getById');
    expect(result.content).toContain('TODO');
  });

  it('creates route stub with correct content', async () => {
    const dependency: PageDependency = {
      type: 'route',
      path: `${TEST_DIR}/src/app/(site)/test-route/page.tsx`,
      status: 'needs_creation',
      dependsOn: [],
    };
    
    const result = await createStub(dependency);
    
    expect(result.success).toBe(true);
    expect(result.content).toContain('export default function');
    expect(result.content).toContain('TODO');
  });

  it('creates nested directories if needed', async () => {
    const dependency: PageDependency = {
      type: 'component',
      path: `${TEST_DIR}/nested/deep/Component.tsx`,
      status: 'needs_creation',
      dependsOn: [],
    };
    
    const result = await createStub(dependency);
    
    expect(result.success).toBe(true);
    
    // Verify nested directory was created
    const stats = await fs.stat(`${TEST_DIR}/nested/deep`);
    expect(stats.isDirectory()).toBe(true);
  });
});

// =============================================================================
// Unit Tests for shouldBeShared and getSharedPath
// =============================================================================

describe('Dependency Resolver Service - shouldBeShared', () => {
  it('returns true when usageCount > 1', () => {
    const dependency: PageDependency = {
      type: 'component',
      path: 'src/components/local/Component.tsx',
      status: 'needs_creation',
      dependsOn: [],
    };
    
    expect(shouldBeShared(dependency, 2)).toBe(true);
    expect(shouldBeShared(dependency, 5)).toBe(true);
  });

  it('returns false when usageCount is 1 and not in shared location', () => {
    const dependency: PageDependency = {
      type: 'component',
      path: 'src/app/(site)/page/Component.tsx',
      status: 'needs_creation',
      dependsOn: [],
    };
    
    expect(shouldBeShared(dependency, 1)).toBe(false);
  });

  it('returns true when already in shared location', () => {
    const sharedPaths = [
      'src/components/ui/Button.tsx',
      'src/components/features/ToolCard.tsx',
      'src/lib/services/tools.service.ts',
      'src/lib/types/tool.ts',
      'src/data/tools.json',
    ];
    
    for (const sharedPath of sharedPaths) {
      const dependency: PageDependency = {
        type: 'component',
        path: sharedPath,
        status: 'exists',
        dependsOn: [],
      };
      
      expect(shouldBeShared(dependency, 1)).toBe(true);
    }
  });
});

describe('Dependency Resolver Service - getSharedPath', () => {
  it('returns correct shared path for component', () => {
    const dependency: PageDependency = {
      type: 'component',
      path: 'src/app/(site)/page/MyComponent.tsx',
      status: 'needs_creation',
      dependsOn: [],
    };
    
    const sharedPath = getSharedPath(dependency);
    
    expect(sharedPath).toBe('src/components/features/MyComponent.tsx');
  });

  it('returns correct shared path for data', () => {
    const dependency: PageDependency = {
      type: 'data',
      path: 'src/app/(site)/page/data.json',
      status: 'needs_creation',
      dependsOn: [],
    };
    
    const sharedPath = getSharedPath(dependency);
    
    expect(sharedPath).toBe('src/data/data.json');
  });

  it('returns correct shared path for service', () => {
    const dependency: PageDependency = {
      type: 'service',
      path: 'src/app/(site)/page/my.service.ts',
      status: 'needs_creation',
      dependsOn: [],
    };
    
    const sharedPath = getSharedPath(dependency);
    
    expect(sharedPath).toBe('src/lib/services/my.service.ts');
  });

  it('returns original path for route type', () => {
    const dependency: PageDependency = {
      type: 'route',
      path: 'src/app/(site)/my-page/page.tsx',
      status: 'needs_creation',
      dependsOn: [],
    };
    
    const sharedPath = getSharedPath(dependency);
    
    expect(sharedPath).toBe('src/app/(site)/my-page/page.tsx');
  });
});

// =============================================================================
// Unit Tests for analyzeDependencies
// =============================================================================

describe('Dependency Resolver Service - analyzeDependencies', () => {
  it('returns empty dependencies for empty implementation plan', async () => {
    const pageAnalysis = createMockPageAnalysis();
    const implementationPlan = createMockImplementationPlan();
    
    const graph = await analyzeDependencies(pageAnalysis, implementationPlan);
    
    expect(graph.dependencies).toEqual([]);
    expect(graph.sharedComponents).toEqual([]);
    expect(graph.sharedData).toEqual([]);
    expect(graph.linkedPages).toEqual([]);
  });

  it('extracts slug from URL correctly', async () => {
    const pageAnalysis = createMockPageAnalysis({
      url: 'https://example.com/category/my-page',
    });
    const implementationPlan = createMockImplementationPlan();
    
    const graph = await analyzeDependencies(pageAnalysis, implementationPlan);
    
    expect(graph.pageSlug).toBe('my-page');
  });

  it('identifies internal navigation links as linked pages', async () => {
    const pageAnalysis = createMockPageAnalysis({
      navigation: [
        { type: 'internal', href: '/other-page', text: 'Other Page' },
        { type: 'external', href: 'https://external.com', text: 'External' },
        { type: 'internal', href: '/another-page', text: 'Another Page' },
      ],
    });
    const implementationPlan = createMockImplementationPlan();
    
    const graph = await analyzeDependencies(pageAnalysis, implementationPlan);
    
    expect(graph.linkedPages).toContain('/other-page');
    expect(graph.linkedPages).toContain('/another-page');
    expect(graph.linkedPages).not.toContain('https://external.com');
  });

  it('creates route dependencies for internal navigation', async () => {
    const pageAnalysis = createMockPageAnalysis({
      navigation: [
        { type: 'internal', href: '/test-route', text: 'Test Route' },
      ],
    });
    const implementationPlan = createMockImplementationPlan();
    
    const graph = await analyzeDependencies(pageAnalysis, implementationPlan);
    
    const routeDep = graph.dependencies.find(d => d.type === 'route');
    expect(routeDep).toBeDefined();
    expect(routeDep!.path).toBe('src/app/(site)/test-route/page.tsx');
  });

  it('includes dependencies from pageAnalysis.dependencies', async () => {
    const pageAnalysis = createMockPageAnalysis({
      dependencies: ['/dep-page-1', '/dep-page-2'],
    });
    const implementationPlan = createMockImplementationPlan();
    
    const graph = await analyzeDependencies(pageAnalysis, implementationPlan);
    
    expect(graph.linkedPages).toContain('/dep-page-1');
    expect(graph.linkedPages).toContain('/dep-page-2');
  });
});

// =============================================================================
// Unit Tests for resolveDependencies
// =============================================================================

describe('Dependency Resolver Service - resolveDependencies', () => {
  beforeEach(async () => {
    await cleanupTestStubs();
  });

  afterEach(async () => {
    await cleanupTestStubs();
  });

  it('resolves empty dependency graph', async () => {
    const graph: DependencyGraph = {
      pageSlug: 'test-page',
      dependencies: [],
      sharedComponents: [],
      sharedData: [],
      linkedPages: [],
    };
    
    const result = await resolveDependencies(graph);
    
    expect(result.resolved).toEqual([]);
    expect(result.stubs).toEqual([]);
    expect(result.circularDependencies).toBeNull();
  });

  it('creates stubs for missing dependencies', async () => {
    const graph: DependencyGraph = {
      pageSlug: 'test-page',
      dependencies: [
        {
          type: 'component',
          path: `${TEST_DIR}/MissingComponent.tsx`,
          status: 'needs_creation',
          dependsOn: [],
        },
      ],
      sharedComponents: [],
      sharedData: [],
      linkedPages: [],
    };
    
    const result = await resolveDependencies(graph);
    
    expect(result.stubs.length).toBe(1);
    expect(result.stubs[0]).toBe(`${TEST_DIR}/MissingComponent.tsx`);
    expect(result.resolved[0].status).toBe('stub');
  });

  it('detects and reports circular dependencies', async () => {
    const graph: DependencyGraph = {
      pageSlug: 'test-page',
      dependencies: [
        {
          type: 'component',
          path: `${TEST_DIR}/ComponentA.tsx`,
          status: 'needs_creation',
          dependsOn: [`${TEST_DIR}/ComponentB.tsx`],
        },
        {
          type: 'component',
          path: `${TEST_DIR}/ComponentB.tsx`,
          status: 'needs_creation',
          dependsOn: [`${TEST_DIR}/ComponentA.tsx`],
        },
      ],
      sharedComponents: [],
      sharedData: [],
      linkedPages: [],
    };
    
    const result = await resolveDependencies(graph);
    
    expect(result.circularDependencies).not.toBeNull();
    expect(result.circularDependencies!.length).toBeGreaterThan(0);
  });

  it('preserves shared resources from input graph', async () => {
    const graph: DependencyGraph = {
      pageSlug: 'test-page',
      dependencies: [],
      sharedComponents: ['src/components/ui/Button.tsx'],
      sharedData: ['src/data/tools.json'],
      linkedPages: [],
    };
    
    const result = await resolveDependencies(graph);
    
    expect(result.sharedResources.components).toContain('src/components/ui/Button.tsx');
    expect(result.sharedResources.data).toContain('src/data/tools.json');
  });
});
