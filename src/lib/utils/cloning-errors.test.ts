/**
 * Unit Tests for Error Handling Module
 * 
 * Tests error classification, CAPTCHA detection, and auto-fix logic
 * 
 * @see .kiro/specs/page-cloning-agent/design.md
 * _Requirements: 9.1, 18.2_
 */

import { describe, it, expect } from 'vitest';
import {
  ScrapingError,
  ImplementationError,
  VerificationError,
  detectCaptcha,
  isBlockingStatusCode,
  classifyError,
  getRecoveryStrategy,
  isRetryableError,
  parseTypeScriptDiagnostics,
  suggestAutoFix,
  formatErrorForLogging,
  getUserFriendlyMessage,
  isScrapingError,
  isImplementationError,
  isVerificationError,
  isCloningError,
  type DiagnosticInfo,
} from './cloning-errors';

// =============================================================================
// Error Class Tests
// =============================================================================

describe('ScrapingError', () => {
  it('should create error with correct properties', () => {
    const error = new ScrapingError(
      'Page load failed',
      'TIMEOUT',
      true,
      'https://example.com'
    );
    
    expect(error.name).toBe('ScrapingError');
    expect(error.message).toBe('Page load failed');
    expect(error.code).toBe('TIMEOUT');
    expect(error.retryable).toBe(true);
    expect(error.sourceUrl).toBe('https://example.com');
  });

  it('should return structured response', () => {
    const error = new ScrapingError('Blocked', 'BLOCKED', false, 'https://test.com');
    const response = error.toResponse();
    
    expect(response.error.name).toBe('ScrapingError');
    expect(response.error.code).toBe('BLOCKED');
    expect(response.error.retryable).toBe(false);
    expect(response.error.sourceUrl).toBe('https://test.com');
  });
});


describe('ImplementationError', () => {
  it('should create error with correct properties', () => {
    const diagnostics: DiagnosticInfo[] = [{
      file: 'test.ts',
      line: 10,
      column: 5,
      code: 'TS2304',
      message: "Cannot find name 'foo'",
      severity: 'error',
    }];
    
    const error = new ImplementationError(
      'TypeScript compilation failed',
      'TYPESCRIPT_ERROR',
      'src/test.ts',
      true,
      diagnostics
    );
    
    expect(error.name).toBe('ImplementationError');
    expect(error.code).toBe('TYPESCRIPT_ERROR');
    expect(error.filePath).toBe('src/test.ts');
    expect(error.autoFixable).toBe(true);
    expect(error.diagnostics).toHaveLength(1);
  });

  it('should return structured response', () => {
    const error = new ImplementationError('Build failed', 'BUILD_ERROR', 'src/app.ts');
    const response = error.toResponse();
    
    expect(response.error.code).toBe('BUILD_ERROR');
    expect(response.error.filePath).toBe('src/app.ts');
    expect(response.error.autoFixable).toBe(false);
  });
});

describe('VerificationError', () => {
  it('should create error with correct properties', () => {
    const error = new VerificationError(
      'Visual differences detected',
      'VISUAL_MISMATCH',
      ['Header color differs', 'Font size mismatch'],
      2
    );
    
    expect(error.name).toBe('VerificationError');
    expect(error.code).toBe('VISUAL_MISMATCH');
    expect(error.details).toHaveLength(2);
    expect(error.fixAttempts).toBe(2);
  });

  it('should return structured response', () => {
    const error = new VerificationError('Tests failed', 'TEST_FAILED', ['test1 failed']);
    const response = error.toResponse();
    
    expect(response.error.code).toBe('TEST_FAILED');
    expect(response.error.details).toContain('test1 failed');
  });
});


// =============================================================================
// CAPTCHA Detection Tests
// =============================================================================

