import { createClient } from '@/lib/supabase/client';

export interface User {
  id: string;
  email: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
  requiresEmailConfirmation?: boolean;
}

/**
 * Validates email format using a standard regex pattern.
 * Exported for testing purposes.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates password meets minimum requirements (6+ characters).
 * Exported for testing purposes.
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }
  return password.length >= 6;
}

/**
 * Sign in with email and password using Supabase Auth.
 * Validates email format before making network call.
 * Returns generic error message for invalid credentials to prevent information leakage.
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns AuthResult with success status and user data or error message
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  // Validate email format before Supabase call (Requirement 3.5)
  if (!isValidEmail(email)) {
    return {
      success: false,
      error: 'Please enter a valid email address',
    };
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      // Return generic error message to prevent information leakage (Requirement 3.4)
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || email,
      },
    };
  } catch {
    return {
      success: false,
      error: 'Unable to connect. Please try again.',
    };
  }
}


/**
 * Sign up with email and password using Supabase Auth.
 * Validates email format and password length before making network call.
 * Handles auto-signin when email confirmation is not required.
 * 
 * @param email - User's email address
 * @param password - User's password (minimum 6 characters)
 * @returns AuthResult with success status, user data, or requiresEmailConfirmation flag
 */
export async function signUp(
  email: string,
  password: string
): Promise<AuthResult> {
  // Validate email format before Supabase call
  if (!isValidEmail(email)) {
    return {
      success: false,
      error: 'Please enter a valid email address',
    };
  }

  // Validate password minimum length (Requirement 4.5)
  if (!isValidPassword(password)) {
    return {
      success: false,
      error: 'Password must be at least 6 characters',
    };
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      // Check for "email already registered" error (Requirement 4.4)
      if (
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already exists')
      ) {
        return {
          success: false,
          error: 'An account with this email already exists',
        };
      }
      return {
        success: false,
        error: error.message || 'Registration failed. Please try again.',
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Registration failed. Please try again.',
      };
    }

    // Check if email confirmation is required (Requirement 4.2, 4.3)
    // If session exists, user is auto-signed in (email confirmation disabled)
    // If session is null, email confirmation is required
    if (data.session) {
      // Auto-signed in (Requirement 4.3)
      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || email,
        },
      };
    } else {
      // Email confirmation required (Requirement 4.2)
      return {
        success: true,
        requiresEmailConfirmation: true,
      };
    }
  } catch {
    return {
      success: false,
      error: 'Unable to connect. Please try again.',
    };
  }
}


/**
 * Sign out the current user using Supabase Auth.
 * Clears the session and auth cookies.
 * 
 * @returns AuthResult with success status or error message
 */
export async function signOut(): Promise<AuthResult> {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message || 'Sign out failed. Please try again.',
      };
    }

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      error: 'Unable to connect. Please try again.',
    };
  }
}


/**
 * Get the current authenticated user from Supabase session.
 * 
 * @returns User object if authenticated, null otherwise
 */
export async function getUser(): Promise<User | null> {
  const supabase = createClient();

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
    };
  } catch {
    return null;
  }
}
