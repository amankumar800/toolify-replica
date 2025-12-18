/**
 * Page Cloning Agent - Main Orchestrator Service
 * 
 * Orchestrates the complete page cloning workflow through 5 phases:
 * Analyze → Extract → Plan → Implement → Verify
 * 
 * Integrates progress tracking, error handling, rate limiting,
 * and iterative refinement for verification.
 * 
 * @module page-cloning.service
 * @requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 13.1, 13.2, 13.3, 13.6, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7
 */

import type {
  PhaseType,
  PhaseResult,
  PageAnalysis,
  ExtractedData,
  ImplementationPlan,
  ProgressFile,
  ErrorLog,
  QAResult,
} from '../types/page-cloning';

import {
  createProgressFile,
  readProgressFile,
  updatePhaseStatus,
  archiveProgressFile,
  saveExtractedData,
  saveImplementationPlan,
  logError,
  incrementVerificationAttempts,
  getNextPhase,
  addCreatedFile,
  addModifiedFile,
} from './page-cloning-progress.service';

import { analyzePage, analyzePageWithLogging } from './page-cloning-analyze.service';
import { extractPageData, extractPageDataSilent } from './page-cloning-extract.service';
import { createImplementationPlan, type PlanOptions } from './page-cloning-plan.service';
import { verifyClone, MAX_VERIFICATION_ATTEMPTS, type VerificationResult } from './page-cloning-verify.service';

import { RateLimiter } from './rate-limiter.service';
import {
  ScrapingError,
  classifyError,
  getRecoveryStrategy,
  detectCaptcha,
  getUserFriendlyMessage,
  type RecoveryStrategy,
} from '../utils/cloning-errors';

// =============================================================================
// Types
// =============================================================================

/**
 * Options for cloning a page
 */
export interface ClonePageOptions {
  /** URL of the source page to clone */
  sourceUrl: string;
  /** Feature name for organizing files (e.g., "free-ai-tools") */
  featureName: string;
  /** Page slug for routing and file naming */
  pageSlug: string;
  /** Whether to create a dynamic route (e.g., [slug]) */
  isDynamicRoute?: boolean;
  /** Parent route if nested (e.g., "free-ai-tools") */
  parentRoute?: string;
  /** Whether to resume from existing progress file */
  resumeFromProgress?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
}


/**
 * Result of a page cloning operation
 */
export interface ClonePageResult {
  /** Whether the cloning was successful */
  success: boolean;
  /** Page slug identifier */
  pageSlug: string;
  /** Source URL that was cloned */
  sourceUrl: string;
  /** Results from each phase */
  phases: PhaseResult[];
  /** Files created during implementation */
  filesCreated: string[];
  /** Files modified during implementation */
  filesModified: string[];
  /** Errors encountered during cloning */
  errors: ErrorLog[];
  /** Human-readable summary of the operation */
  summary: string;
  /** The implementation plan (if plan phase completed) */
  implementationPlan?: ImplementationPlan;
  /** The extracted data (if extract phase completed) */
  extractedData?: ExtractedData;
  /** The page analysis (if analyze phase completed) */
  pageAnalysis?: PageAnalysis;
}

/**
 * Input for the analyze phase
 */
export interface AnalyzePhaseInput {
  /** Raw accessibility snapshot from Playwright */
  snapshot: string;
  /** Page title */
  title: string;
  /** Detected breakpoints from viewport testing (optional) */
  detectedBreakpoints?: string[];
}

/**
 * Input for the extract phase
 */
export interface ExtractPhaseInput {
  /** HTML content of the page */
  html: string;
}

/**
 * Input for the verify phase
 */
export interface VerifyPhaseInput {
  /** Snapshot of the source page */
  sourceSnapshot: string;
  /** Snapshot of the cloned page */
  cloneSnapshot: string;
  /** Analysis of source page (optional) */
  sourceAnalysis?: PageAnalysis;
  /** Analysis of clone page (optional) */
  cloneAnalysis?: PageAnalysis;
  /** Extracted data from source (optional) */
  sourceData?: ExtractedData;
  /** Extracted data from clone (optional) */
  cloneData?: ExtractedData;
  /** Console messages from clone page */
  consoleMessages?: Array<{ level: string; text: string }>;
  /** TypeScript diagnostics */
  diagnostics?: Array<{ file: string; message: string }>;
  /** Test results */
  testResults?: { passed: boolean; failures: string[] };
}