describe('detectCaptcha', () => {
  it('should detect common CAPTCHA patterns', () => {
    const captchaSnapshots = [
      'Please complete the CAPTCHA to continue',
      'Are you a robot? Verify you are human',
      'reCAPTCHA verification required',
      'hCaptcha challenge',
      'Cloudflare security check',
      'Access denied - bot detection',
      'Please wait while we verify your browser',
      'Checking your browser before accessing',
      'DDoS protection by Cloudflare',
      'Unusual traffic detected from your network',
    ];
    
    for (const snapshot of captchaSnapshots) {
      expect(detectCaptcha(snapshot)).toBe(true);
    }
  });

  it('should not detect CAPTCHA in normal content', () => {
    const normalSnapshots = [
      'Welcome to our website',
      '<div>Hello World</div>',
      'Product listing page with items',
      'Contact us for more information',
    ];
    
    for (const snapshot of normalSnapshots) {
      expect(detectCaptcha(snapshot)).toBe(false);
    }
  });

  it('should handle empty or invalid input', () => {
    expect(detectCaptcha('')).toBe(false);
    expect(detectCaptcha(null as unknown as string)).toBe(false);
    expect(detectCaptcha(undefined as unknown as string)).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(detectCaptcha('CAPTCHA')).toBe(true);
    expect(detectCaptcha('Captcha')).toBe(true);
    expect(detectCaptcha('captcha')).toBe(true);
  });
});

describe('isBlockingStatusCode', () => {
  it('should identify blocking status codes', () => {
    expect(isBlockingStatusCode(403)).toBe(true);
    expect(isBlockingStatusCode(429)).toBe(true);
    expect(isBlockingStatusCode(503)).toBe(true);
  });

  it('should not identify normal status codes as blocking', () => {
    expect(isBlockingStatusCode(200)).toBe(false);
    expect(isBlockingStatusCode(201)).toBe(false);
    expect(isBlockingStatusCode(404)).toBe(false);
    expect(isBlockingStatusCode(500)).toBe(false);
  });
});


// =============================================================================
// Error Classification Tests
// =============================================================================

describe('classifyError', () => {
  it('should classify CAPTCHA errors', () => {
    const error = new Error('Please complete the CAPTCHA');
    const classified = classifyError(error, { url: 'https://test.com' });
    
    expect(classified).toBeInstanceOf(ScrapingError);
    expect((classified as ScrapingError).code).toBe('CAPTCHA');
  });

  it('should classify rate limit errors', () => {
    const error = new Error('HTTP 429 Too Many Requests');
    const classified = classifyError(error);
    
    expect(classified).toBeInstanceOf(ScrapingError);
    expect((classified as ScrapingError).code).toBe('RATE_LIMITED');
    expect((classified as ScrapingError).retryable).toBe(true);
  });

  it('should classify timeout errors', () => {
    const error = new Error('Request timed out after 30s');
    const classified = classifyError(error);
    
    expect(classified).toBeInstanceOf(ScrapingError);
    expect((classified as ScrapingError).code).toBe('TIMEOUT');
  });

  it('should classify 404 errors', () => {
    const error = new Error('Page not found (404)');
    const classified = classifyError(error);
    
    expect(classified).toBeInstanceOf(ScrapingError);
    expect((classified as ScrapingError).code).toBe('NOT_FOUND');
  });

  it('should classify TypeScript errors', () => {
    const error = new Error('TypeScript error TS2304: Cannot find name');
    const classified = classifyError(error, { filePath: 'src/test.ts' });
    
    expect(classified).toBeInstanceOf(ImplementationError);
    expect((classified as ImplementationError).code).toBe('TYPESCRIPT_ERROR');
  });

  it('should classify build errors', () => {
    const error = new Error('Build failed: webpack compilation error');
    const classified = classifyError(error);
    
    expect(classified).toBeInstanceOf(ImplementationError);
    expect((classified as ImplementationError).code).toBe('BUILD_ERROR');
  });

  it('should classify lint errors', () => {
    const error = new Error('ESLint: Unexpected console statement');
    const classified = classifyError(error);
    
    expect(classified).toBeInstanceOf(ImplementationError);
    expect((classified as ImplementationError).code).toBe('LINT_ERROR');
  });

  it('should classify test failures', () => {
    const error = new Error('Test failed: expected true to be false');
    const classified = classifyError(error);
    
    expect(classified).toBeInstanceOf(VerificationError);
    expect((classified as VerificationError).code).toBe('TEST_FAILED');
  });

  it('should classify verification phase errors', () => {
    const error = new Error('Visual mismatch detected');
    const classified = classifyError(error, { phase: 'verify' });
    
    expect(classified).toBeInstanceOf(VerificationError);
    expect((classified as VerificationError).code).toBe('VISUAL_MISMATCH');
  });

  it('should handle non-Error objects', () => {
    const classified = classifyError('String error message');
    expect(classified).toBeInstanceOf(ScrapingError);
  });
});


