/**
 * Error handling module for Page Cloning Agent
 * 
 * Provides custom error classes, CAPTCHA detection, auto-fix suggestions,
 * and recovery strategies for the page cloning workflow.
 * 
 * @module cloning-errors
 */

// =============================================================================
// Error Code Types
// =============================================================================

export type ScrapingErrorCode = 
  | 'TIMEOUT' 
  | 'BLOCKED' 
  | 'NOT_FOUND' 
  | 'PARSE_ERROR' 
  | 'CAPTCHA' 
  | 'RATE_LIMITED';

export type ImplementationErrorCode = 
  | 'FILE_WRITE' 
  | 'TYPESCRIPT_ERROR' 
  | 'LINT_ERROR' 
  | 'BUILD_ERROR' 
  | 'PATTERN_MISMATCH';

export type VerificationErrorCode = 
  | 'VISUAL_MISMATCH' 
  | 'DATA_INCOMPLETE' 
  | 'LINK_BROKEN' 
  | 'TEST_FAILED' 
  | 'CONSOLE_ERROR';

// =============================================================================
// Supporting Interfaces
// =============================================================================

export interface DiagnosticInfo {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface AutoFixSuggestion {
  description: string;
  oldText: string;
  newText: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface RecoveryStrategy {
  action: 'retry' | 'skip' | 'pause' | 'fix' | 'abort';
  delay?: number;
  maxAttempts?: number;
  autoFix?: AutoFixSuggestion;
  userMessage?: string;
}


// =============================================================================
// Custom Error Classes
// =============================================================================

/**
 * Error class for scraping/extraction failures
 * Used when page loading, content extraction, or rate limiting issues occur
 */
export class ScrapingError extends Error {
  constructor(
    message: string,
    public readonly code: ScrapingErrorCode,
    public readonly retryable: boolean,
    public readonly sourceUrl: string
  ) {
    super(message);
    this.name = 'ScrapingError';
  }

  /**
   * Returns a structured error response for logging
   */
  toResponse() {
    return {
      error: {
        name: this.name,
        code: this.code,
        message: this.message,
        retryable: this.retryable,
        sourceUrl: this.sourceUrl,
      },
    };
  }
}

/**
 * Error class for code generation/file creation failures
 * Used when file writing, TypeScript compilation, or build issues occur
 */
export class ImplementationError extends Error {
  constructor(
    message: string,
    public readonly code: ImplementationErrorCode,
    public readonly filePath: string,
    public readonly autoFixable: boolean = false,
    public readonly diagnostics: DiagnosticInfo[] = []
  ) {
    super(message);
    this.name = 'ImplementationError';
  }

  /**
   * Returns a structured error response for logging
   */
  toResponse() {
    return {
      error: {
        name: this.name,
        code: this.code,
        message: this.message,
        filePath: this.filePath,
        autoFixable: this.autoFixable,
        diagnosticCount: this.diagnostics.length,
      },
    };
  }
}

/**
 * Error class for verification phase failures
 * Used when QA checks, visual comparison, or test failures occur
 */
export class VerificationError extends Error {
  constructor(
    message: string,
    public readonly code: VerificationErrorCode,
    public readonly details: string[] = [],
    public readonly fixAttempts: number = 0
  ) {
    super(message);
    this.name = 'VerificationError';
  }