/**
 * Status of the orchestrator
 */
export type OrchestratorStatus = 
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'awaiting_user_input';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a slug from a URL
 */
export function generateSlugFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = decodeURIComponent(urlObj.pathname);
    
    // Remove leading/trailing slashes and get last segment
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || 'index';
    
    // Convert to slug format
    return lastSegment
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'page';
  } catch {
    return 'page';
  }
}

/**
 * Create a timestamp string
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Create a phase result object
 */
function createPhaseResult(
  phase: PhaseType,
  status: 'success' | 'failed' | 'needs_retry',
  data?: unknown,
  errors?: string[]
): PhaseResult {
  return {
    phase,
    status,
    data,
    errors,
    timestamp: getTimestamp(),
  };
}


// =============================================================================
// Page Cloning Orchestrator Class
// =============================================================================

/**
 * Orchestrates the complete page cloning workflow
 * 
 * @requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7
 */
export class PageCloningOrchestrator {
  private options: ClonePageOptions;
  private rateLimiter: RateLimiter;
  private status: OrchestratorStatus = 'idle';
  private progressFile: ProgressFile | null = null;
  private phaseResults: PhaseResult[] = [];
  private pageAnalysis: PageAnalysis | null = null;
  private extractedData: ExtractedData | null = null;
  private implementationPlan: ImplementationPlan | null = null;
  private verbose: boolean;

  constructor(options: ClonePageOptions) {
    this.options = options;
    this.rateLimiter = new RateLimiter();
    this.verbose = options.verbose ?? false;
  }

  /**
   * Get the current status of the orchestrator
   */
  getStatus(): OrchestratorStatus {
    return this.status;
  }

  /**
   * Get the progress file
   */
  getProgressFile(): ProgressFile | null {
    return this.progressFile;
  }

  /**
   * Get the page analysis result
   */
  getPageAnalysis(): PageAnalysis | null {
    return this.pageAnalysis;
  }

  /**
   * Get the extracted data
   */
  getExtractedData(): ExtractedData | null {
    return this.extractedData;
  }

  /**
   * Get the implementation plan
   */
  getImplementationPlan(): ImplementationPlan | null {
    return this.implementationPlan;
  }

  /**
   * Log a message if verbose mode is enabled
   */
  private log(message: string): void {
    if (this.verbose) {
      console.log(`[PageCloningOrchestrator] ${message}`);
    }
  }

  /**
   * Initialize the orchestrator - create or resume progress file
   * 
   * @requirements 16.1, 21.1, 21.3
   */
  async initialize(): Promise<void> {
    this.log(`Initializing for ${this.options.sourceUrl}`);
    
    if (this.options.resumeFromProgress) {
      // Try to resume from existing progress
      const existing = await readProgressFile(this.options.pageSlug);
      if (existing) {
        this.progressFile = existing;
        this.extractedData = existing.extractedData || null;
        this.implementationPlan = existing.implementationPlan || null;
        this.log(`Resumed from existing progress file`);
        return;
      }
    }

    // Create new progress file
    this.progressFile = await createProgressFile(
      this.options.sourceUrl,
      this.options.pageSlug
    );
    this.log(`Created new progress file`);
  }

  /**
   * Execute the analyze phase
   * 
   * @param input - Snapshot and title from Playwright
   * @returns Phase result with PageAnalysis
   * 
   * @requirements 11.1, 15.1, 15.5, 16.2
   */
  async executeAnalyzePhase(input: AnalyzePhaseInput): Promise<PhaseResult> {
    this.log('Starting analyze phase');
    this.status = 'running';

    try {
      // Update progress
      if (this.progressFile) {
        await updatePhaseStatus(this.options.pageSlug, 'analyze', 'in_progress');
      }

      // Check for CAPTCHA
      if (detectCaptcha(input.snapshot)) {
        throw new ScrapingError(
          'CAPTCHA or bot detection encountered',
          'CAPTCHA',
          false,
          this.options.sourceUrl
        );
      }

      // Analyze the page
      this.pageAnalysis = this.verbose
        ? analyzePageWithLogging(
            input.snapshot,
            this.options.sourceUrl,
            input.title,
            input.detectedBreakpoints
          )
        : analyzePage(
            input.snapshot,
            this.options.sourceUrl,
            input.title,
            input.detectedBreakpoints
          );

      // Update progress
      if (this.progressFile) {
        await updatePhaseStatus(this.options.pageSlug, 'analyze', 'completed');
      }

      const result = createPhaseResult('analyze', 'success', this.pageAnalysis);
      this.phaseResults.push(result);
      this.log('Analyze phase completed successfully');
      return result;

    } catch (error) {
      return this.handlePhaseError('analyze', error);
    }
  }


