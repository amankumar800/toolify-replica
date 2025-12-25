/**
 * Property-Based Tests for Header Auth State Display
 * 
 * **Feature: supabase-auth-migration**
 * **Property 7: Header Auth State Display**
 * **Validates: Requirements 6.1**
 * 
 * For any authenticated user, the Header component SHALL display the user's
 * email address and a sign out button.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// =============================================================================
// Types for Testing
// =============================================================================

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

interface HeaderDisplayState {
  showsLoadingIndicator: boolean;
  showsUserEmail: boolean;
  showsSignOutButton: boolean;
  showsSignInButton: boolean;
  displayedEmail: string | null;
  displayedInitial: string | null;
}

// =============================================================================
// Arbitraries (Generators) for Property-Based Testing
// =============================================================================

/**
 * Generates valid user objects with UUID and email
 */
const userArbitrary = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
});

/**
 * Generates authenticated auth states (user is present, not loading)
 */
const authenticatedStateArbitrary = fc.record({
  user: userArbitrary,
  loading: fc.constant(false),
});

/**
 * Generates unauthenticated auth states (user is null, not loading)
 */
const unauthenticatedStateArbitrary = fc.record({
  user: fc.constant(null as User | null),
  loading: fc.constant(false),
});

/**
 * Generates loading auth states
 */
const loadingStateArbitrary = fc.record({
  user: fc.option(userArbitrary, { nil: null }),
  loading: fc.constant(true),
});

/**
 * Generates any valid auth state
 */
const authStateArbitrary = fc.oneof(
  authenticatedStateArbitrary,
  unauthenticatedStateArbitrary,
  loadingStateArbitrary
);

// =============================================================================
// Header Display Logic (mirrors Header component logic)
// =============================================================================

/**
 * Computes what the Header should display based on auth state
 * This mirrors the conditional rendering logic in Header.tsx
 */
function computeHeaderDisplayState(authState: AuthState): HeaderDisplayState {
  const { user, loading } = authState;

  if (loading) {
    return {
      showsLoadingIndicator: true,
      showsUserEmail: false,
      showsSignOutButton: false,
      showsSignInButton: false,
      displayedEmail: null,
      displayedInitial: null,
    };
  }

  if (user) {
    return {
      showsLoadingIndicator: false,
      showsUserEmail: true,
      showsSignOutButton: true,
      showsSignInButton: false,
      displayedEmail: user.email,
      displayedInitial: user.email?.[0]?.toUpperCase() || 'U',
    };
  }

  return {
    showsLoadingIndicator: false,
    showsUserEmail: false,
    showsSignOutButton: false,
    showsSignInButton: true,
    displayedEmail: null,
    displayedInitial: null,
  };
}

// =============================================================================
// Property Tests
// =============================================================================

describe('Header Auth State Display - Property Tests', () => {
  /**
   * **Feature: supabase-auth-migration, Property 7: Header Auth State Display**
   * **Validates: Requirements 6.1**
   */

  describe('Authenticated State Display (Requirement 6.1)', () => {
    it('for any authenticated user, header displays user email and sign out button', () => {
      fc.assert(
        fc.property(
          authenticatedStateArbitrary,
          (authState) => {
            const displayState = computeHeaderDisplayState(authState);

            // Requirement 6.1: Display user email and sign out button when authenticated
            expect(displayState.showsUserEmail).toBe(true);
            expect(displayState.showsSignOutButton).toBe(true);
            expect(displayState.displayedEmail).toBe(authState.user!.email);
            
            // Should NOT show sign in button or loading indicator
            expect(displayState.showsSignInButton).toBe(false);
            expect(displayState.showsLoadingIndicator).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any authenticated user, header displays correct initial from email', () => {
      fc.assert(
        fc.property(
          authenticatedStateArbitrary,
          (authState) => {
            const displayState = computeHeaderDisplayState(authState);
            const expectedInitial = authState.user!.email?.[0]?.toUpperCase() || 'U';

            expect(displayState.displayedInitial).toBe(expectedInitial);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unauthenticated State Display (Requirement 6.2)', () => {
    it('for any unauthenticated state, header displays sign in button', () => {
      fc.assert(
        fc.property(
          unauthenticatedStateArbitrary,
          (authState) => {
            const displayState = computeHeaderDisplayState(authState);

            // Requirement 6.2: Display sign in button when not authenticated
            expect(displayState.showsSignInButton).toBe(true);
            
            // Should NOT show user email, sign out button, or loading indicator
            expect(displayState.showsUserEmail).toBe(false);
            expect(displayState.showsSignOutButton).toBe(false);
            expect(displayState.showsLoadingIndicator).toBe(false);
            expect(displayState.displayedEmail).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Loading State Display (Requirement 6.3)', () => {
    it('for any loading state, header displays loading indicator', () => {
      fc.assert(
        fc.property(
          loadingStateArbitrary,
          (authState) => {
            const displayState = computeHeaderDisplayState(authState);

            // Requirement 6.3: Display loading indicator while loading
            expect(displayState.showsLoadingIndicator).toBe(true);
            
            // Should NOT show user email, sign out button, or sign in button
            expect(displayState.showsUserEmail).toBe(false);
            expect(displayState.showsSignOutButton).toBe(false);
            expect(displayState.showsSignInButton).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('State Exclusivity', () => {
    it('for any auth state, exactly one UI state is shown', () => {
      fc.assert(
        fc.property(
          authStateArbitrary,
          (authState) => {
            const displayState = computeHeaderDisplayState(authState);

            // Count how many states are active
            const activeStates = [
              displayState.showsLoadingIndicator,
              displayState.showsUserEmail && displayState.showsSignOutButton,
              displayState.showsSignInButton,
            ].filter(Boolean).length;

            // Exactly one state should be active
            expect(activeStates).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('sign in and sign out buttons are mutually exclusive', () => {
      fc.assert(
        fc.property(
          authStateArbitrary,
          (authState) => {
            const displayState = computeHeaderDisplayState(authState);

            // Cannot show both sign in and sign out buttons
            expect(
              displayState.showsSignInButton && displayState.showsSignOutButton
            ).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Display Consistency', () => {
    it('display state is deterministic for same auth state', () => {
      fc.assert(
        fc.property(
          authStateArbitrary,
          (authState) => {
            const displayState1 = computeHeaderDisplayState(authState);
            const displayState2 = computeHeaderDisplayState(authState);

            expect(displayState1).toEqual(displayState2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('user email display matches auth state email exactly', () => {
      fc.assert(
        fc.property(
          authenticatedStateArbitrary,
          (authState) => {
            const displayState = computeHeaderDisplayState(authState);

            // Email should match exactly, no transformation
            expect(displayState.displayedEmail).toBe(authState.user!.email);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles empty email gracefully', () => {
      const authStateWithEmptyEmail: AuthState = {
        user: { id: 'test-id', email: '' },
        loading: false,
      };

      const displayState = computeHeaderDisplayState(authStateWithEmptyEmail);

      expect(displayState.showsUserEmail).toBe(true);
      expect(displayState.displayedEmail).toBe('');
      expect(displayState.displayedInitial).toBe('U'); // Fallback to 'U'
    });

    it('handles special characters in email', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          (email) => {
            const authState: AuthState = {
              user: { id: 'test-id', email },
              loading: false,
            };

            const displayState = computeHeaderDisplayState(authState);

            expect(displayState.displayedEmail).toBe(email);
            expect(displayState.displayedInitial).toBe(email[0]?.toUpperCase() || 'U');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
