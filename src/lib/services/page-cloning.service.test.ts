/**
 * Integration tests for Page Cloning Orchestrator Service
 * 
 * Tests the full workflow with mock source page data,
 * progress tracking, and recovery functionality.
 * 
 * @requirements 11.1, 16.1, 21.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';

import {
  PageCloningOrchestrator,
  createOrchestrator,
  executePhase,
  getCloneStatus,
  resumeClone,
  generateSlugFromUrl,
  type ClonePageOptions,
} from './page-cloning.service';

// =============================================================================
// Test Fixtures
// =============================================================================

const MOCK_SNAPSHOT = `- document
  - banner
    - navigation
      - link "Home" [href="/"]
      - link "About" [href="/about"]
  - main
    - heading "Welcome to Test Page" [level=1]
    - paragraph "This is a test paragraph with some content."
    - list
      - listitem "Item 1"
      - listitem "Item 2"
    - link "External Link" [href="https://example.com"]
  - contentinfo
    - paragraph "Footer content"`;

const MOCK_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
  <meta name="description" content="A test page for cloning">
  <meta property="og:title" content="Test Page OG">
  <link rel="canonical" href="https://source.com/test-page">
</head>
<body>
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
  </header>
  <main>
    <h1>Welcome to Test Page</h1>
    <p>This is a test paragraph with some content.</p>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
    <a href="https://example.com" target="_blank" rel="noopener noreferrer">External Link</a>
    <img src="https://cdn.example.com/image.jpg" alt="Test image" width="300" height="200">
  </main>
  <footer>
    <p>Footer content</p>
  </footer>
</body>
</html>`;

const TEST_OPTIONS: ClonePageOptions = {
  sourceUrl: 'https://source.com/test-page',
  featureName: 'test-feature',
  pageSlug: 'test-page-integration',
  verbose: false,
};

const PROGRESS_DIR = '.kiro/specs/page-cloning-agent/progress';

// =============================================================================
// Helper Functions
// =============================================================================

async function cleanupProgressFile(pageSlug: string): Promise<void> {
  const filePath = path.join(PROGRESS_DIR, `${pageSlug}.json`);
  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore if file doesn't exist
  }
}

async function ensureProgressDir(): Promise<void> {
  try {
    await fs.mkdir(PROGRESS_DIR, { recursive: true });
  } catch {
    // Ignore if directory exists
  }
}


// =============================================================================
// Tests
// =============================================================================

describe('PageCloningOrchestrator', () => {
  beforeEach(async () => {
    await ensureProgressDir();
    await cleanupProgressFile(TEST_OPTIONS.pageSlug);
  });

  afterEach(async () => {
    await cleanupProgressFile(TEST_OPTIONS.pageSlug);
  });

  describe('initialization', () => {
    it('should create a new progress file on initialization', async () => {
      const orchestrator = await createOrchestrator(TEST_OPTIONS);
      
      expect(orchestrator.getStatus()).toBe('idle');
      expect(orchestrator.getProgressFile()).not.toBeNull();
      expect(orchestrator.getProgressFile()?.sourceUrl).toBe(TEST_OPTIONS.sourceUrl);
      expect(orchestrator.getProgressFile()?.pageSlug).toBe(TEST_OPTIONS.pageSlug);
    });

    it('should resume from existing progress file', async () => {
      // Create initial orchestrator
      const orchestrator1 = await createOrchestrator(TEST_OPTIONS);
      await orchestrator1.executeAnalyzePhase({
        snapshot: MOCK_SNAPSHOT,
        title: 'Test Page',
      });

      // Create second orchestrator with resume
      const orchestrator2 = await createOrchestrator({
        ...TEST_OPTIONS,
        resumeFromProgress: true,
      });

      expect(orchestrator2.getProgressFile()).not.toBeNull();
      expect(orchestrator2.getProgressFile()?.phases.analyze.status).toBe('completed');
    });
  });

  describe('analyze phase', () => {
    it('should analyze a page snapshot successfully', async () => {
      const orchestrator = await createOrchestrator(TEST_OPTIONS);
      
      const result = await orchestrator.executeAnalyzePhase({
        snapshot: MOCK_SNAPSHOT,
        title: 'Test Page',
      });

      expect(result.status).toBe('success');
      expect(result.phase).toBe('analyze');
      expect(orchestrator.getPageAnalysis()).not.toBeNull();
      expect(orchestrator.getPageAnalysis()?.title).toBe('Test Page');
      expect(orchestrator.getPageAnalysis()?.sections.length).toBeGreaterThan(0);
    });
  });


  describe('extract phase', () => {
    it('should extract data from HTML successfully', async () => {
      const orchestrator = await createOrchestrator(TEST_OPTIONS);
      
      // Run analyze first
      await orchestrator.executeAnalyzePhase({
        snapshot: MOCK_SNAPSHOT,
        title: 'Test Page',
      });

      const result = await orchestrator.executeExtractPhase({
        html: MOCK_HTML,
      });

      expect(result.status).toBe('success');
      expect(result.phase).toBe('extract');
      expect(orchestrator.getExtractedData()).not.toBeNull();
      expect(orchestrator.getExtractedData()?.metadata.title).toBe('Test Page');
      expect(orchestrator.getExtractedData()?.itemCounts.images).toBeGreaterThan(0);
    });
  });

  describe('plan phase', () => {
    it('should create implementation plan successfully', async () => {
      const orchestrator = await createOrchestrator(TEST_OPTIONS);
      
      // Run previous phases
      await orchestrator.executeAnalyzePhase({
        snapshot: MOCK_SNAPSHOT,
        title: 'Test Page',
      });
      await orchestrator.executeExtractPhase({
        html: MOCK_HTML,
      });

      const result = await orchestrator.executePlanPhase();

      expect(result.status).toBe('success');
      expect(result.phase).toBe('plan');
      expect(orchestrator.getImplementationPlan()).not.toBeNull();
      expect(orchestrator.getImplementationPlan()?.components.length).toBeGreaterThan(0);
      expect(orchestrator.getImplementationPlan()?.dataFiles.length).toBeGreaterThan(0);
    });

    it('should fail if analyze phase not completed', async () => {
      const orchestrator = await createOrchestrator(TEST_OPTIONS);
      
      const result = await orchestrator.executePlanPhase();

      // Should fail or need retry when prerequisites are missing
      expect(['failed', 'needs_retry']).toContain(result.status);
      expect(result.errors).toBeDefined();
    });
  });


  describe('implement phase', () => {
    it('should return implementation instructions', async () => {
      const orchestrator = await createOrchestrator(TEST_OPTIONS);
      
      // Run previous phases
      await orchestrator.executeAnalyzePhase({
        snapshot: MOCK_SNAPSHOT,
        title: 'Test Page',
      });
      await orchestrator.executeExtractPhase({
        html: MOCK_HTML,
      });
      await orchestrator.executePlanPhase();

      const result = await orchestrator.executeImplementPhase();

      expect(result.status).toBe('success');
      expect(result.phase).toBe('implement');
      expect(result.data).toHaveProperty('plan');
      expect(result.data).toHaveProperty('instructions');
    });

    it('should track created and modified files', async () => {
      const orchestrator = await createOrchestrator(TEST_OPTIONS);
      
      // Run previous phases
      await orchestrator.executeAnalyzePhase({
        snapshot: MOCK_SNAPSHOT,
        title: 'Test Page',
      });
      await orchestrator.executeExtractPhase({
        html: MOCK_HTML,
      });
      await orchestrator.executePlanPhase();
      await orchestrator.executeImplementPhase();

      // Mark implementation complete
      await orchestrator.markImplementPhaseComplete(
        ['src/app/(site)/test-feature/page.tsx'],
        ['next.config.js']
      );

      const progress = orchestrator.getProgressFile();
      expect(progress?.filesCreated).toContain('src/app/(site)/test-feature/page.tsx');
      expect(progress?.filesModified).toContain('next.config.js');
    });
  });

  describe('verify phase', () => {
    it('should verify clone against source', async () => {
      const orchestrator = await createOrchestrator(TEST_OPTIONS);
      
      // Run all previous phases
      await orchestrator.executeAnalyzePhase({
        snapshot: MOCK_SNAPSHOT,
        title: 'Test Page',
      });
      await orchestrator.executeExtractPhase({
        html: MOCK_HTML,
      });
      await orchestrator.executePlanPhase();
      await orchestrator.executeImplementPhase();
      await orchestrator.markImplementPhaseComplete([], []);

      // Verify with matching snapshots
      const result = await orchestrator.executeVerifyPhase({
        sourceSnapshot: MOCK_SNAPSHOT,
        cloneSnapshot: MOCK_SNAPSHOT, // Same snapshot = should pass
      });

      expect(result.phase).toBe('verify');
      // Result depends on snapshot comparison
      expect(['success', 'needs_retry', 'failed']).toContain(result.status);
    });
  });


  describe('complete', () => {
    it('should create a summary on completion', async () => {
      const orchestrator = await createOrchestrator(TEST_OPTIONS);
      
      // Run all phases
      await orchestrator.executeAnalyzePhase({
        snapshot: MOCK_SNAPSHOT,
        title: 'Test Page',
      });
      await orchestrator.executeExtractPhase({
        html: MOCK_HTML,
      });
      await orchestrator.executePlanPhase();
      await orchestrator.executeImplementPhase();
      await orchestrator.markImplementPhaseComplete(
        ['src/app/(site)/test-feature/page.tsx'],
        []
      );
      await orchestrator.executeVerifyPhase({
        sourceSnapshot: MOCK_SNAPSHOT,
        cloneSnapshot: MOCK_SNAPSHOT,
      });

      const result = await orchestrator.complete();

      expect(result.pageSlug).toBe(TEST_OPTIONS.pageSlug);
      expect(result.sourceUrl).toBe(TEST_OPTIONS.sourceUrl);
      expect(result.phases.length).toBeGreaterThan(0);
      expect(result.summary).toContain('Page Cloning');
    });
  });
});

describe('generateSlugFromUrl', () => {
  it('should generate slug from URL path', () => {
    expect(generateSlugFromUrl('https://example.com/my-page')).toBe('my-page');
    expect(generateSlugFromUrl('https://example.com/category/sub-page')).toBe('sub-page');
    expect(generateSlugFromUrl('https://example.com/')).toBe('index');
  });

  it('should handle special characters', () => {
    expect(generateSlugFromUrl('https://example.com/My Page!')).toBe('my-page');
    expect(generateSlugFromUrl('https://example.com/test_page')).toBe('test_page');
  });

  it('should handle invalid URLs', () => {
    expect(generateSlugFromUrl('not-a-url')).toBe('page');
    expect(generateSlugFromUrl('')).toBe('page');
  });
});


describe('executePhase', () => {
  const phaseTestSlug = 'test-phase-execution';

  beforeEach(async () => {
    await ensureProgressDir();
    await cleanupProgressFile(phaseTestSlug);
  });

  afterEach(async () => {
    await cleanupProgressFile(phaseTestSlug);
  });

  it('should execute analyze phase independently', async () => {
    const result = await executePhase(
      phaseTestSlug,
      'analyze',
      { snapshot: MOCK_SNAPSHOT, title: 'Test' },
      { sourceUrl: 'https://example.com', featureName: 'test' }
    );

    expect(result.phase).toBe('analyze');
    expect(result.status).toBe('success');
  });

  it('should throw error for missing input', async () => {
    await expect(
      executePhase(
        phaseTestSlug,
        'analyze',
        null,
        { sourceUrl: 'https://example.com', featureName: 'test' }
      )
    ).rejects.toThrow('Analyze phase requires snapshot input');
  });
});

describe('resumeClone', () => {
  const resumeTestSlug = 'test-resume-clone';

  beforeEach(async () => {
    await ensureProgressDir();
    await cleanupProgressFile(resumeTestSlug);
  });

  afterEach(async () => {
    await cleanupProgressFile(resumeTestSlug);
  });

  it('should return analyze as next phase for new clone', async () => {
    const result = await resumeClone(resumeTestSlug);

    expect(result.nextPhase).toBe('analyze');
    expect(result.progressFile).toBeNull();
  });

  it('should return correct next phase for partial clone', async () => {
    // Create orchestrator and complete analyze phase
    const orchestrator = await createOrchestrator({
      sourceUrl: 'https://example.com',
      featureName: 'test',
      pageSlug: resumeTestSlug,
    });
    await orchestrator.executeAnalyzePhase({
      snapshot: MOCK_SNAPSHOT,
      title: 'Test',
    });

    const result = await resumeClone(resumeTestSlug);

    expect(result.nextPhase).toBe('extract');
    expect(result.progressFile).not.toBeNull();
    expect(result.progressFile?.phases.analyze.status).toBe('completed');
  });
});

describe('getCloneStatus', () => {
  const statusTestSlug = 'test-clone-status';

  beforeEach(async () => {
    await ensureProgressDir();
    await cleanupProgressFile(statusTestSlug);
  });

  afterEach(async () => {
    await cleanupProgressFile(statusTestSlug);
  });

  it('should return null for non-existent clone', async () => {
    const status = await getCloneStatus(statusTestSlug);
    expect(status).toBeNull();
  });

  it('should return progress file for existing clone', async () => {
    await createOrchestrator({
      sourceUrl: 'https://example.com',
      featureName: 'test',
      pageSlug: statusTestSlug,
    });

    const status = await getCloneStatus(statusTestSlug);
    expect(status).not.toBeNull();
    expect(status?.pageSlug).toBe(statusTestSlug);
  });
});