  /**
   * Returns a structured error response for logging
   */
  toResponse() {
    return {
      error: {
        name: this.name,
        code: this.code,
        message: this.message,
        details: this.details,
        fixAttempts: this.fixAttempts,
      },
    };
  }
}


// =============================================================================
// CAPTCHA Detection
// =============================================================================

/**
 * Patterns that indicate CAPTCHA or bot detection
 */
const CAPTCHA_PATTERNS = [
  'captcha',
  'recaptcha',
  'hcaptcha',
  'robot',
  'verify you are human',
  'are you a robot',
  'human verification',
  'security check',
  'access denied',
  'blocked',
  'cloudflare',
  'challenge-platform',
  'cf-browser-verification',
  'please wait while we verify',
  'checking your browser',
  'ddos protection',
  'bot detection',
  'unusual traffic',
  'automated access',
];

/**
 * Detects if a page snapshot contains CAPTCHA or bot detection elements
 * 
 * @param snapshot - The page snapshot or HTML content to analyze
 * @returns true if CAPTCHA or bot detection is detected
 */
export function detectCaptcha(snapshot: string): boolean {
  if (!snapshot || typeof snapshot !== 'string') {
    return false;
  }
  
  const lowerSnapshot = snapshot.toLowerCase();
  
  return CAPTCHA_PATTERNS.some(pattern => lowerSnapshot.includes(pattern));
}

/**
 * Detects if an HTTP status code indicates rate limiting or blocking
 * 
 * @param statusCode - The HTTP status code
 * @returns true if the status indicates blocking
 */
export function isBlockingStatusCode(statusCode: number): boolean {
  return statusCode === 403 || statusCode === 429 || statusCode === 503;
}


// =============================================================================
// Error Classification
// =============================================================================

/**
 * Classifies an unknown error into one of the custom error types
 * 
 * @param error - The error to classify
 * @param context - Optional context about where the error occurred
 * @returns A classified error instance
 */
export function classifyError(
  error: unknown,
  context?: { phase?: string; url?: string; filePath?: string }
): ScrapingError | ImplementationError | VerificationError {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();
  
  // Check for CAPTCHA/blocking
  if (detectCaptcha(message)) {
    return new ScrapingError(
      message,
      'CAPTCHA',
      false,
      context?.url || 'unknown'
    );
  }
  
  // Check for rate limiting
  if (lowerMessage.includes('429') || lowerMessage.includes('too many requests') || lowerMessage.includes('rate limit')) {
    return new ScrapingError(
      message,
      'RATE_LIMITED',
      true,
      context?.url || 'unknown'
    );
  }
  
  // Check for timeout
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return new ScrapingError(
      message,
      'TIMEOUT',
      true,
      context?.url || 'unknown'
    );
  }
  
  // Check for not found
  if (lowerMessage.includes('404') || lowerMessage.includes('not found')) {
    return new ScrapingError(
      message,
      'NOT_FOUND',
      false,
      context?.url || 'unknown'
    );
  }
  
  // Check for TypeScript errors
  if (lowerMessage.includes('typescript') || lowerMessage.includes('ts(') || lowerMessage.includes('type error')) {
    return new ImplementationError(
      message,
      'TYPESCRIPT_ERROR',
      context?.filePath || 'unknown',
      true
    );
  }
  
  // Check for build errors
  if (lowerMessage.includes('build') || lowerMessage.includes('compile') || lowerMessage.includes('webpack')) {
    return new ImplementationError(
      message,
      'BUILD_ERROR',
      context?.filePath || 'unknown',
      false
    );
  }
  
  // Check for lint errors
  if (lowerMessage.includes('lint') || lowerMessage.includes('eslint')) {
    return new ImplementationError(
      message,
      'LINT_ERROR',
      context?.filePath || 'unknown',
      true
    );
  }
  
  // Check for test failures
  if (lowerMessage.includes('test') && (lowerMessage.includes('fail') || lowerMessage.includes('error'))) {
    return new VerificationError(
      message,
      'TEST_FAILED',
      [message]
    );
  }
  
  // Check for visual/data issues based on context
  if (context?.phase === 'verify') {
    if (lowerMessage.includes('mismatch') || lowerMessage.includes('different')) {
      return new VerificationError(message, 'VISUAL_MISMATCH', [message]);
    }
    if (lowerMessage.includes('incomplete') || lowerMessage.includes('missing')) {
      return new VerificationError(message, 'DATA_INCOMPLETE', [message]);
    }
    if (lowerMessage.includes('link') || lowerMessage.includes('broken')) {
      return new VerificationError(message, 'LINK_BROKEN', [message]);
    }
  }
  