  /**
   * Execute the extract phase
   * 
   * @param input - HTML content from the page
   * @returns Phase result with ExtractedData
   * 
   * @requirements 11.1, 15.5, 16.2, 16.4
   */
  async executeExtractPhase(input: ExtractPhaseInput): Promise<PhaseResult> {
    this.log('Starting extract phase');
    this.status = 'running';

    try {
      // Update progress
      if (this.progressFile) {
        await updatePhaseStatus(this.options.pageSlug, 'extract', 'in_progress');
      }

      // Extract data from HTML
      this.extractedData = this.verbose
        ? extractPageData(input.html, this.options.sourceUrl)
        : extractPageDataSilent(input.html, this.options.sourceUrl);

      // Save extracted data to progress file
      if (this.progressFile) {
        await saveExtractedData(this.options.pageSlug, this.extractedData);
        await updatePhaseStatus(this.options.pageSlug, 'extract', 'completed');
      }

      const result = createPhaseResult('extract', 'success', this.extractedData);
      this.phaseResults.push(result);
      this.log(`Extract phase completed - ${this.extractedData.itemCounts.text} text blocks, ${this.extractedData.itemCounts.images} images, ${this.extractedData.itemCounts.links} links`);
      return result;

    } catch (error) {
      return this.handlePhaseError('extract', error);
    }
  }

  /**
   * Execute the plan phase
   * 
   * @returns Phase result with ImplementationPlan
   * 
   * @requirements 11.1, 15.3, 16.2
   */
  async executePlanPhase(): Promise<PhaseResult> {
    this.log('Starting plan phase');
    this.status = 'running';

    try {
      // Ensure we have required data
      if (!this.pageAnalysis) {
        throw new Error('Page analysis not available. Run analyze phase first.');
      }
      if (!this.extractedData) {
        throw new Error('Extracted data not available. Run extract phase first.');
      }

      // Update progress
      if (this.progressFile) {
        await updatePhaseStatus(this.options.pageSlug, 'plan', 'in_progress');
      }

      // Create implementation plan
      const planOptions: PlanOptions = {
        featureName: this.options.featureName,
        pageSlug: this.options.pageSlug,
        isDynamicRoute: this.options.isDynamicRoute,
        parentRoute: this.options.parentRoute,
      };

      this.implementationPlan = createImplementationPlan(
        this.pageAnalysis,
        this.extractedData,
        planOptions
      );

      // Save implementation plan to progress file
      if (this.progressFile) {
        await saveImplementationPlan(this.options.pageSlug, this.implementationPlan);
        await updatePhaseStatus(this.options.pageSlug, 'plan', 'completed');
      }

      const result = createPhaseResult('plan', 'success', this.implementationPlan);
      this.phaseResults.push(result);
      this.log(`Plan phase completed - ${this.implementationPlan.components.length} components, ${this.implementationPlan.dataFiles.length} data files`);
      return result;

    } catch (error) {
      return this.handlePhaseError('plan', error);
    }
  }

  /**
   * Execute the implement phase
   * 
   * This phase returns the implementation plan for the agent to execute.
   * The agent is responsible for actually creating the files.
   * 
   * @returns Phase result with implementation instructions
   * 
   * @requirements 11.1, 16.2, 16.5
   */
  async executeImplementPhase(): Promise<PhaseResult> {
    this.log('Starting implement phase');
    this.status = 'running';

    try {
      // Ensure we have the implementation plan
      if (!this.implementationPlan) {
        throw new Error('Implementation plan not available. Run plan phase first.');
      }

      // Update progress
      if (this.progressFile) {
        await updatePhaseStatus(this.options.pageSlug, 'implement', 'in_progress');
      }

      // The implement phase returns the plan - actual file creation is done by the agent
      // This allows the agent to use fsWrite, strReplace, etc.
      const implementationInstructions = {
        plan: this.implementationPlan,
        extractedData: this.extractedData,
        pageAnalysis: this.pageAnalysis,
        instructions: [
          'Create TypeScript interfaces from typeDefinitions',
          'Create data files from dataFiles with extracted data',
          'Create service functions from serviceUpdates',
          'Create components from components list',
          'Create page, loading, and error components',
          'Update next.config.js for remote images if needed',
          'Run getDiagnostics after each file to check for errors',
        ],
      };

      // Note: The agent will call markImplementPhaseComplete() when done
      const result = createPhaseResult('implement', 'success', implementationInstructions);
      this.phaseResults.push(result);
      this.log('Implement phase prepared - awaiting agent execution');
      return result;

    } catch (error) {
      return this.handlePhaseError('implement', error);
    }
  }


