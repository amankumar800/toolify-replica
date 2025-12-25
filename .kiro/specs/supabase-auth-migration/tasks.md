# Implementation Plan: Supabase Auth Migration

## Overview

This implementation plan migrates the authentication system from next-auth with Google OAuth to Supabase Auth with email/password authentication. Tasks are ordered to ensure incremental progress with early validation of core functionality.

## MCP Server Usage Guide

- **Supabase MCP Server**: Use for all database operations, RLS policy updates, and Supabase Auth configuration
- **Sequential Thinking MCP Server**: Use for complex problem-solving, architectural decisions, and debugging multi-step issues
- **Fetch MCP Server**: Use when referencing external documentation or fetching Supabase/Next.js API references

## Tasks

- [x] 1. Remove next-auth dependencies and files
  - [x] 1.1 Delete next-auth API route and auth config
    - Delete `src/app/api/auth/[...nextauth]/route.ts`
    - Delete `src/lib/auth.ts`
    - _Requirements: 11.1, 11.2_
  - [x] 1.2 Remove next-auth package from dependencies
    - Remove `next-auth` from package.json
    - Run `npm install` to update lock file
    - _Requirements: 1.1, 1.2_
  - [x] 1.3 Update .env.example to remove next-auth variables
    - Remove NEXTAUTH_SECRET, NEXTAUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
    - Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are documented
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 2. Implement Auth Service with Supabase Auth
  - **MCP Servers**: Supabase MCP (for auth operations), Fetch MCP (for Supabase Auth API docs), Sequential Thinking MCP (for validation logic design)
  - [x] 2.1 Implement signInWithEmail function
    - Add email format validation before Supabase call
    - Call Supabase signInWithPassword
    - Return generic error message for invalid credentials
    - **Use Fetch MCP**: Reference Supabase Auth signInWithPassword API documentation
    - **Use Supabase MCP**: Test auth operations
    - _Requirements: 3.1, 3.2, 3.4, 3.5_
  - [x] 2.2 Implement signUp function
    - Add password minimum length validation (6 chars)
    - Add email format validation
    - Call Supabase signUp
    - Handle auto-signin when email confirmation not required
    - Return requiresEmailConfirmation flag when needed
    - **Use Fetch MCP**: Reference Supabase Auth signUp API documentation
    - **Use Sequential Thinking MCP**: Design the auto-signin flow logic
    - **Use Supabase MCP**: Test user creation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 2.3 Implement signOut function
    - Call Supabase signOut
    - **Use Supabase MCP**: Test signOut operation
    - _Requirements: 5.1_
  - [x] 2.4 Implement getUser function
    - Return current user from Supabase session
    - **Use Supabase MCP**: Verify user retrieval
    - _Requirements: 3.1_
  - [x] 2.5 Write property test for email validation
    - **Property 4: Email Format Validation**
    - **Validates: Requirements 3.5**
  - [x] 2.6 Write property test for password validation
    - **Property 5: Password Strength Validation**
    - **Validates: Requirements 4.5**
  - [x] 2.7 Write property test for error message privacy
    - **Property 3: Authentication Error Privacy**
    - **Use Sequential Thinking MCP**: Analyze edge cases for error message leakage
    - **Validates: Requirements 3.4**