  // Default to scraping parse error
  return new ScrapingError(
    message,
    'PARSE_ERROR',
    false,
    context?.url || 'unknown'
  );
}


// =============================================================================
// Recovery Strategies
// =============================================================================

/**
 * Determines the appropriate recovery strategy for an error
 * 
 * @param error - The error to get recovery strategy for
 * @returns A recovery strategy object
 */
export function getRecoveryStrategy(error: Error): RecoveryStrategy {
  if (error instanceof ScrapingError) {
    switch (error.code) {
      case 'TIMEOUT':
        return {
          action: 'retry',
          delay: 5000,
          maxAttempts: 3,
          userMessage: 'Page load timed out. Retrying with longer timeout...',
        };
      case 'RATE_LIMITED':
        return {
          action: 'retry',
          delay: 5000, // Will use exponential backoff
          maxAttempts: 5,
          userMessage: 'Rate limited. Waiting before retry...',
        };
      case 'CAPTCHA':
      case 'BLOCKED':
        return {
          action: 'pause',
          userMessage: 'CAPTCHA or bot detection encountered. Manual intervention required.',
        };
      case 'NOT_FOUND':
        return {
          action: 'skip',
          userMessage: 'Page not found. Skipping this URL.',
        };
      case 'PARSE_ERROR':
        return {
          action: 'retry',
          delay: 2000,
          maxAttempts: 2,
          userMessage: 'Failed to parse page content. Retrying...',
        };
    }
  }
  
  if (error instanceof ImplementationError) {
    switch (error.code) {
      case 'TYPESCRIPT_ERROR':
        return {
          action: 'fix',
          userMessage: 'TypeScript error detected. Attempting auto-fix...',
        };
      case 'LINT_ERROR':
        return {
          action: 'fix',
          userMessage: 'Lint error detected. Attempting auto-fix...',
        };
      case 'BUILD_ERROR':
        return {
          action: 'abort',
          userMessage: 'Build error detected. Manual review required.',
        };
      case 'FILE_WRITE':
        return {
          action: 'retry',
          delay: 1000,
          maxAttempts: 2,
          userMessage: 'File write failed. Retrying...',
        };
      case 'PATTERN_MISMATCH':
        return {
          action: 'abort',
          userMessage: 'Code pattern mismatch. Manual review required.',
        };
    }
  }
  
  if (error instanceof VerificationError) {
    switch (error.code) {
      case 'VISUAL_MISMATCH':
        return {
          action: 'fix',
          maxAttempts: 3,
          userMessage: 'Visual differences detected. Attempting to fix...',
        };
      case 'DATA_INCOMPLETE':
        return {
          action: 'retry',
          delay: 2000,
          maxAttempts: 2,
          userMessage: 'Data incomplete. Re-extracting...',
        };
      case 'LINK_BROKEN':
        return {
          action: 'fix',
          maxAttempts: 2,
          userMessage: 'Broken links detected. Attempting to fix...',
        };
      case 'TEST_FAILED':
        return {
          action: 'fix',
          maxAttempts: 2,
          userMessage: 'Tests failed. Attempting to fix...',
        };
      case 'CONSOLE_ERROR':
        return {
          action: 'fix',
          maxAttempts: 2,
          userMessage: 'Console errors detected. Attempting to fix...',
        };
    }
  }
  
  // Default strategy
  return {
    action: 'abort',
    userMessage: 'Unknown error occurred. Manual review required.',
  };
}

/**
 * Checks if an error is retryable
 * 
 * @param error - The error to check
 * @returns true if the error can be retried
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof ScrapingError) {
    return error.retryable;
  }
  if (error instanceof ImplementationError) {
    return error.code === 'FILE_WRITE';
  }
  if (error instanceof VerificationError) {
    return error.code === 'DATA_INCOMPLETE';
  }
  return false;
}


// =============================================================================
// TypeScript Diagnostics Parsing
// =============================================================================

/**
 * Parses TypeScript diagnostic output into structured DiagnosticInfo objects
 * 
 * @param diagnosticOutput - Raw diagnostic output string
 * @returns Array of parsed diagnostic info
 */
export function parseTypeScriptDiagnostics(diagnosticOutput: string): DiagnosticInfo[] {
  if (!diagnosticOutput || typeof diagnosticOutput !== 'string') {
    return [];
  }
  
  const diagnostics: DiagnosticInfo[] = [];
  
  // Pattern: file.ts(line,col): error TS1234: message
  // Or: file.ts:line:col - error TS1234: message
  const patterns = [
    /^(.+?)\((\d+),(\d+)\):\s*(error|warning)\s+(TS\d+):\s*(.+)$/gm,
    /^(.+?):(\d+):(\d+)\s*-\s*(error|warning)\s+(TS\d+):\s*(.+)$/gm,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(diagnosticOutput)) !== null) {
      diagnostics.push({
        file: match[1].trim(),
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        severity: match[4] as 'error' | 'warning',
        code: match[5],
        message: match[6].trim(),
      });
    }
  }
  
  return diagnostics;
}

