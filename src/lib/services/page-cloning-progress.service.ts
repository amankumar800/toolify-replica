/**
 * Page Cloning Progress Service
 * 
 * Manages progress file persistence for page cloning operations.
 * Enables state recovery from interruptions and tracks phase completion.
 * 
 * Progress files are stored at: .kiro/specs/page-cloning-agent/progress/{page-slug}.json
 * 
 * @see .kiro/specs/page-cloning-agent/design.md
 * @requirements 21.1, 21.2, 21.3, 21.4, 21.5, 21.6
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  ProgressFile,
  PhaseStatus,
  PhaseType,
  ProgressStatusType,
  ExtractedData,
  ImplementationPlan,
  ErrorLog,
} from '@/lib/types/page-cloning';
import { ProgressFileSchema } from '@/lib/types/page-cloning.schemas';

// =============================================================================
// Constants
// =============================================================================

/** Base directory for progress files */
const PROGRESS_DIR = '.kiro/specs/page-cloning-agent/progress';

/** Archive directory for completed progress files */
const ARCHIVE_DIR = '.kiro/specs/page-cloning-agent/progress/archive';

// =============================================================================
// Error Handling
// =============================================================================

export type ProgressServiceErrorCode = 
  | 'NOT_FOUND' 
  | 'PARSE_ERROR' 
  | 'WRITE_ERROR' 
  | 'VALIDATION_ERROR';

/**
 * Custom error class for Progress Service
 */