// =============================================================================
// Recovery Strategy Tests
// =============================================================================

describe('getRecoveryStrategy', () => {
  it('should return retry strategy for timeout errors', () => {
    const error = new ScrapingError('Timeout', 'TIMEOUT', true, 'https://test.com');
    const strategy = getRecoveryStrategy(error);
    
    expect(strategy.action).toBe('retry');
    expect(strategy.delay).toBe(5000);
    expect(strategy.maxAttempts).toBe(3);
  });

  it('should return pause strategy for CAPTCHA errors', () => {
    const error = new ScrapingError('CAPTCHA', 'CAPTCHA', false, 'https://test.com');
    const strategy = getRecoveryStrategy(error);
    
    expect(strategy.action).toBe('pause');
    expect(strategy.userMessage).toContain('Manual intervention');
  });

  it('should return skip strategy for not found errors', () => {
    const error = new ScrapingError('Not found', 'NOT_FOUND', false, 'https://test.com');
    const strategy = getRecoveryStrategy(error);
    
    expect(strategy.action).toBe('skip');
  });

  it('should return fix strategy for TypeScript errors', () => {
    const error = new ImplementationError('TS error', 'TYPESCRIPT_ERROR', 'test.ts', true);
    const strategy = getRecoveryStrategy(error);
    
    expect(strategy.action).toBe('fix');
  });

  it('should return abort strategy for build errors', () => {
    const error = new ImplementationError('Build failed', 'BUILD_ERROR', 'test.ts');
    const strategy = getRecoveryStrategy(error);
    
    expect(strategy.action).toBe('abort');
  });

  it('should return fix strategy for visual mismatch', () => {
    const error = new VerificationError('Mismatch', 'VISUAL_MISMATCH', ['diff1']);
    const strategy = getRecoveryStrategy(error);
    
    expect(strategy.action).toBe('fix');
    expect(strategy.maxAttempts).toBe(3);
  });

  it('should return default abort strategy for unknown errors', () => {
    const error = new Error('Unknown error');
    const strategy = getRecoveryStrategy(error);
    
    expect(strategy.action).toBe('abort');
  });
});

describe('isRetryableError', () => {
  it('should return true for retryable scraping errors', () => {
    const error = new ScrapingError('Timeout', 'TIMEOUT', true, 'https://test.com');
    expect(isRetryableError(error)).toBe(true);
  });

  it('should return false for non-retryable scraping errors', () => {
    const error = new ScrapingError('Blocked', 'BLOCKED', false, 'https://test.com');
    expect(isRetryableError(error)).toBe(false);
  });

  it('should return true for file write errors', () => {
    const error = new ImplementationError('Write failed', 'FILE_WRITE', 'test.ts');
    expect(isRetryableError(error)).toBe(true);
  });

  it('should return false for TypeScript errors', () => {
    const error = new ImplementationError('TS error', 'TYPESCRIPT_ERROR', 'test.ts');
    expect(isRetryableError(error)).toBe(false);
  });

  it('should return true for data incomplete errors', () => {
    const error = new VerificationError('Incomplete', 'DATA_INCOMPLETE');
    expect(isRetryableError(error)).toBe(true);
  });
});


// =============================================================================
// TypeScript Diagnostics Tests
// =============================================================================