  /**
   * Mark the implement phase as complete
   * 
   * Called by the agent after all files have been created
   * 
   * @param filesCreated - List of files created
   * @param filesModified - List of files modified
   */
  async markImplementPhaseComplete(
    filesCreated: string[],
    filesModified: string[]
  ): Promise<void> {
    if (this.progressFile) {
      // Add files to progress
      for (const file of filesCreated) {
        await addCreatedFile(this.options.pageSlug, file);
        // Update in-memory progress file
        if (!this.progressFile.filesCreated.includes(file)) {
          this.progressFile.filesCreated.push(file);
        }
      }
      for (const file of filesModified) {
        await addModifiedFile(this.options.pageSlug, file);
        // Update in-memory progress file
        if (!this.progressFile.filesModified.includes(file)) {
          this.progressFile.filesModified.push(file);
        }
      }
      await updatePhaseStatus(this.options.pageSlug, 'implement', 'completed');
      this.progressFile.phases.implement.status = 'completed';
    }
    this.log(`Implement phase completed - ${filesCreated.length} files created, ${filesModified.length} files modified`);
  }

  /**
   * Execute the verify phase
   * 
   * @param input - Snapshots and data for comparison
   * @returns Phase result with verification status
   * 
   * @requirements 11.1, 15.6, 16.2, 16.6, 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7
   */
  async executeVerifyPhase(input: VerifyPhaseInput): Promise<PhaseResult> {
    this.log('Starting verify phase');
    this.status = 'running';

    try {
      // Update progress
      if (this.progressFile) {
        await updatePhaseStatus(this.options.pageSlug, 'verify', 'in_progress');
        await incrementVerificationAttempts(this.options.pageSlug);
      }

      // Get current attempt number
      const attemptNumber = this.progressFile?.verificationAttempts ?? 1;

      // Run verification
      const verificationResult = verifyClone(
        input.sourceSnapshot,
        input.cloneSnapshot,
        input.sourceAnalysis || this.pageAnalysis || undefined,
        input.cloneAnalysis,
        input.sourceData || this.extractedData || undefined,
        input.cloneData,
        attemptNumber,
        {
          consoleMessages: input.consoleMessages,
          diagnostics: input.diagnostics,
          testResults: input.testResults,
        }
      );

      if (verificationResult.passed) {
        // Verification passed
        if (this.progressFile) {
          await updatePhaseStatus(this.options.pageSlug, 'verify', 'completed');
        }
        
        const result = createPhaseResult('verify', 'success', verificationResult);
        this.phaseResults.push(result);
        this.log('Verify phase completed - all checks passed');
        return result;
      }

      // Verification failed
      if (verificationResult.canRetry) {
        // Can retry - return needs_retry status
        const result = createPhaseResult(
          'verify',
          'needs_retry',
          verificationResult,
          verificationResult.fixSuggestions
        );
        this.phaseResults.push(result);
        this.log(`Verify phase needs retry - attempt ${attemptNumber}/${MAX_VERIFICATION_ATTEMPTS}`);
        return result;
      }

      // Max attempts reached - need user intervention
      this.status = 'awaiting_user_input';
      if (this.progressFile) {
        await updatePhaseStatus(
          this.options.pageSlug,
          'verify',
          'failed',
          'Max verification attempts reached. User intervention required.'
        );
      }

      const result = createPhaseResult(
        'verify',
        'failed',
        verificationResult,
        ['Max verification attempts reached', ...verificationResult.fixSuggestions]
      );
      this.phaseResults.push(result);
      this.log('Verify phase failed - max attempts reached');
      return result;

    } catch (error) {
      return this.handlePhaseError('verify', error);
    }
  }

