/**
 * Property-Based Tests for Page Cloning Progress Service
 * 
 * Tests that:
 * - Property 9: Progress file updates contain completed status and valid timestamp
 * 
 * @see .kiro/specs/page-cloning-agent/design.md
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  createProgressFile,
  updatePhaseStatus,
  readProgressFile,
  archiveProgressFile,
  getLastCompletedPhase,
  getNextPhase,
  progressFileExists,
  saveExtractedData,
  saveImplementationPlan,
  addCreatedFile,
  addModifiedFile,
  logError,
  incrementVerificationAttempts,
} from './page-cloning-progress.service';
import type { ExtractedData, ImplementationPlan, PhaseType } from '../types/page-cloning';

// =============================================================================
// Test Setup and Cleanup
// =============================================================================

const TEST_PROGRESS_DIR = '.kiro/specs/page-cloning-agent/progress';
const TEST_ARCHIVE_DIR = '.kiro/specs/page-cloning-agent/progress/archive';

/**
 * Clean up test files after each test
 */
async function cleanupTestFiles(slugs: string[]): Promise<void> {
  for (const slug of slugs) {
    try {
      await fs.unlink(path.join(TEST_PROGRESS_DIR, `${slug}.json`));
    } catch {
      // Ignore if file doesn't exist
    }
  }
  
  // Clean up archive files
  try {
    const archiveFiles = await fs.readdir(TEST_ARCHIVE_DIR);
    for (const file of archiveFiles) {
      for (const slug of slugs) {
        if (file.startsWith(slug)) {
          await fs.unlink(path.join(TEST_ARCHIVE_DIR, file));
        }
      }
    }
  } catch {
    // Ignore if directory doesn't exist
  }
}

// =============================================================================
// Arbitraries (Generators) for Property-Based Testing
// =============================================================================

/**
 * Generates valid slugs (lowercase alphanumeric with hyphens)
 * Prefixed with 'test-' to identify test files for cleanup
 */
const testSlugArbitrary = fc
  .stringMatching(/^[a-z][a-z0-9-]*[a-z0-9]$/)
  .filter((s) => s.length >= 2 && s.length <= 30 && !s.includes('--'))
  .map((s) => `test-${s}`);

/**
 * Generates valid URLs
 */
const urlArbitrary = fc.webUrl();

/**
 * Generates PhaseType values
 */
const phaseTypeArbitrary: fc.Arbitrary<PhaseType> = fc.constantFrom(
  'analyze' as const,
  'extract' as const,
  'plan' as const,
  'implement' as const,
  'verify' as const
);



// =============================================================================
// Property-Based Tests
// =============================================================================

describe('Page Cloning Progress Service - Property 9: Progress File Updates', () => {
  /**
   * **Feature: page-cloning-agent, Property 9: Progress File Updates**
   * **Validates: Requirements 21.2**
   * 
   * For any completed phase, the progress file SHALL contain a status entry
   * with 'completed' status and a valid timestamp.
   */

  const createdSlugs: string[] = [];

  afterEach(async () => {
    await cleanupTestFiles(createdSlugs);
    createdSlugs.length = 0;
  });

  it('completed phase has status "completed" and valid completedAt timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        testSlugArbitrary,
        urlArbitrary,
        phaseTypeArbitrary,
        async (slug, sourceUrl, phase) => {
          createdSlugs.push(slug);
          
          // Create a progress file
          await createProgressFile(sourceUrl, slug);
          
          // Update phase to in_progress first
          await updatePhaseStatus(slug, phase, 'in_progress');
          
          // Update phase to completed
          const updatedProgress = await updatePhaseStatus(slug, phase, 'completed');
          
          // Verify the phase has 'completed' status
          expect(updatedProgress.phases[phase].status).toBe('completed');
          
          // Verify completedAt is a valid ISO timestamp
          const completedAt = updatedProgress.phases[phase].completedAt;
          expect(completedAt).toBeDefined();
          expect(typeof completedAt).toBe('string');
          
          // Verify it's a valid ISO date string
          const parsedDate = new Date(completedAt!);
          expect(parsedDate.toISOString()).toBe(completedAt);
          
          // Verify the timestamp is recent (within last minute)
          const now = Date.now();
          const completedTime = parsedDate.getTime();
          expect(completedTime).toBeLessThanOrEqual(now);
          expect(completedTime).toBeGreaterThan(now - 60000);
        }
      ),
      { numRuns: 20 } // Reduced runs due to file I/O
    );
  });

  it('lastUpdatedAt is updated when phase status changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        testSlugArbitrary,
        urlArbitrary,
        phaseTypeArbitrary,
        async (slug, sourceUrl, phase) => {
          createdSlugs.push(slug);
          
          // Create a progress file
          const initialProgress = await createProgressFile(sourceUrl, slug);
          const initialLastUpdated = initialProgress.lastUpdatedAt;
          
          // Small delay to ensure timestamp difference
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // Update phase status
          const updatedProgress = await updatePhaseStatus(slug, phase, 'completed');
          
          // Verify lastUpdatedAt changed
          expect(updatedProgress.lastUpdatedAt).not.toBe(initialLastUpdated);
          
          // Verify it's a valid ISO timestamp
          const parsedDate = new Date(updatedProgress.lastUpdatedAt);
          expect(parsedDate.toISOString()).toBe(updatedProgress.lastUpdatedAt);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('progress file persists to disk and can be read back', async () => {
    await fc.assert(
      fc.asyncProperty(
        testSlugArbitrary,
        urlArbitrary,
        phaseTypeArbitrary,
        async (slug, sourceUrl, phase) => {
          createdSlugs.push(slug);
          
          // Create and update progress file
          await createProgressFile(sourceUrl, slug);
          await updatePhaseStatus(slug, phase, 'completed');
          
          // Read it back from disk
          const readProgress = await readProgressFile(slug);
          
          expect(readProgress).not.toBeNull();
          expect(readProgress!.phases[phase].status).toBe('completed');
          expect(readProgress!.phases[phase].completedAt).toBeDefined();
        }
      ),
      { numRuns: 20 }
    );
  });
});