describe('parseTypeScriptDiagnostics', () => {
  it('should parse standard TypeScript error format', () => {
    const output = `src/test.ts(10,5): error TS2304: Cannot find name 'foo'`;
    const diagnostics = parseTypeScriptDiagnostics(output);
    
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].file).toBe('src/test.ts');
    expect(diagnostics[0].line).toBe(10);
    expect(diagnostics[0].column).toBe(5);
    expect(diagnostics[0].code).toBe('TS2304');
    expect(diagnostics[0].severity).toBe('error');
  });

  it('should parse colon-separated format', () => {
    const output = `src/app.ts:15:10 - error TS2339: Property 'x' does not exist`;
    const diagnostics = parseTypeScriptDiagnostics(output);
    
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].file).toBe('src/app.ts');
    expect(diagnostics[0].line).toBe(15);
    expect(diagnostics[0].column).toBe(10);
  });

  it('should parse multiple diagnostics', () => {
    const output = `src/a.ts(1,1): error TS1001: Error 1
src/b.ts(2,2): warning TS2002: Warning 1`;
    const diagnostics = parseTypeScriptDiagnostics(output);
    
    expect(diagnostics).toHaveLength(2);
    expect(diagnostics[0].severity).toBe('error');
    expect(diagnostics[1].severity).toBe('warning');
  });

  it('should handle empty input', () => {
    expect(parseTypeScriptDiagnostics('')).toEqual([]);
    expect(parseTypeScriptDiagnostics(null as unknown as string)).toEqual([]);
  });
});

describe('suggestAutoFix', () => {
  it('should suggest fix for missing name error', () => {
    const diagnostic: DiagnosticInfo = {
      file: 'test.ts',
      line: 1,
      column: 1,
      code: 'TS2304',
      message: "Cannot find name 'MyComponent'",
      severity: 'error',
    };
    
    const fix = suggestAutoFix(diagnostic);
    expect(fix).not.toBeNull();
    expect(fix?.description).toContain('import');
    expect(fix?.newText).toContain('MyComponent');
  });

  it('should suggest fix for unused variable', () => {
    const diagnostic: DiagnosticInfo = {
      file: 'test.ts',
      line: 1,
      column: 1,
      code: 'TS6133',
      message: "'unusedVar' is declared but its value is never read",
      severity: 'warning',
    };
    
    const fix = suggestAutoFix(diagnostic);
    expect(fix).not.toBeNull();
    expect(fix?.newText).toBe('_unusedVar');
    expect(fix?.confidence).toBe('high');
  });

  it('should suggest fix for missing semicolon', () => {
    const diagnostic: DiagnosticInfo = {
      file: 'test.ts',
      line: 1,
      column: 1,
      code: 'TS1005',
      message: "';' expected",
      severity: 'error',
    };
    
    const fix = suggestAutoFix(diagnostic);
    expect(fix).not.toBeNull();
    expect(fix?.newText).toBe(';');
  });

  it('should suggest optional chaining for missing property', () => {
    const diagnostic: DiagnosticInfo = {
      file: 'test.ts',
      line: 1,
      column: 1,
      code: 'TS2339',
      message: "Property 'name' does not exist on type 'User | undefined'",
      severity: 'error',
    };
    
    const fix = suggestAutoFix(diagnostic);
    expect(fix).not.toBeNull();
    expect(fix?.newText).toContain('?.name');
  });

  it('should return null for unknown error patterns', () => {
    const diagnostic: DiagnosticInfo = {
      file: 'test.ts',
      line: 1,
      column: 1,
      code: 'TS9999',
      message: 'Some unknown error message',
      severity: 'error',
    };
    
    const fix = suggestAutoFix(diagnostic);
    expect(fix).toBeNull();
  });
});


// =============================================================================
// Error Formatting Tests
// =============================================================================