  /**
   * Handle an error during a phase
   * 
   * @param phase - The phase where the error occurred
   * @param error - The error that occurred
   * @returns Phase result with error information
   * 
   * @requirements 11.6, 13.7
   */
  private async handlePhaseError(phase: PhaseType, error: unknown): Promise<PhaseResult> {
    const classifiedError = classifyError(error, {
      phase,
      url: this.options.sourceUrl,
    });

    const recovery = getRecoveryStrategy(classifiedError);
    const errorMessage = getUserFriendlyMessage(classifiedError);

    // Log error to progress file
    if (this.progressFile) {
      await logError(
        this.options.pageSlug,
        phase,
        errorMessage,
        recovery.userMessage
      );
      await updatePhaseStatus(this.options.pageSlug, phase, 'failed', errorMessage);
    }

    // Update status based on recovery action
    if (recovery.action === 'pause') {
      this.status = 'awaiting_user_input';
    } else if (recovery.action === 'abort') {
      this.status = 'failed';
    }

    const result = createPhaseResult(
      phase,
      recovery.action === 'retry' ? 'needs_retry' : 'failed',
      { error: classifiedError.toResponse?.() || { message: errorMessage }, recovery },
      [errorMessage]
    );
    this.phaseResults.push(result);

    this.log(`Phase ${phase} error: ${errorMessage}`);
    return result;
  }


  /**
   * Get the next phase to execute
   * 
   * @returns The next phase or null if all complete
   * 
   * @requirements 21.3, 21.5
   */
  async getNextPhase(): Promise<PhaseType | null> {
    return getNextPhase(this.options.pageSlug);
  }

  /**
   * Complete the cloning operation
   * 
   * Archives the progress file and returns the final result
   * 
   * @returns The complete clone result
   * 
   * @requirements 11.7, 16.5, 21.6
   */
  async complete(): Promise<ClonePageResult> {
    this.log('Completing cloning operation');

    // Determine success based on phase results
    const allPhasesSucceeded = this.phaseResults.every(
      r => r.status === 'success'
    );

    // Archive progress file if successful
    if (allPhasesSucceeded && this.progressFile) {
      try {
        await archiveProgressFile(this.options.pageSlug);
        this.log('Progress file archived');
      } catch (error) {
        this.log(`Warning: Failed to archive progress file: ${error}`);
      }
    }

    this.status = allPhasesSucceeded ? 'completed' : 'failed';

    // Create summary
    const summary = this.createSummary(allPhasesSucceeded);

    return {
      success: allPhasesSucceeded,
      pageSlug: this.options.pageSlug,
      sourceUrl: this.options.sourceUrl,
      phases: this.phaseResults,
      filesCreated: this.progressFile?.filesCreated || [],
      filesModified: this.progressFile?.filesModified || [],
      errors: this.progressFile?.errors || [],
      summary,
      implementationPlan: this.implementationPlan || undefined,
      extractedData: this.extractedData || undefined,
      pageAnalysis: this.pageAnalysis || undefined,
    };
  }

  /**
   * Create a human-readable summary of the operation
   */
  private createSummary(success: boolean): string {
    const lines: string[] = [];

    if (success) {
      lines.push('=== Page Cloning Complete ===');
      lines.push(`Source: ${this.options.sourceUrl}`);
      lines.push(`Feature: ${this.options.featureName}`);
      lines.push(`Page Slug: ${this.options.pageSlug}`);
      lines.push('');
      lines.push('Phases completed:');
      for (const phase of this.phaseResults) {
        lines.push(`  ✓ ${phase.phase}`);
      }
    } else {
      lines.push('=== Page Cloning Failed ===');
      lines.push(`Source: ${this.options.sourceUrl}`);
      lines.push('');
      lines.push('Phase results:');
      for (const phase of this.phaseResults) {
        const icon = phase.status === 'success' ? '✓' : phase.status === 'needs_retry' ? '↻' : '✗';
        lines.push(`  ${icon} ${phase.phase}: ${phase.status}`);
        if (phase.errors?.length) {
          for (const error of phase.errors) {
            lines.push(`      - ${error}`);
          }
        }
      }
    }

    if (this.progressFile?.filesCreated.length) {
      lines.push('');
      lines.push(`Files created: ${this.progressFile.filesCreated.length}`);
      for (const file of this.progressFile.filesCreated.slice(0, 10)) {
        lines.push(`  - ${file}`);
      }
      if (this.progressFile.filesCreated.length > 10) {
        lines.push(`  ... and ${this.progressFile.filesCreated.length - 10} more`);
      }
    }

    if (this.progressFile?.filesModified.length) {
      lines.push('');
      lines.push(`Files modified: ${this.progressFile.filesModified.length}`);
      for (const file of this.progressFile.filesModified) {
        lines.push(`  - ${file}`);
      }
    }

    lines.push('=============================');
    return lines.join('\n');
  }