export class ProgressServiceError extends Error {
  constructor(
    message: string,
    public readonly code: ProgressServiceErrorCode,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'ProgressServiceError';
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate the file path for a progress file
 */
function getProgressFilePath(pageSlug: string): string {
  return path.join(PROGRESS_DIR, `${pageSlug}.json`);
}

/**
 * Generate the archive file path for a progress file
 */
function getArchiveFilePath(pageSlug: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(ARCHIVE_DIR, `${pageSlug}-${timestamp}.json`);
}

/**
 * Ensure a directory exists, creating it if necessary
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Ignore if directory already exists
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Create initial phase status object
 */
function createInitialPhaseStatus(): PhaseStatus {
  return {
    status: 'pending',
  };
}

/**
 * Get current ISO timestamp
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Create a new progress file for a page cloning operation
 * 
 * @param sourceUrl - URL of the source page being cloned
 * @param pageSlug - Slug identifier for the page
 * @returns The created ProgressFile object
 * @throws ProgressServiceError if file creation fails
 * 
 * @requirements 21.1
 */
export async function createProgressFile(
  sourceUrl: string,
  pageSlug: string
): Promise<ProgressFile> {
  const now = getCurrentTimestamp();
  
  const progressFile: ProgressFile = {
    sourceUrl,
    pageSlug,
    startedAt: now,
    lastUpdatedAt: now,
    status: 'in_progress',
    phases: {
      analyze: createInitialPhaseStatus(),
      extract: createInitialPhaseStatus(),
      plan: createInitialPhaseStatus(),
      implement: createInitialPhaseStatus(),
      verify: createInitialPhaseStatus(),
    },
    filesCreated: [],
    filesModified: [],
    errors: [],
    verificationAttempts: 0,
  };

  // Ensure directory exists
  await ensureDirectory(PROGRESS_DIR);

  // Write the file
  const filePath = getProgressFilePath(pageSlug);
  try {
    await fs.writeFile(
      filePath,
      JSON.stringify(progressFile, null, 2),
      'utf-8'
    );
  } catch (error) {
    throw new ProgressServiceError(
      `Failed to create progress file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'WRITE_ERROR',
      true
    );
  }

  return progressFile;
}

/**
 * Read an existing progress file
 * 
 * @param pageSlug - Slug identifier for the page
 * @returns The ProgressFile object or null if not found
 * @throws ProgressServiceError if file exists but cannot be parsed
 * 
 * @requirements 21.3
 */
export async function readProgressFile(
  pageSlug: string
): Promise<ProgressFile | null> {
  const filePath = getProgressFilePath(pageSlug);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Validate against schema
    const validated = ProgressFileSchema.parse(data);
    return validated;
  } catch (error) {
    // File not found - return null
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    
    // JSON parse error
    if (error instanceof SyntaxError) {
      throw new ProgressServiceError(
        `Failed to parse progress file for '${pageSlug}': Invalid JSON`,
        'PARSE_ERROR',
        false
      );
    }
    
    // Zod validation error
    if (error instanceof Error && error.name === 'ZodError') {
      throw new ProgressServiceError(
        `Progress file validation failed for '${pageSlug}': ${error.message}`,
        'VALIDATION_ERROR',
        false
      );
    }

    throw new ProgressServiceError(
      `Failed to read progress file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PARSE_ERROR',
      false
    );
  }
}

/**
 * Update the status of a specific phase
 * 
 * @param pageSlug - Slug identifier for the page
 * @param phase - The phase to update
 * @param status - New status for the phase
 * @param error - Optional error message if phase failed
 * @returns The updated ProgressFile object
 * @throws ProgressServiceError if progress file not found or update fails
 * 
 * @requirements 21.2
 */
export async function updatePhaseStatus(
  pageSlug: string,
  phase: PhaseType,
  status: PhaseStatus['status'],
  error?: string
): Promise<ProgressFile> {
  const progressFile = await readProgressFile(pageSlug);
  
  if (!progressFile) {
    throw new ProgressServiceError(
      `Progress file not found for '${pageSlug}'`,
      'NOT_FOUND',
      false
    );
  }

  const now = getCurrentTimestamp();
  
  // Update the phase status
  const phaseStatus: PhaseStatus = {
    status,
    startedAt: progressFile.phases[phase].startedAt,
    completedAt: status === 'completed' || status === 'failed' ? now : undefined,
    error,
  };

  // If starting a phase, set startedAt
  if (status === 'in_progress' && !progressFile.phases[phase].startedAt) {
    phaseStatus.startedAt = now;
  }

  progressFile.phases[phase] = phaseStatus;
  progressFile.lastUpdatedAt = now;

  // Update overall status based on phase statuses
  progressFile.status = calculateOverallStatus(progressFile);

  // Write updated file
  const filePath = getProgressFilePath(pageSlug);
  try {
    await fs.writeFile(
      filePath,
      JSON.stringify(progressFile, null, 2),
      'utf-8'
    );
  } catch (writeError) {
    throw new ProgressServiceError(
      `Failed to update progress file: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`,
      'WRITE_ERROR',
      true
    );
  }

  return progressFile;
}

/**
 * Calculate overall status based on phase statuses
 */
function calculateOverallStatus(progressFile: ProgressFile): ProgressStatusType {
  const phases = Object.values(progressFile.phases);
  
  // If any phase failed, overall is failed
  if (phases.some(p => p.status === 'failed')) {
    return 'failed';
  }
  
  // If all phases completed, overall is completed
  if (phases.every(p => p.status === 'completed')) {
    return 'completed';
  }
  
  // Otherwise, in progress
  return 'in_progress';
}

/**
 * Archive a completed progress file
 * 
 * Moves the progress file to the archive directory with a timestamp suffix.
 * 
 * @param pageSlug - Slug identifier for the page
 * @returns The archive file path
 * @throws ProgressServiceError if progress file not found or archive fails
 * 
 * @requirements 21.6
 */
export async function archiveProgressFile(
  pageSlug: string
): Promise<string> {
  const progressFile = await readProgressFile(pageSlug);
  
  if (!progressFile) {
    throw new ProgressServiceError(
      `Progress file not found for '${pageSlug}'`,
      'NOT_FOUND',
      false
    );
  }

  // Update completion timestamp
  progressFile.completedAt = getCurrentTimestamp();
  progressFile.lastUpdatedAt = progressFile.completedAt;

  // Ensure archive directory exists
  await ensureDirectory(ARCHIVE_DIR);

  // Write to archive location
  const archivePath = getArchiveFilePath(pageSlug);
  try {
    await fs.writeFile(
      archivePath,
      JSON.stringify(progressFile, null, 2),
      'utf-8'
    );
  } catch (error) {
    throw new ProgressServiceError(
      `Failed to archive progress file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'WRITE_ERROR',
      true
    );
  }

  // Delete original file
  const originalPath = getProgressFilePath(pageSlug);
  try {
    await fs.unlink(originalPath);
  } catch (error) {
    // Log but don't fail if delete fails
    console.warn(`Warning: Could not delete original progress file: ${originalPath}`);
  }

  return archivePath;
}

// =============================================================================
// Additional Helper Functions
// =============================================================================

/**
 * Update extracted data in progress file
 * 
 * @param pageSlug - Slug identifier for the page
 * @param extractedData - The extracted data to save
 * @returns The updated ProgressFile object
 * 
 * @requirements 21.4
 */
export async function saveExtractedData(
  pageSlug: string,
  extractedData: ExtractedData
): Promise<ProgressFile> {
  const progressFile = await readProgressFile(pageSlug);
  
  if (!progressFile) {
    throw new ProgressServiceError(
      `Progress file not found for '${pageSlug}'`,
      'NOT_FOUND',
      false
    );
  }

  progressFile.extractedData = extractedData;
  progressFile.lastUpdatedAt = getCurrentTimestamp();

  const filePath = getProgressFilePath(pageSlug);
  await fs.writeFile(
    filePath,
    JSON.stringify(progressFile, null, 2),
    'utf-8'
  );

  return progressFile;
}

/**
 * Update implementation plan in progress file
 * 
 * @param pageSlug - Slug identifier for the page
 * @param implementationPlan - The implementation plan to save
 * @returns The updated ProgressFile object
 */
export async function saveImplementationPlan(
  pageSlug: string,
  implementationPlan: ImplementationPlan
): Promise<ProgressFile> {
  const progressFile = await readProgressFile(pageSlug);
  
  if (!progressFile) {
    throw new ProgressServiceError(
      `Progress file not found for '${pageSlug}'`,
      'NOT_FOUND',
      false
    );
  }

  progressFile.implementationPlan = implementationPlan;
  progressFile.lastUpdatedAt = getCurrentTimestamp();

  const filePath = getProgressFilePath(pageSlug);
  await fs.writeFile(
    filePath,
    JSON.stringify(progressFile, null, 2),
    'utf-8'
  );

  return progressFile;
}

/**
 * Add a file to the created files list
 * 
 * @param pageSlug - Slug identifier for the page
 * @param filePath - Path of the created file
 * @returns The updated ProgressFile object
 */
export async function addCreatedFile(
  pageSlug: string,
  filePath: string
): Promise<ProgressFile> {
  const progressFile = await readProgressFile(pageSlug);
  
  if (!progressFile) {
    throw new ProgressServiceError(
      `Progress file not found for '${pageSlug}'`,
      'NOT_FOUND',
      false
    );
  }

  if (!progressFile.filesCreated.includes(filePath)) {
    progressFile.filesCreated.push(filePath);
  }
  progressFile.lastUpdatedAt = getCurrentTimestamp();

  const filePathProgress = getProgressFilePath(pageSlug);
  await fs.writeFile(
    filePathProgress,
    JSON.stringify(progressFile, null, 2),
    'utf-8'
  );

  return progressFile;
}

/**
 * Add a file to the modified files list
 * 
 * @param pageSlug - Slug identifier for the page
 * @param filePath - Path of the modified file
 * @returns The updated ProgressFile object
 */
export async function addModifiedFile(
  pageSlug: string,
  filePath: string
): Promise<ProgressFile> {
  const progressFile = await readProgressFile(pageSlug);
  
  if (!progressFile) {
    throw new ProgressServiceError(
      `Progress file not found for '${pageSlug}'`,
      'NOT_FOUND',
      false
    );
  }

  if (!progressFile.filesModified.includes(filePath)) {
    progressFile.filesModified.push(filePath);
  }
  progressFile.lastUpdatedAt = getCurrentTimestamp();

  const filePathProgress = getProgressFilePath(pageSlug);
  await fs.writeFile(
    filePathProgress,
    JSON.stringify(progressFile, null, 2),
    'utf-8'
  );

  return progressFile;
}

/**
 * Log an error to the progress file
 * 
 * @param pageSlug - Slug identifier for the page
 * @param phase - Phase where error occurred
 * @param error - Error message
 * @param resolution - Optional resolution description
 * @returns The updated ProgressFile object
 */
export async function logError(
  pageSlug: string,
  phase: PhaseType,
  error: string,
  resolution?: string
): Promise<ProgressFile> {
  const progressFile = await readProgressFile(pageSlug);
  
  if (!progressFile) {
    throw new ProgressServiceError(
      `Progress file not found for '${pageSlug}'`,
      'NOT_FOUND',
      false
    );
  }

  const errorLog: ErrorLog = {
    phase,
    error,
    timestamp: getCurrentTimestamp(),
    resolution,
  };

  progressFile.errors.push(errorLog);
  progressFile.lastUpdatedAt = getCurrentTimestamp();

  const filePath = getProgressFilePath(pageSlug);
  await fs.writeFile(
    filePath,
    JSON.stringify(progressFile, null, 2),
    'utf-8'
  );

  return progressFile;
}

/**
 * Increment verification attempts counter
 * 
 * @param pageSlug - Slug identifier for the page
 * @returns The updated ProgressFile object
 */
export async function incrementVerificationAttempts(
  pageSlug: string
): Promise<ProgressFile> {
  const progressFile = await readProgressFile(pageSlug);
  
  if (!progressFile) {
    throw new ProgressServiceError(
      `Progress file not found for '${pageSlug}'`,
      'NOT_FOUND',
      false
    );
  }

  progressFile.verificationAttempts += 1;
  progressFile.lastUpdatedAt = getCurrentTimestamp();

  const filePath = getProgressFilePath(pageSlug);
  await fs.writeFile(
    filePath,
    JSON.stringify(progressFile, null, 2),
    'utf-8'
  );

  return progressFile;
}

/**
 * Get the last completed phase for resume functionality
 * 
 * @param pageSlug - Slug identifier for the page
 * @returns The last completed phase or null if none completed
 * 
 * @requirements 21.3, 21.5
 */
export async function getLastCompletedPhase(
  pageSlug: string
): Promise<PhaseType | null> {
  const progressFile = await readProgressFile(pageSlug);
  
  if (!progressFile) {
    return null;
  }

  const phaseOrder: PhaseType[] = ['analyze', 'extract', 'plan', 'implement', 'verify'];
  let lastCompleted: PhaseType | null = null;

  for (const phase of phaseOrder) {
    if (progressFile.phases[phase].status === 'completed') {
      lastCompleted = phase;
    } else {
      break;
    }
  }

  return lastCompleted;
}

/**
 * Get the next phase to execute for resume functionality
 * 
 * @param pageSlug - Slug identifier for the page
 * @returns The next phase to execute or null if all completed
 * 
 * @requirements 21.3, 21.5
 */
export async function getNextPhase(
  pageSlug: string
): Promise<PhaseType | null> {
  const progressFile = await readProgressFile(pageSlug);
  
  if (!progressFile) {
    return 'analyze'; // Start from beginning if no progress file
  }

  const phaseOrder: PhaseType[] = ['analyze', 'extract', 'plan', 'implement', 'verify'];

  for (const phase of phaseOrder) {
    if (progressFile.phases[phase].status !== 'completed') {
      return phase;
    }
  }

  return null; // All phases completed
}

/**
 * Check if a progress file exists for a page
 * 
 * @param pageSlug - Slug identifier for the page
 * @returns True if progress file exists
 */
export async function progressFileExists(pageSlug: string): Promise<boolean> {
  const filePath = getProgressFilePath(pageSlug);
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