describe('formatErrorForLogging', () => {
  it('should format ScrapingError correctly', () => {
    const error = new ScrapingError('Timeout', 'TIMEOUT', true, 'https://test.com');
    const formatted = formatErrorForLogging(error);
    
    expect(formatted.type).toBe('scraping');
    expect(formatted.code).toBe('TIMEOUT');
    expect(formatted.retryable).toBe(true);
    expect(formatted.sourceUrl).toBe('https://test.com');
    expect(formatted.timestamp).toBeDefined();
  });

  it('should format ImplementationError correctly', () => {
    const error = new ImplementationError('TS error', 'TYPESCRIPT_ERROR', 'test.ts', true);
    const formatted = formatErrorForLogging(error);
    
    expect(formatted.type).toBe('implementation');
    expect(formatted.code).toBe('TYPESCRIPT_ERROR');
    expect(formatted.filePath).toBe('test.ts');
    expect(formatted.autoFixable).toBe(true);
  });

  it('should format VerificationError correctly', () => {
    const error = new VerificationError('Mismatch', 'VISUAL_MISMATCH', ['diff1'], 2);
    const formatted = formatErrorForLogging(error);
    
    expect(formatted.type).toBe('verification');
    expect(formatted.code).toBe('VISUAL_MISMATCH');
    expect(formatted.details).toContain('diff1');
    expect(formatted.fixAttempts).toBe(2);
  });

  it('should include additional context', () => {
    const error = new Error('Generic error');
    const formatted = formatErrorForLogging(error, { phase: 'extract', attempt: 1 });
    
    expect(formatted.phase).toBe('extract');
    expect(formatted.attempt).toBe(1);
  });
});

describe('getUserFriendlyMessage', () => {
  it('should return friendly message for CAPTCHA error', () => {
    const error = new ScrapingError('CAPTCHA', 'CAPTCHA', false, 'https://test.com');
    const message = getUserFriendlyMessage(error);
    
    expect(message).toContain('CAPTCHA');
    expect(message).toContain('Manual verification');
  });

  it('should return friendly message for timeout error', () => {
    const error = new ScrapingError('Timeout', 'TIMEOUT', true, 'https://test.com');
    const message = getUserFriendlyMessage(error);
    
    expect(message).toContain('too long to load');
  });

  it('should return friendly message for TypeScript error', () => {
    const error = new ImplementationError('TS error', 'TYPESCRIPT_ERROR', 'src/test.ts');
    const message = getUserFriendlyMessage(error);
    
    expect(message).toContain('TypeScript error');
    expect(message).toContain('src/test.ts');
  });

  it('should return friendly message for visual mismatch', () => {
    const error = new VerificationError('Mismatch', 'VISUAL_MISMATCH');
    const message = getUserFriendlyMessage(error);
    
    expect(message).toContain('looks different');
  });

  it('should return original message for unknown errors', () => {
    const error = new Error('Custom error message');
    const message = getUserFriendlyMessage(error);
    
    expect(message).toBe('Custom error message');
  });
});


// =============================================================================
// Type Guard Tests
// =============================================================================

describe('Type Guards', () => {
  describe('isScrapingError', () => {
    it('should return true for ScrapingError', () => {
      const error = new ScrapingError('Test', 'TIMEOUT', true, 'https://test.com');
      expect(isScrapingError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      expect(isScrapingError(new Error('Test'))).toBe(false);
      expect(isScrapingError(new ImplementationError('Test', 'BUILD_ERROR', 'test.ts'))).toBe(false);
      expect(isScrapingError(null)).toBe(false);
    });
  });

  describe('isImplementationError', () => {
    it('should return true for ImplementationError', () => {
      const error = new ImplementationError('Test', 'BUILD_ERROR', 'test.ts');
      expect(isImplementationError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      expect(isImplementationError(new Error('Test'))).toBe(false);
      expect(isImplementationError(new ScrapingError('Test', 'TIMEOUT', true, 'url'))).toBe(false);
    });
  });

  describe('isVerificationError', () => {
    it('should return true for VerificationError', () => {
      const error = new VerificationError('Test', 'TEST_FAILED');
      expect(isVerificationError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      expect(isVerificationError(new Error('Test'))).toBe(false);
    });
  });

  describe('isCloningError', () => {
    it('should return true for any cloning error type', () => {
      expect(isCloningError(new ScrapingError('Test', 'TIMEOUT', true, 'url'))).toBe(true);
      expect(isCloningError(new ImplementationError('Test', 'BUILD_ERROR', 'test.ts'))).toBe(true);
      expect(isCloningError(new VerificationError('Test', 'TEST_FAILED'))).toBe(true);
    });

    it('should return false for regular errors', () => {
      expect(isCloningError(new Error('Test'))).toBe(false);
      expect(isCloningError('string error')).toBe(false);
      expect(isCloningError(null)).toBe(false);
    });
  });
});