  /**
   * Get the rate limiter instance
   */
  getRateLimiter(): RateLimiter {
    return this.rateLimiter;
  }
}


// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Create a new page cloning orchestrator
 * 
 * @param options - Cloning options
 * @returns Initialized orchestrator
 * 
 * @example
 * const orchestrator = await createOrchestrator({
 *   sourceUrl: 'https://example.com/page',
 *   featureName: 'example-feature',
 *   pageSlug: 'page',
 * });
 * 
 * // Execute phases
 * await orchestrator.executeAnalyzePhase({ snapshot, title });
 * await orchestrator.executeExtractPhase({ html });
 * await orchestrator.executePlanPhase();
 * // ... agent creates files ...
 * await orchestrator.markImplementPhaseComplete(filesCreated, filesModified);
 * await orchestrator.executeVerifyPhase({ sourceSnapshot, cloneSnapshot });
 * 
 * // Complete
 * const result = await orchestrator.complete();
 */
export async function createOrchestrator(
  options: ClonePageOptions
): Promise<PageCloningOrchestrator> {
  const orchestrator = new PageCloningOrchestrator(options);
  await orchestrator.initialize();
  return orchestrator;
}

/**
 * Clone a page with full automation
 * 
 * This is a high-level function that orchestrates the entire cloning process.
 * It requires callbacks for browser automation since those are handled by MCP.
 * 
 * @param options - Cloning options
 * @param callbacks - Callbacks for browser automation
 * @returns Clone result
 * 
 * @requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7
 */
