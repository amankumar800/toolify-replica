/**
 * Password utilities for admin authentication
 * Uses bcrypt for secure password hashing with 12 salt rounds
 * 
 * @module password
 */

import bcrypt from 'bcryptjs';

/**
 * Number of salt rounds for bcrypt hashing
 * 12 rounds provides a good balance between security and performance
 * Per bcrypt best practices, this results in ~300ms hash time
 */
const SALT_ROUNDS = 12;

/**
 * Password strength requirements
 */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
const PASSWORD_NUMBER_REGEX = /[0-9]/;

/**
 * Result of password strength validation
 */
export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Hash a password using bcrypt with 12 salt rounds
 * 
 * @param password - Plain text password to hash
 * @returns Promise resolving to bcrypt hash string
 * @throws Error if password is empty or hashing fails
 * 
 * @example
 * const hash = await hashPassword('MySecureP4ss');
 * // Returns: '$2a$12$...' (bcrypt hash)
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error('Password cannot be empty');
  }
  
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);
  
  return hash;
}

/**
 * Verify a password against a bcrypt hash
 * 
 * @param password - Plain text password to verify
 * @param hash - Bcrypt hash to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 * 
 * @example
 * const isValid = await verifyPassword('MySecureP4ss', storedHash);
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }
  
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * 
 * @param password - Password to validate
 * @returns Validation result with valid flag and optional error message
 * 
 * @example
 * const result = validatePasswordStrength('weak');
 * // Returns: { valid: false, error: 'Password must be at least 8 characters' }
 * 
 * const result = validatePasswordStrength('StrongP4ss');
 * // Returns: { valid: true }
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  if (!password) {
    return {
      valid: false,
      error: 'Password is required'
    };
  }
  
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
    };
  }
  
  if (!PASSWORD_UPPERCASE_REGEX.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least 1 uppercase letter'
    };
  }
  
  if (!PASSWORD_NUMBER_REGEX.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least 1 number'
    };
  }
  
  return { valid: true };
}