/**
 * Common TypeScript error patterns and their auto-fix suggestions
 */
const AUTO_FIX_PATTERNS: Array<{
  pattern: RegExp;
  fix: (match: RegExpMatchArray, diagnostic: DiagnosticInfo) => AutoFixSuggestion | null;
}> = [
  // Missing import
  {
    pattern: /Cannot find name '(\w+)'/,
    fix: (match) => ({
      description: `Add import for '${match[1]}'`,
      oldText: '',
      newText: `import { ${match[1]} } from './${match[1].toLowerCase()}';\n`,
      confidence: 'low',
    }),
  },
  // Unused variable
  {
    pattern: /'(\w+)' is declared but its value is never read/,
    fix: (match) => ({
      description: `Remove unused variable '${match[1]}' or prefix with underscore`,
      oldText: match[1],
      newText: `_${match[1]}`,
      confidence: 'high',
    }),
  },
  // Missing semicolon
  {
    pattern: /';' expected/,
    fix: () => ({
      description: 'Add missing semicolon',
      oldText: '',
      newText: ';',
      confidence: 'high',
    }),
  },
  // Type assertion needed
  {
    pattern: /Type '(.+)' is not assignable to type '(.+)'/,
    fix: (match) => ({
      description: `Add type assertion to convert '${match[1]}' to '${match[2]}'`,
      oldText: '',
      newText: ` as ${match[2]}`,
      confidence: 'medium',
    }),
  },
  // Property does not exist
  {
    pattern: /Property '(\w+)' does not exist on type '(.+)'/,
    fix: (match) => ({
      description: `Add '${match[1]}' property to type '${match[2]}' or use optional chaining`,
      oldText: `.${match[1]}`,
      newText: `?.${match[1]}`,
      confidence: 'medium',
    }),
  },
  // Missing return type
  {
    pattern: /Function lacks ending return statement/,
    fix: () => ({
      description: 'Add return statement or change return type to void',
      oldText: '',
      newText: 'return;',
      confidence: 'low',
    }),
  },
];

/**
 * Suggests an auto-fix for a TypeScript diagnostic
 * 
 * @param diagnostic - The diagnostic to suggest a fix for
 * @returns An auto-fix suggestion or null if no fix is available
 */
export function suggestAutoFix(diagnostic: DiagnosticInfo): AutoFixSuggestion | null {
  for (const { pattern, fix } of AUTO_FIX_PATTERNS) {
    const match = diagnostic.message.match(pattern);
    if (match) {
      return fix(match, diagnostic);
    }
  }
  return null;
}


// =============================================================================
// Error Formatting and Logging
// =============================================================================

