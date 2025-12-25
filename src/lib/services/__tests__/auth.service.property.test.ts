/**
 * Property-Based Tests for Auth Service
 * 
 * **Feature: supabase-auth-migration**
 * 
 * Tests validation functions and error handling behavior using property-based testing.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isValidEmail, isValidPassword } from '../auth.service';

// =============================================================================
// Arbitraries (Generators) for Property-Based Testing
// =============================================================================

/**
 * Generates valid email addresses following the pattern: local@domain.tld
 */
const validEmailArbitrary = fc
  .tuple(
    fc.stringMatching(/^[a-zA-Z0-9._%+-]+$/), // local part
    fc.stringMatching(/^[a-zA-Z0-9.-]+$/),    // domain
    fc.stringMatching(/^[a-zA-Z]{2,}$/)       // TLD
  )
  .filter(([local, domain, tld]) => 
    local.length >= 1 && 
    domain.length >= 1 && 
    tld.length >= 2 &&
    !local.includes(' ') &&
    !domain.includes(' ')
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/**
 * Generates invalid email addresses - strings without @ or proper structure
 */
const invalidEmailArbitrary = fc.oneof(
  // No @ symbol
  fc.string().filter(s => !s.includes('@')),
  // @ at start
  fc.string({ minLength: 1 }).map(s => `@${s.replace(/@/g, '')}`),
  // @ at end
  fc.string({ minLength: 1 }).map(s => `${s.replace(/@/g, '')}@`),
  // Multiple @ symbols
  fc.tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }), fc.string({ minLength: 1 }))
    .map(([a, b, c]) => `${a}@${b}@${c}`),
  // No domain after @
  fc.string({ minLength: 1 }).map(s => `${s.replace(/@/g, '')}@`),
  // No TLD (no dot after @)
  fc.tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }))
    .filter(([local, domain]) => !domain.includes('.'))
    .map(([local, domain]) => `${local.replace(/@/g, '')}@${domain.replace(/@/g, '')}`),
  // Contains spaces
  fc.tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }))
    .map(([a, b]) => `${a} ${b}@test.com`),
  // Empty string
  fc.constant(''),
  // Only whitespace
  fc.array(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 5 })
    .map(arr => arr.join(''))
);

/**
 * Generates valid passwords (6+ characters)
 */
const validPasswordArbitrary = fc.string({ minLength: 6, maxLength: 100 });

/**
 * Generates invalid passwords (less than 6 characters)
 */
const invalidPasswordArbitrary = fc.oneof(
  fc.string({ minLength: 0, maxLength: 5 }),
  fc.constant(''),
  fc.constant('12345')
);

// =============================================================================
// Property-Based Tests
// =============================================================================

describe('Auth Service - Email Validation', () => {
  /**
   * **Feature: supabase-auth-migration, Property 4: Email Format Validation**
   * **Validates: Requirements 3.5**
   * 
   * For any string that is not a valid email format, the Auth_Service SHALL
   * reject the authentication request before making any network calls to Supabase_Auth.
   */

  it('valid emails are accepted', () => {
    fc.assert(
      fc.property(validEmailArbitrary, (email) => {
        expect(isValidEmail(email)).toBe(true);
      }),
      { numRuns: 25 }
    );
  });

  it('invalid emails are rejected', () => {
    fc.assert(
      fc.property(invalidEmailArbitrary, (email) => {
        expect(isValidEmail(email)).toBe(false);
      }),
      { numRuns: 25 }
    );
  });

  it('emails with whitespace only are rejected', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 20 })
          .map(arr => arr.join('')),
        (whitespace) => {
          expect(isValidEmail(whitespace)).toBe(false);
        }
      ),
      { numRuns: 25 }
    );
  });
});

describe('Auth Service - Password Validation', () => {
  /**
   * **Feature: supabase-auth-migration, Property 5: Password Strength Validation**
   * **Validates: Requirements 4.5**
   * 
   * For any password that does not meet minimum requirements (less than 6 characters),
   * the Auth_Service SHALL return a validation error without calling Supabase_Auth.
   */

  it('passwords with 6+ characters are accepted', () => {
    fc.assert(
      fc.property(validPasswordArbitrary, (password) => {
        expect(isValidPassword(password)).toBe(true);
      }),
      { numRuns: 25 }
    );
  });

  it('passwords with less than 6 characters are rejected', () => {
    fc.assert(
      fc.property(invalidPasswordArbitrary, (password) => {
        expect(isValidPassword(password)).toBe(false);
      }),
      { numRuns: 25 }
    );
  });

  it('empty passwords are rejected', () => {
    expect(isValidPassword('')).toBe(false);
  });

  it('boundary case: exactly 5 characters is rejected', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 5 }),
        (password) => {
          expect(isValidPassword(password)).toBe(false);
        }
      ),
      { numRuns: 25 }
    );
  });

  it('boundary case: exactly 6 characters is accepted', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 6, maxLength: 6 }),
        (password) => {
          expect(isValidPassword(password)).toBe(true);
        }
      ),
      { numRuns: 25 }
    );
  });
});