- [x] 3. Checkpoint - Verify auth service
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Auth Middleware
  - **MCP Servers**: Supabase MCP (for session management), Fetch MCP (for Next.js middleware docs), Sequential Thinking MCP (for complex redirect logic)
  - [x] 4.1 Update middleware to use Supabase Auth
    - Create Supabase server client in middleware
    - Call getUser() to refresh and validate session
    - Update request and response cookies
    - Clear cookies on session refresh failure
    - **Use Fetch MCP**: Reference Next.js middleware and Supabase SSR documentation
    - **Use Sequential Thinking MCP**: Design cookie refresh flow and error handling
    - **Use Supabase MCP**: Verify session refresh behavior
    - _Requirements: 2.1, 2.2, 2.4, 2.5_
  - [x] 4.2 Implement protected route redirection
    - Check if route matches /admin/* pattern
    - Redirect unauthenticated users to /login with callback URL
    - **Use Sequential Thinking MCP**: Design route matching and redirect logic
    - _Requirements: 2.3_
  - [x] 4.3 Write property test for protected route redirection
    - **Property 2: Protected Route Redirection**
    - **Validates: Requirements 2.3**

- [x] 5. Implement Auth Callback Route
  - **MCP Servers**: Supabase MCP (for code exchange), Fetch MCP (for Supabase OAuth/OTP docs), Sequential Thinking MCP (for multi-flow handling)
  - [x] 5.1 Create auth callback route handler
    - Create `src/app/auth/callback/route.ts`
    - Handle code exchange flow for OAuth/magic links
    - Handle OTP token verification for email confirmation
    - Redirect to intended destination or home on success
    - Redirect to /login with error on failure
    - **Use Fetch MCP**: Reference Supabase exchangeCodeForSession and verifyOtp API docs
    - **Use Sequential Thinking MCP**: Design dual-flow handling (code exchange vs OTP verification)
    - **Use Supabase MCP**: Test code exchange and OTP verification
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 6. Checkpoint - Verify middleware and callback
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Update Auth Provider Context
  - **MCP Servers**: Supabase MCP (for auth state listener), Fetch MCP (for React context patterns), Sequential Thinking MCP (for state management design)
  - [x] 7.1 Implement Supabase Auth state provider
    - Subscribe to onAuthStateChange on mount
    - Update context state on auth changes
    - Unsubscribe on unmount
    - Expose user, loading, and signOut in context
    - **Use Fetch MCP**: Reference Supabase onAuthStateChange API documentation
    - **Use Sequential Thinking MCP**: Design state synchronization and cleanup logic
    - **Use Supabase MCP**: Verify auth state change events
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 7.2 Write property test for auth state propagation
    - **Property 8: Auth Provider State Propagation**
    - **Use Sequential Thinking MCP**: Design test scenarios for state propagation
    - **Validates: Requirements 7.1, 7.2**

- [x] 8. Update UI Components
  - **MCP Servers**: Fetch MCP (for React/Next.js patterns), Sequential Thinking MCP (for UI state logic)
  - [x] 8.1 Update Header component
    - Use Supabase Auth state from context
    - Display loading indicator while auth state loading
    - Display user email and sign out button when authenticated
    - Display sign in button when unauthenticated
    - **Use Sequential Thinking MCP**: Design conditional rendering logic for auth states
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 8.2 Update LoginForm component
    - Use auth service signInWithEmail and signUp
    - Add client-side email and password validation
    - Display appropriate error messages
    - Handle requiresEmailConfirmation response
    - **Use Sequential Thinking MCP**: Design form validation and error handling flow
    - _Requirements: 3.3, 4.2_
  - [x] 8.3 Write property test for header auth state display
    - **Property 7: Header Auth State Display**
    - **Validates: Requirements 6.1**

- [x] 9. Checkpoint - Verify UI components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update RLS Policies
  - **MCP Servers**: Supabase MCP (required for all RLS operations), Sequential Thinking MCP (for policy logic design)
  - [x] 10.1 Update user_favorites RLS policies
    - Update SELECT policy to use auth.jwt()->>email
    - Update INSERT policy to verify email matches
    - Update UPDATE policy to verify email matches
    - Update DELETE policy to verify email matches
    - **Use Supabase MCP**: Execute RLS policy updates and verify enforcement
    - **Use Sequential Thinking MCP**: Design comprehensive RLS policy logic
    - **Use Fetch MCP**: Reference Supabase RLS documentation for auth.jwt() usage
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [x] 10.2 Write property test for RLS policy enforcement
    - **Property 9: RLS Policy Enforcement**
    - **Use Supabase MCP**: Test RLS enforcement with different user contexts
    - **Use Sequential Thinking MCP**: Design test scenarios for all CRUD operations
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [x] 11. Final verification and cleanup
  - **MCP Servers**: Sequential Thinking MCP (for systematic verification)
  - [x] 11.1 Verify no next-auth imports remain
    - Search codebase for next-auth imports
    - Remove any remaining references
    - **Use Sequential Thinking MCP**: Systematically verify all files are clean
    - _Requirements: 1.3, 11.3, 11.4_
  - [x] 11.2 Verify build succeeds
    - Run `npm run build`
    - Fix any compilation errors
    - **Use Sequential Thinking MCP**: Debug any build errors systematically
    - _Requirements: 1.1_

- [x] 12. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases

## MCP Server Reference

| MCP Server | When to Use |
|------------|-------------|
| **Supabase MCP** | Database operations, RLS policies, auth operations, user management |
| **Sequential Thinking MCP** | Complex logic design, multi-step debugging, architectural decisions |
| **Fetch MCP** | External documentation, API references, best practices lookup |
