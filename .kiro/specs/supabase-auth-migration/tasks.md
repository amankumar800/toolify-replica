# Implementation Plan: Supabase Auth Migration

## Overview

This implementation plan migrates the authentication system from next-auth with Google OAuth to Supabase Auth with email/password authentication. Tasks are ordered to ensure incremental progress with early validation of core functionality.

## Tasks

- [ ] 1. Remove next-auth dependencies and files
  - [ ] 1.1 Delete next-auth API route and auth config
    - Delete `src/app/api/auth/[...nextauth]/route.ts`
    - Delete `src/lib/auth.ts`
    - _Requirements: 11.1, 11.2_
  - [ ] 1.2 Remove next-auth package from dependencies
    - Remove `next-auth` from package.json
    - Run `npm install` to update lock file
    - _Requirements: 1.1, 1.2_
  - [ ] 1.3 Update .env.example to remove next-auth variables
    - Remove NEXTAUTH_SECRET, NEXTAUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
    - Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are documented
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 2. Implement Auth Service with Supabase Auth
  - [ ] 2.1 Implement signInWithEmail function
    - Add email format validation before Supabase call
    - Call Supabase signInWithPassword
    - Return generic error message for invalid credentials
    - _Requirements: 3.1, 3.2, 3.4, 3.5_
  - [ ] 2.2 Implement signUp function
    - Add password minimum length validation (6 chars)
    - Add email format validation
    - Call Supabase signUp
    - Handle auto-signin when email confirmation not required
    - Return requiresEmailConfirmation flag when needed
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ] 2.3 Implement signOut function
    - Call Supabase signOut
    - _Requirements: 5.1_
  - [ ] 2.4 Implement getUser function
    - Return current user from Supabase session
    - _Requirements: 3.1_
  - [ ] 2.5 Write property test for email validation
    - **Property 4: Email Format Validation**
    - **Validates: Requirements 3.5**
  - [ ] 2.6 Write property test for password validation
    - **Property 5: Password Strength Validation**
    - **Validates: Requirements 4.5**
  - [ ] 2.7 Write property test for error message privacy
    - **Property 3: Authentication Error Privacy**
    - **Validates: Requirements 3.4**

- [ ] 3. Checkpoint - Verify auth service
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Auth Middleware
  - [ ] 4.1 Update middleware to use Supabase Auth
    - Create Supabase server client in middleware
    - Call getUser() to refresh and validate session
    - Update request and response cookies
    - Clear cookies on session refresh failure
    - _Requirements: 2.1, 2.2, 2.4, 2.5_
  - [ ] 4.2 Implement protected route redirection
    - Check if route matches /admin/* pattern
    - Redirect unauthenticated users to /login with callback URL
    - _Requirements: 2.3_
  - [ ] 4.3 Write property test for protected route redirection
    - **Property 2: Protected Route Redirection**
    - **Validates: Requirements 2.3**

- [ ] 5. Implement Auth Callback Route
  - [ ] 5.1 Create auth callback route handler
    - Create `src/app/auth/callback/route.ts`
    - Handle code exchange flow for OAuth/magic links
    - Handle OTP token verification for email confirmation
    - Redirect to intended destination or home on success
    - Redirect to /login with error on failure
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 6. Checkpoint - Verify middleware and callback
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Update Auth Provider Context
  - [ ] 7.1 Implement Supabase Auth state provider
    - Subscribe to onAuthStateChange on mount
    - Update context state on auth changes
    - Unsubscribe on unmount
    - Expose user, loading, and signOut in context
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [ ] 7.2 Write property test for auth state propagation
    - **Property 8: Auth Provider State Propagation**
    - **Validates: Requirements 7.1, 7.2**

- [ ] 8. Update UI Components
  - [ ] 8.1 Update Header component
    - Use Supabase Auth state from context
    - Display loading indicator while auth state loading
    - Display user email and sign out button when authenticated
    - Display sign in button when unauthenticated
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ] 8.2 Update LoginForm component
    - Use auth service signInWithEmail and signUp
    - Add client-side email and password validation
    - Display appropriate error messages
    - Handle requiresEmailConfirmation response
    - _Requirements: 3.3, 4.2_
  - [ ] 8.3 Write property test for header auth state display
    - **Property 7: Header Auth State Display**
    - **Validates: Requirements 6.1**

- [ ] 9. Checkpoint - Verify UI components
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Update RLS Policies
  - [ ] 10.1 Update user_favorites RLS policies
    - Update SELECT policy to use auth.jwt()->>email
    - Update INSERT policy to verify email matches
    - Update UPDATE policy to verify email matches
    - Update DELETE policy to verify email matches
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [ ] 10.2 Write property test for RLS policy enforcement
    - **Property 9: RLS Policy Enforcement**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [ ] 11. Final verification and cleanup
  - [ ] 11.1 Verify no next-auth imports remain
    - Search codebase for next-auth imports
    - Remove any remaining references
    - _Requirements: 1.3, 11.3, 11.4_
  - [ ] 11.2 Verify build succeeds
    - Run `npm run build`
    - Fix any compilation errors
    - _Requirements: 1.1_

- [ ] 12. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