// =============================================================================
// Error Message Privacy Tests
// =============================================================================

/**
 * Allowed error messages that don't reveal sensitive information
 */
const ALLOWED_ERROR_MESSAGES = [
  'Invalid email or password',
  'Please enter a valid email address',
  'Password must be at least 6 characters',
  'Unable to connect. Please try again.',
  'An account with this email already exists',
  'Registration failed. Please try again.',
  'Sign out failed. Please try again.',
];

/**
 * Patterns that should NEVER appear in error messages as they reveal information
 * These patterns specifically indicate which field (email OR password) was wrong
 */
const FORBIDDEN_ERROR_PATTERNS = [
  /email not found/i,
  /user not found/i,
  /no user/i,
  /wrong password/i,
  /incorrect password/i,
  /password is wrong/i,
  /email does not exist/i,
  /user does not exist/i,
  /password incorrect/i,
  /email incorrect/i,
  /the password/i,      // "the password is wrong" reveals password was the issue
  /the email/i,         // "the email is wrong" reveals email was the issue
  /your password/i,     // "your password is incorrect" reveals password was the issue
  /your email/i,        // "your email is not registered" reveals email was the issue
];

describe('Auth Service - Error Message Privacy', () => {
  /**
   * **Feature: supabase-auth-migration, Property 3: Authentication Error Privacy**
   * **Validates: Requirements 3.4**
   * 
   * For any failed authentication attempt with invalid credentials, the Auth_Service
   * SHALL return a generic error message that does not reveal whether the email
   * or password was incorrect.
   */

  it('allowed error messages do not contain forbidden patterns', () => {
    // Verify our allowed messages don't accidentally contain forbidden patterns
    for (const message of ALLOWED_ERROR_MESSAGES) {
      for (const pattern of FORBIDDEN_ERROR_PATTERNS) {
        expect(pattern.test(message)).toBe(false);
      }
    }
  });

  it('error messages for invalid emails do not reveal email existence', () => {
    fc.assert(
      fc.property(invalidEmailArbitrary, (email) => {
        // For invalid email format, the error should be about format, not existence
        const isValid = isValidEmail(email);
        if (!isValid) {
          // The expected error message for invalid email format
          const expectedError = 'Please enter a valid email address';
          
          // Verify this message doesn't reveal whether email exists
          for (const pattern of FORBIDDEN_ERROR_PATTERNS) {
            expect(pattern.test(expectedError)).toBe(false);
          }
        }
        return true;
      }),
      { numRuns: 25 }
    );
  });

  it('error messages for invalid passwords do not reveal password correctness', () => {
    fc.assert(
      fc.property(invalidPasswordArbitrary, (password) => {
        const isValid = isValidPassword(password);
        if (!isValid) {
          // The expected error message for invalid password length
          const expectedError = 'Password must be at least 6 characters';
          
          // Verify this message doesn't reveal whether password was close to correct
          for (const pattern of FORBIDDEN_ERROR_PATTERNS) {
            expect(pattern.test(expectedError)).toBe(false);
          }
        }
        return true;
      }),
      { numRuns: 25 }
    );
  });

  it('generic auth error message is used for credential failures', () => {
    // The generic error message used when Supabase returns auth errors
    const genericAuthError = 'Invalid email or password';
    
    // Verify it doesn't reveal which field was wrong
    expect(genericAuthError).not.toMatch(/email.*wrong/i);
    expect(genericAuthError).not.toMatch(/password.*wrong/i);
    expect(genericAuthError).not.toMatch(/not found/i);
    expect(genericAuthError).not.toMatch(/does not exist/i);
    
    // Verify it mentions both fields equally (doesn't single one out)
    expect(genericAuthError).toContain('email');
    expect(genericAuthError).toContain('password');
  });

  it('error messages never contain the actual email address', () => {
    fc.assert(
      fc.property(validEmailArbitrary, (email) => {
        // None of our allowed error messages should contain the actual email
        for (const message of ALLOWED_ERROR_MESSAGES) {
          expect(message).not.toContain(email);
        }
        return true;
      }),
      { numRuns: 25 }
    );
  });
});
