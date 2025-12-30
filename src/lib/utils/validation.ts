/**
 * Input validation utilities for admin authentication
 * 
 * @module validation
 */

/**
 * Standard email regex pattern
 * Matches: local-part@domain.tld
 * - Local part: one or more characters that are not whitespace or @
 * - Domain: one or more characters that are not whitespace or @
 * - TLD: one or more characters that are not whitespace or @
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Result of email validation
 */
export interface EmailValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate email format using standard email regex pattern
 * 
 * @param email - Email string to validate
 * @returns Validation result with valid flag and optional error message
 * 
 * @example
 * const result = validateEmail('admin@example.com');
 * // Returns: { valid: true }
 * 
 * const result = validateEmail('invalid-email');
 * // Returns: { valid: false, error: 'Please enter a valid email address' }
 */
export function validateEmail(email: string): EmailValidationResult {
  if (!email) {
    return {
      valid: false,
      error: 'Email is required'
    };
  }

  if (typeof email !== 'string') {
    return {
      valid: false,
      error: 'Please enter a valid email address'
    };
  }

  const trimmedEmail = email.trim();

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return {
      valid: false,
      error: 'Please enter a valid email address'
    };
  }

  return { valid: true };
}
