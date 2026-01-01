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

/**
 * URL regex pattern for http:// or https:// URLs
 * Matches URLs starting with http:// or https:// followed by valid URL characters
 */
const URL_REGEX = /^https?:\/\/[^\s]+$/;

/**
 * Result of URL validation
 */
export interface UrlValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate URL format for social links
 * 
 * Accepts:
 * - Valid URLs starting with http:// or https://
 * - Empty strings (to allow clearing a social link)
 * 
 * Rejects:
 * - All other strings (invalid URLs, non-http protocols, etc.)
 * 
 * @param url - URL string to validate
 * @returns Validation result with valid flag and optional error message
 * 
 * @example
 * validateSocialUrl('https://twitter.com/example');
 * // Returns: { valid: true }
 * 
 * validateSocialUrl('');
 * // Returns: { valid: true }
 * 
 * validateSocialUrl('invalid-url');
 * // Returns: { valid: false, error: 'Please enter a valid URL (http:// or https://)' }
 */
export function validateSocialUrl(url: string): UrlValidationResult {
  // Accept empty strings (allows clearing a social link)
  if (url === '') {
    return { valid: true };
  }

  // Reject non-string inputs
  if (typeof url !== 'string') {
    return {
      valid: false,
      error: 'Please enter a valid URL (http:// or https://)'
    };
  }

  // Validate URL format (must start with http:// or https://)
  if (!URL_REGEX.test(url)) {
    return {
      valid: false,
      error: 'Please enter a valid URL (http:// or https://)'
    };
  }

  return { valid: true };
}