/**
 * Formats an error for logging with consistent structure
 * 
 * @param error - The error to format
 * @param context - Optional additional context
 * @returns Formatted error object for logging
 */
export function formatErrorForLogging(
  error: Error,
  context?: Record<string, unknown>
): Record<string, unknown> {
  const base = {
    timestamp: new Date().toISOString(),
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...context,
  };
  
  if (error instanceof ScrapingError) {
    return {
      ...base,
      type: 'scraping',
      code: error.code,
      retryable: error.retryable,
      sourceUrl: error.sourceUrl,
    };
  }
  
  if (error instanceof ImplementationError) {
    return {
      ...base,
      type: 'implementation',
      code: error.code,
      filePath: error.filePath,
      autoFixable: error.autoFixable,
      diagnostics: error.diagnostics,
    };
  }
  
  if (error instanceof VerificationError) {
    return {
      ...base,
      type: 'verification',
      code: error.code,
      details: error.details,
      fixAttempts: error.fixAttempts,
    };
  }
  
  return {
    ...base,
    type: 'unknown',
  };
}

/**
 * Creates a user-friendly error message
 * 
 * @param error - The error to create a message for
 * @returns A user-friendly error message
 */
export function getUserFriendlyMessage(error: Error): string {
  if (error instanceof ScrapingError) {
    switch (error.code) {
      case 'TIMEOUT':
        return 'The page took too long to load. Please check your internet connection and try again.';
      case 'BLOCKED':
        return 'Access to the page was blocked. The website may have anti-bot protection.';
      case 'CAPTCHA':
        return 'A CAPTCHA challenge was detected. Manual verification is required.';
      case 'NOT_FOUND':
        return 'The page was not found. Please verify the URL is correct.';
      case 'RATE_LIMITED':
        return 'Too many requests. Please wait a moment before trying again.';
      case 'PARSE_ERROR':
        return 'Failed to parse the page content. The page structure may have changed.';
    }
  }
  
  if (error instanceof ImplementationError) {
    switch (error.code) {
      case 'TYPESCRIPT_ERROR':
        return `TypeScript error in ${error.filePath}. Auto-fix may be available.`;
      case 'LINT_ERROR':
        return `Lint error in ${error.filePath}. Auto-fix may be available.`;
      case 'BUILD_ERROR':
        return 'Build failed. Please check the error details and fix manually.';
      case 'FILE_WRITE':
        return `Failed to write file ${error.filePath}. Check file permissions.`;
      case 'PATTERN_MISMATCH':
        return 'The generated code does not match expected patterns. Manual review required.';
    }
  }
  
  if (error instanceof VerificationError) {
    switch (error.code) {
      case 'VISUAL_MISMATCH':
        return 'The cloned page looks different from the source. Adjustments needed.';
      case 'DATA_INCOMPLETE':
        return 'Some data was not extracted completely. Re-extraction may be needed.';
      case 'LINK_BROKEN':
        return 'Some links are broken or pointing to incorrect destinations.';
      case 'TEST_FAILED':
        return 'One or more tests failed. Please review the test output.';
      case 'CONSOLE_ERROR':
        return 'Console errors were detected on the cloned page.';
    }
  }
  
  return error.message || 'An unexpected error occurred.';
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard for ScrapingError
 */
export function isScrapingError(error: unknown): error is ScrapingError {
  return error instanceof ScrapingError;
}

/**
 * Type guard for ImplementationError
 */
export function isImplementationError(error: unknown): error is ImplementationError {
  return error instanceof ImplementationError;
}

/**
 * Type guard for VerificationError
 */
export function isVerificationError(error: unknown): error is VerificationError {
  return error instanceof VerificationError;
}

/**
 * Type guard for any cloning error
 */
export function isCloningError(
  error: unknown
): error is ScrapingError | ImplementationError | VerificationError {
  return isScrapingError(error) || isImplementationError(error) || isVerificationError(error);
}