export async function clonePage(
  options: ClonePageOptions,
  callbacks: {
    /** Navigate to URL and return snapshot */
    navigateAndSnapshot: (url: string) => Promise<{ snapshot: string; title: string; html: string }>;
    /** Create files from implementation plan */
    implementFiles: (plan: ImplementationPlan, data: ExtractedData) => Promise<{ filesCreated: string[]; filesModified: string[] }>;
    /** Get clone page snapshot for verification */
    getCloneSnapshot: (route: string) => Promise<{ snapshot: string; html: string }>;
    /** Run tests and get results */
    runTests?: () => Promise<{ passed: boolean; failures: string[] }>;
    /** Get TypeScript diagnostics */
    getDiagnostics?: () => Promise<Array<{ file: string; message: string }>>;
  }
): Promise<ClonePageResult> {
  const orchestrator = await createOrchestrator(options);
  const rateLimiter = orchestrator.getRateLimiter();

  try {
    // Phase 1: Analyze
    await rateLimiter.waitBetweenRequests();
    const sourceData = await callbacks.navigateAndSnapshot(options.sourceUrl);
    
    const analyzeResult = await orchestrator.executeAnalyzePhase({
      snapshot: sourceData.snapshot,
      title: sourceData.title,
    });
    
    if (analyzeResult.status === 'failed') {
      return orchestrator.complete();
    }

    // Phase 2: Extract
    const extractResult = await orchestrator.executeExtractPhase({
      html: sourceData.html,
    });
    
    if (extractResult.status === 'failed') {
      return orchestrator.complete();
    }

    // Phase 3: Plan
    const planResult = await orchestrator.executePlanPhase();
    
    if (planResult.status === 'failed') {
      return orchestrator.complete();
    }

    // Phase 4: Implement
    const implementResult = await orchestrator.executeImplementPhase();
    
    if (implementResult.status === 'failed') {
      return orchestrator.complete();
    }

    const plan = orchestrator.getImplementationPlan()!;
    const extractedData = orchestrator.getExtractedData()!;
    
    const { filesCreated, filesModified } = await callbacks.implementFiles(plan, extractedData);
    await orchestrator.markImplementPhaseComplete(filesCreated, filesModified);

    // Phase 5: Verify (with retry loop)
    let verifyAttempt = 0;
    let verifyResult: PhaseResult;

    do {
      await rateLimiter.waitBetweenRequests();
      const cloneData = await callbacks.getCloneSnapshot(plan.pageRoute);
      
      const diagnostics = callbacks.getDiagnostics 
        ? await callbacks.getDiagnostics() 
        : [];
      
      const testResults = callbacks.runTests 
        ? await callbacks.runTests() 
        : { passed: true, failures: [] };

      verifyResult = await orchestrator.executeVerifyPhase({
        sourceSnapshot: sourceData.snapshot,
        cloneSnapshot: cloneData.snapshot,
        sourceData: extractedData,
        diagnostics,
        testResults,
      });

      verifyAttempt++;
    } while (
      verifyResult.status === 'needs_retry' && 
      verifyAttempt < MAX_VERIFICATION_ATTEMPTS
    );

    return orchestrator.complete();

  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[clonePage] Unexpected error: ${errorMessage}`);
    return orchestrator.complete();
  }
}


// =============================================================================
// Step-by-Step Execution Functions
// =============================================================================

/**
 * Execute a single phase of the cloning workflow
 * 
 * This function is useful for step-by-step execution where the agent
 * controls the flow and provides inputs for each phase.
 * 
 * @param pageSlug - Page slug identifier
 * @param phase - Phase to execute
 * @param input - Phase-specific input
 * @param options - Additional options
 * @returns Phase result
 * 
 * @requirements 11.5, 16.2
 */
export async function executePhase(
  pageSlug: string,
  phase: PhaseType,
  input: AnalyzePhaseInput | ExtractPhaseInput | VerifyPhaseInput | null,
  options: {
    sourceUrl: string;
    featureName: string;
    isDynamicRoute?: boolean;
    parentRoute?: string;
    verbose?: boolean;
  }
): Promise<PhaseResult> {
  // Read existing progress or create new
  let progressFile = await readProgressFile(pageSlug);
  
  if (!progressFile) {
    progressFile = await createProgressFile(options.sourceUrl, pageSlug);
  }

  const orchestrator = new PageCloningOrchestrator({
    sourceUrl: options.sourceUrl,
    featureName: options.featureName,
    pageSlug,
    isDynamicRoute: options.isDynamicRoute,
    parentRoute: options.parentRoute,
    verbose: options.verbose,
    resumeFromProgress: true,
  });
  
  await orchestrator.initialize();

  switch (phase) {
    case 'analyze':
      if (!input || !('snapshot' in input)) {
        throw new Error('Analyze phase requires snapshot input');
      }
      return orchestrator.executeAnalyzePhase(input as AnalyzePhaseInput);

    case 'extract':
      if (!input || !('html' in input)) {
        throw new Error('Extract phase requires html input');
      }
      return orchestrator.executeExtractPhase(input as ExtractPhaseInput);

    case 'plan':
      return orchestrator.executePlanPhase();

    case 'implement':
      return orchestrator.executeImplementPhase();

    case 'verify':
      if (!input || !('sourceSnapshot' in input)) {
        throw new Error('Verify phase requires snapshot inputs');
      }
      return orchestrator.executeVerifyPhase(input as VerifyPhaseInput);

    default:
      throw new Error(`Unknown phase: ${phase}`);
  }
}

/**
 * Get the current status of a cloning operation
 * 
 * @param pageSlug - Page slug identifier
 * @returns Progress file or null if not found
 */
export async function getCloneStatus(pageSlug: string): Promise<ProgressFile | null> {
  return readProgressFile(pageSlug);
}

/**
 * Resume a cloning operation from where it left off
 * 
 * @param pageSlug - Page slug identifier
 * @returns The next phase to execute and any saved data
 * 
 * @requirements 21.3, 21.5
 */
export async function resumeClone(pageSlug: string): Promise<{
  nextPhase: PhaseType | null;
  progressFile: ProgressFile | null;
  extractedData: ExtractedData | null;
  implementationPlan: ImplementationPlan | null;
}> {
  const progressFile = await readProgressFile(pageSlug);
  
  if (!progressFile) {
    return {
      nextPhase: 'analyze',
      progressFile: null,
      extractedData: null,
      implementationPlan: null,
    };
  }

  const nextPhase = await getNextPhase(pageSlug);

  return {
    nextPhase,
    progressFile,
    extractedData: progressFile.extractedData || null,
    implementationPlan: progressFile.implementationPlan || null,
  };
}

// =============================================================================
// Exports
// =============================================================================

export {
  // Re-export types from other modules for convenience
  type PageAnalysis,
  type ExtractedData,
  type ImplementationPlan,
  type ProgressFile,
  type PhaseResult,
  type QAResult,
  type VerificationResult,
  type RecoveryStrategy,
  
  // Re-export constants
  MAX_VERIFICATION_ATTEMPTS,
};