// =============================================================================
// Unit Tests for Progress Service
// =============================================================================

describe('Page Cloning Progress Service - Unit Tests', () => {
  const testSlug = 'unit-test-page';
  const testUrl = 'https://example.com/test-page';

  beforeEach(async () => {
    await cleanupTestFiles([testSlug]);
  });

  afterEach(async () => {
    await cleanupTestFiles([testSlug]);
  });

  describe('createProgressFile', () => {
    it('creates a new progress file with correct initial state', async () => {
      const progress = await createProgressFile(testUrl, testSlug);

      expect(progress.sourceUrl).toBe(testUrl);
      expect(progress.pageSlug).toBe(testSlug);
      expect(progress.status).toBe('in_progress');
      expect(progress.phases.analyze.status).toBe('pending');
      expect(progress.phases.extract.status).toBe('pending');
      expect(progress.phases.plan.status).toBe('pending');
      expect(progress.phases.implement.status).toBe('pending');
      expect(progress.phases.verify.status).toBe('pending');
      expect(progress.filesCreated).toEqual([]);
      expect(progress.filesModified).toEqual([]);
      expect(progress.errors).toEqual([]);
      expect(progress.verificationAttempts).toBe(0);
    });

    it('creates progress file on disk', async () => {
      await createProgressFile(testUrl, testSlug);
      
      const exists = await progressFileExists(testSlug);
      expect(exists).toBe(true);
    });
  });

  describe('readProgressFile', () => {
    it('returns null for non-existent file', async () => {
      const result = await readProgressFile('non-existent-slug');
      expect(result).toBeNull();
    });

    it('reads existing progress file correctly', async () => {
      await createProgressFile(testUrl, testSlug);
      
      const progress = await readProgressFile(testSlug);
      
      expect(progress).not.toBeNull();
      expect(progress!.sourceUrl).toBe(testUrl);
      expect(progress!.pageSlug).toBe(testSlug);
    });
  });

  describe('updatePhaseStatus', () => {
    it('updates phase to in_progress with startedAt timestamp', async () => {
      await createProgressFile(testUrl, testSlug);
      
      const progress = await updatePhaseStatus(testSlug, 'analyze', 'in_progress');
      
      expect(progress.phases.analyze.status).toBe('in_progress');
      expect(progress.phases.analyze.startedAt).toBeDefined();
    });

    it('updates phase to completed with completedAt timestamp', async () => {
      await createProgressFile(testUrl, testSlug);
      await updatePhaseStatus(testSlug, 'analyze', 'in_progress');
      
      const progress = await updatePhaseStatus(testSlug, 'analyze', 'completed');
      
      expect(progress.phases.analyze.status).toBe('completed');
      expect(progress.phases.analyze.completedAt).toBeDefined();
    });

    it('updates phase to failed with error message', async () => {
      await createProgressFile(testUrl, testSlug);
      
      const errorMessage = 'Test error message';
      const progress = await updatePhaseStatus(testSlug, 'analyze', 'failed', errorMessage);
      
      expect(progress.phases.analyze.status).toBe('failed');
      expect(progress.phases.analyze.error).toBe(errorMessage);
    });

    it('throws error for non-existent progress file', async () => {
      await expect(
        updatePhaseStatus('non-existent', 'analyze', 'completed')
      ).rejects.toThrow('Progress file not found');
    });
  });

  describe('archiveProgressFile', () => {
    it('archives progress file and removes original', async () => {
      await createProgressFile(testUrl, testSlug);
      
      const archivePath = await archiveProgressFile(testSlug);
      
      // Original should be gone
      const exists = await progressFileExists(testSlug);
      expect(exists).toBe(false);
      
      // Archive should exist
      expect(archivePath).toContain(testSlug);
      expect(archivePath).toContain('archive');
    });

    it('throws error for non-existent progress file', async () => {
      await expect(
        archiveProgressFile('non-existent')
      ).rejects.toThrow('Progress file not found');
    });
  });

  describe('getLastCompletedPhase', () => {
    it('returns null when no phases completed', async () => {
      await createProgressFile(testUrl, testSlug);
      
      const lastPhase = await getLastCompletedPhase(testSlug);
      
      expect(lastPhase).toBeNull();
    });

    it('returns the last completed phase in order', async () => {
      await createProgressFile(testUrl, testSlug);
      await updatePhaseStatus(testSlug, 'analyze', 'completed');
      await updatePhaseStatus(testSlug, 'extract', 'completed');
      
      const lastPhase = await getLastCompletedPhase(testSlug);
      
      expect(lastPhase).toBe('extract');
    });

    it('stops at first non-completed phase', async () => {
      await createProgressFile(testUrl, testSlug);
      await updatePhaseStatus(testSlug, 'analyze', 'completed');
      await updatePhaseStatus(testSlug, 'extract', 'in_progress');
      
      const lastPhase = await getLastCompletedPhase(testSlug);
      
      expect(lastPhase).toBe('analyze');
    });
  });

  describe('getNextPhase', () => {
    it('returns analyze for new progress file', async () => {
      await createProgressFile(testUrl, testSlug);
      
      const nextPhase = await getNextPhase(testSlug);
      
      expect(nextPhase).toBe('analyze');
    });

    it('returns next incomplete phase', async () => {
      await createProgressFile(testUrl, testSlug);
      await updatePhaseStatus(testSlug, 'analyze', 'completed');
      
      const nextPhase = await getNextPhase(testSlug);
      
      expect(nextPhase).toBe('extract');
    });

    it('returns null when all phases completed', async () => {
      await createProgressFile(testUrl, testSlug);
      await updatePhaseStatus(testSlug, 'analyze', 'completed');
      await updatePhaseStatus(testSlug, 'extract', 'completed');
      await updatePhaseStatus(testSlug, 'plan', 'completed');
      await updatePhaseStatus(testSlug, 'implement', 'completed');
      await updatePhaseStatus(testSlug, 'verify', 'completed');
      
      const nextPhase = await getNextPhase(testSlug);
      
      expect(nextPhase).toBeNull();
    });

    it('returns analyze for non-existent progress file', async () => {
      const nextPhase = await getNextPhase('non-existent');
      
      expect(nextPhase).toBe('analyze');
    });
  });

  describe('progressFileExists', () => {
    it('returns false for non-existent file', async () => {
      const exists = await progressFileExists('non-existent');
      expect(exists).toBe(false);
    });

    it('returns true for existing file', async () => {
      await createProgressFile(testUrl, testSlug);
      
      const exists = await progressFileExists(testSlug);
      expect(exists).toBe(true);
    });
  });

  describe('saveExtractedData', () => {
    it('saves extracted data to progress file', async () => {
      await createProgressFile(testUrl, testSlug);
      
      const extractedData: ExtractedData = {
        metadata: {
          title: 'Test Page',
          description: 'Test description',
          ogTitle: 'OG Title',
          ogDescription: 'OG Description',
          ogImage: 'https://example.com/image.png',
          canonical: 'https://example.com/test',
        },
        textContent: [],
        images: [],
        links: [],
        lists: [],
        forms: [],
        structuredData: {},
        extractedAt: new Date().toISOString(),
        itemCounts: { text: 0, images: 0, links: 0, listItems: 0 },
      };
      
      const progress = await saveExtractedData(testSlug, extractedData);
      
      expect(progress.extractedData).toEqual(extractedData);
    });

    it('throws error for non-existent progress file', async () => {
      const extractedData: ExtractedData = {
        metadata: {
          title: 'Test',
          description: '',
          ogTitle: '',
          ogDescription: '',
          ogImage: '',
          canonical: '',
        },
        textContent: [],
        images: [],
        links: [],
        lists: [],
        forms: [],
        structuredData: {},
        extractedAt: new Date().toISOString(),
        itemCounts: { text: 0, images: 0, links: 0, listItems: 0 },
      };
      
      await expect(
        saveExtractedData('non-existent', extractedData)
      ).rejects.toThrow('Progress file not found');
    });
  });

  describe('saveImplementationPlan', () => {
    it('saves implementation plan to progress file', async () => {
      await createProgressFile(testUrl, testSlug);
      
      const plan: ImplementationPlan = {
        pageRoute: '/test-page',
        components: [],
        dataFiles: [],
        serviceUpdates: [],
        typeDefinitions: [],
        configUpdates: [],
      };
      
      const progress = await saveImplementationPlan(testSlug, plan);
      
      expect(progress.implementationPlan).toEqual(plan);
    });

    it('throws error for non-existent progress file', async () => {
      const plan: ImplementationPlan = {
        pageRoute: '/test',
        components: [],
        dataFiles: [],
        serviceUpdates: [],
        typeDefinitions: [],
        configUpdates: [],
      };
      
      await expect(
        saveImplementationPlan('non-existent', plan)
      ).rejects.toThrow('Progress file not found');
    });
  });

  describe('addCreatedFile', () => {
    it('adds file to created files list', async () => {
      await createProgressFile(testUrl, testSlug);
      
      const progress = await addCreatedFile(testSlug, 'src/test/file.tsx');
      
      expect(progress.filesCreated).toContain('src/test/file.tsx');
    });

    it('does not add duplicate files', async () => {
      await createProgressFile(testUrl, testSlug);
      
      await addCreatedFile(testSlug, 'src/test/file.tsx');
      const progress = await addCreatedFile(testSlug, 'src/test/file.tsx');
      
      expect(progress.filesCreated.filter(f => f === 'src/test/file.tsx')).toHaveLength(1);
    });

    it('throws error for non-existent progress file', async () => {
      await expect(
        addCreatedFile('non-existent', 'src/test/file.tsx')
      ).rejects.toThrow('Progress file not found');
    });
  });

  describe('addModifiedFile', () => {
    it('adds file to modified files list', async () => {
      await createProgressFile(testUrl, testSlug);
      
      const progress = await addModifiedFile(testSlug, 'src/existing/file.tsx');
      
      expect(progress.filesModified).toContain('src/existing/file.tsx');
    });

    it('does not add duplicate files', async () => {
      await createProgressFile(testUrl, testSlug);
      
      await addModifiedFile(testSlug, 'src/existing/file.tsx');
      const progress = await addModifiedFile(testSlug, 'src/existing/file.tsx');
      
      expect(progress.filesModified.filter(f => f === 'src/existing/file.tsx')).toHaveLength(1);
    });

    it('throws error for non-existent progress file', async () => {
      await expect(
        addModifiedFile('non-existent', 'src/existing/file.tsx')
      ).rejects.toThrow('Progress file not found');
    });
  });

  describe('logError', () => {
    it('logs error to progress file', async () => {
      await createProgressFile(testUrl, testSlug);
      
      const progress = await logError(testSlug, 'analyze', 'Test error message');
      
      expect(progress.errors).toHaveLength(1);
      expect(progress.errors[0].phase).toBe('analyze');
      expect(progress.errors[0].error).toBe('Test error message');
      expect(progress.errors[0].timestamp).toBeDefined();
    });

    it('logs error with resolution', async () => {
      await createProgressFile(testUrl, testSlug);
      
      const progress = await logError(testSlug, 'extract', 'Error occurred', 'Fixed by retry');
      
      expect(progress.errors[0].resolution).toBe('Fixed by retry');
    });

    it('accumulates multiple errors', async () => {
      await createProgressFile(testUrl, testSlug);
      
      await logError(testSlug, 'analyze', 'First error');
      const progress = await logError(testSlug, 'extract', 'Second error');
      
      expect(progress.errors).toHaveLength(2);
    });

    it('throws error for non-existent progress file', async () => {
      await expect(
        logError('non-existent', 'analyze', 'Error')
      ).rejects.toThrow('Progress file not found');
    });
  });

  describe('incrementVerificationAttempts', () => {
    it('increments verification attempts counter', async () => {
      await createProgressFile(testUrl, testSlug);
      
      const progress = await incrementVerificationAttempts(testSlug);
      
      expect(progress.verificationAttempts).toBe(1);
    });

    it('increments counter multiple times', async () => {
      await createProgressFile(testUrl, testSlug);
      
      await incrementVerificationAttempts(testSlug);
      await incrementVerificationAttempts(testSlug);
      const progress = await incrementVerificationAttempts(testSlug);
      
      expect(progress.verificationAttempts).toBe(3);
    });

    it('throws error for non-existent progress file', async () => {
      await expect(
        incrementVerificationAttempts('non-existent')
      ).rejects.toThrow('Progress file not found');
    });
  });

  describe('Resume from Interruption Logic', () => {
    it('can resume from analyze phase completion', async () => {
      await createProgressFile(testUrl, testSlug);
      await updatePhaseStatus(testSlug, 'analyze', 'completed');
      
      const lastCompleted = await getLastCompletedPhase(testSlug);
      const nextPhase = await getNextPhase(testSlug);
      
      expect(lastCompleted).toBe('analyze');
      expect(nextPhase).toBe('extract');
    });

    it('can resume from extract phase with saved data', async () => {
      await createProgressFile(testUrl, testSlug);
      await updatePhaseStatus(testSlug, 'analyze', 'completed');
      await updatePhaseStatus(testSlug, 'extract', 'completed');
      
      const extractedData: ExtractedData = {
        metadata: {
          title: 'Test',
          description: 'Desc',
          ogTitle: '',
          ogDescription: '',
          ogImage: '',
          canonical: '',
        },
        textContent: [{ id: '1', content: 'Test content', tag: 'p', order: 0 }],
        images: [],
        links: [],
        lists: [],
        forms: [],
        structuredData: {},
        extractedAt: new Date().toISOString(),
        itemCounts: { text: 1, images: 0, links: 0, listItems: 0 },
      };
      await saveExtractedData(testSlug, extractedData);
      
      // Simulate interruption and resume
      const progress = await readProgressFile(testSlug);
      const nextPhase = await getNextPhase(testSlug);
      
      expect(progress?.extractedData).toBeDefined();
      expect(progress?.extractedData?.textContent).toHaveLength(1);
      expect(nextPhase).toBe('plan');
    });

    it('can resume from plan phase with saved implementation plan', async () => {
      await createProgressFile(testUrl, testSlug);
      await updatePhaseStatus(testSlug, 'analyze', 'completed');
      await updatePhaseStatus(testSlug, 'extract', 'completed');
      await updatePhaseStatus(testSlug, 'plan', 'completed');
      
      const plan: ImplementationPlan = {
        pageRoute: '/test-page',
        components: [{ name: 'TestComponent', path: 'src/components/Test.tsx', props: [], reusesExisting: null }],
        dataFiles: [],
        serviceUpdates: [],
        typeDefinitions: [],
        configUpdates: [],
      };
      await saveImplementationPlan(testSlug, plan);
      
      // Simulate interruption and resume
      const progress = await readProgressFile(testSlug);
      const nextPhase = await getNextPhase(testSlug);
      
      expect(progress?.implementationPlan).toBeDefined();
      expect(progress?.implementationPlan?.components).toHaveLength(1);
      expect(nextPhase).toBe('implement');
    });

    it('tracks files created during implementation for resume', async () => {
      await createProgressFile(testUrl, testSlug);
      await updatePhaseStatus(testSlug, 'analyze', 'completed');
      await updatePhaseStatus(testSlug, 'extract', 'completed');
      await updatePhaseStatus(testSlug, 'plan', 'completed');
      await updatePhaseStatus(testSlug, 'implement', 'in_progress');
      
      await addCreatedFile(testSlug, 'src/app/test/page.tsx');
      await addCreatedFile(testSlug, 'src/components/TestComponent.tsx');
      await addModifiedFile(testSlug, 'next.config.js');
      
      // Simulate interruption and resume
      const progress = await readProgressFile(testSlug);
      
      expect(progress?.filesCreated).toContain('src/app/test/page.tsx');
      expect(progress?.filesCreated).toContain('src/components/TestComponent.tsx');
      expect(progress?.filesModified).toContain('next.config.js');
      expect(progress?.phases.implement.status).toBe('in_progress');
    });

    it('preserves error history across resume', async () => {
      await createProgressFile(testUrl, testSlug);
      await updatePhaseStatus(testSlug, 'analyze', 'completed');
      await logError(testSlug, 'extract', 'Network timeout', 'Retried successfully');
      await updatePhaseStatus(testSlug, 'extract', 'completed');
      
      // Simulate interruption and resume
      const progress = await readProgressFile(testSlug);
      
      expect(progress?.errors).toHaveLength(1);
      expect(progress?.errors[0].error).toBe('Network timeout');
      expect(progress?.errors[0].resolution).toBe('Retried successfully');
    });
  });
});
