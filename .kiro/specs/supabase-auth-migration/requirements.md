# Requirements Document

## Introduction

This document specifies the requirements for migrating the authentication system from next-auth with Google OAuth to Supabase Auth with email/password authentication. The migration resolves a critical security conflict where RLS policies expect Supabase Auth JWTs but the application uses next-auth tokens.

## Glossary

- **Supabase_Auth**: Supabase's built-in authentication service that issues JWTs compatible with RLS policies
- **Auth_Service**: Application service layer that wraps Supabase_Auth operations
- **Auth_Provider**: React context provider that exposes authentication state to components
- **RLS_Policy**: Row Level Security policy - PostgreSQL feature that restricts data access based on user identity
- **JWT**: JSON Web Token used for authentication
- **SSR**: Server-Side Rendering - rendering pages on the server before sending to client
- **Middleware**: Next.js middleware that runs before requests are completed
- **Session**: User authentication state maintained across requests via cookies
- **Callback_Route**: Server route that handles OAuth and email verification redirects
- **Header**: Application header component displaying navigation and auth status
- **Build_System**: Next.js build and compilation process
- **System**: The overall application being developed

## Requirements

### Requirement 1: Remove next-auth Dependencies

**User Story:** As a developer, I want to remove all next-auth code and dependencies, so that the codebase has a single, consistent authentication system.

#### Acceptance Criteria

1. THE Build_System SHALL successfully compile after removing the next-auth package from package.json
2. WHEN the application starts, THE System SHALL not reference any next-auth modules
3. THE Codebase SHALL not contain any imports from "next-auth" or "next-auth/react" or "next-auth/jwt"

### Requirement 2: Implement Supabase Auth Middleware

**User Story:** As a user, I want my authentication session to be automatically refreshed, so that I don't get unexpectedly logged out.

#### Acceptance Criteria

1. WHEN a request is made to any route, THE Middleware SHALL refresh the Supabase_Auth session using cookies
2. WHEN the session is refreshed, THE Middleware SHALL update both request and response cookies
3. WHEN a user accesses /admin routes without authentication, THE Middleware SHALL redirect to /login
4. THE Middleware SHALL use Supabase_Auth getUser() to validate sessions securely
5. IF session refresh fails due to expired tokens, THEN THE Middleware SHALL clear invalid cookies

### Requirement 3: Implement Email/Password Authentication

**User Story:** As a user, I want to sign in with my email and password, so that I can access protected features.

#### Acceptance Criteria

1. WHEN a user submits valid email and password, THE Auth_Service SHALL authenticate via Supabase_Auth signInWithPassword
2. WHEN authentication succeeds, THE System SHALL store the session in cookies
3. WHEN authentication fails, THE System SHALL display a user-friendly error message
4. IF invalid credentials are provided, THEN THE Auth_Service SHALL return an error without exposing whether email or password was incorrect
5. IF email format is invalid, THEN THE Auth_Service SHALL reject the request before calling Supabase_Auth

### Requirement 4: Implement User Registration

**User Story:** As a new user, I want to create an account with email and password, so that I can use the application.

#### Acceptance Criteria

1. WHEN a user submits registration details, THE Auth_Service SHALL create an account via Supabase_Auth signUp
2. WHEN registration succeeds and email confirmation is required, THE System SHALL inform the user to check their email
3. WHEN registration succeeds and email confirmation is not required, THE System SHALL automatically sign in the user
4. IF the email is already registered, THEN THE Auth_Service SHALL return an appropriate error
5. IF the password does not meet minimum requirements, THEN THE Auth_Service SHALL return a validation error

### Requirement 5: Implement Sign Out

**User Story:** As a user, I want to sign out of my account, so that my session is securely terminated.

#### Acceptance Criteria

1. WHEN a user clicks sign out, THE Auth_Service SHALL call Supabase_Auth signOut
2. WHEN sign out completes successfully, THE System SHALL clear all auth cookies
3. WHEN sign out completes successfully, THE System SHALL redirect to the home page
4. IF sign out fails, THEN THE System SHALL display an error message and maintain current state

### Requirement 6: Update Header Authentication UI

**User Story:** As a user, I want to see my authentication status in the header, so that I know if I'm logged in.

#### Acceptance Criteria

1. WHEN a user is authenticated, THE Header SHALL display the user email and a sign out button
2. WHEN a user is not authenticated, THE Header SHALL display a sign in button
3. WHILE the authentication state is loading, THE Header SHALL display a loading indicator
4. THE Header SHALL use Supabase_Auth client to check authentication state

### Requirement 7: Update Auth Provider Context

**User Story:** As a developer, I want a centralized auth context, so that components can access authentication state consistently.

#### Acceptance Criteria

1. THE Auth_Provider SHALL provide Supabase_Auth state to child components via React context
2. WHEN auth state changes, THE Auth_Provider SHALL notify subscribed components immediately
3. THE Auth_Provider SHALL subscribe to auth state changes via Supabase_Auth onAuthStateChange listener
4. WHEN the Auth_Provider unmounts, THE Auth_Provider SHALL unsubscribe from auth state changes

### Requirement 8: Ensure RLS Policy Compatibility

**User Story:** As a user, I want my data to be protected by RLS policies, so that only I can access my favorites.

#### Acceptance Criteria

1. WHEN a user queries user_favorites, THE RLS_Policy SHALL only return rows where auth.jwt() email matches user_email
2. WHEN a user inserts into user_favorites, THE RLS_Policy SHALL verify auth.jwt() email matches the inserted user_email
3. WHEN a user updates user_favorites, THE RLS_Policy SHALL verify auth.jwt() email matches the row user_email
4. WHEN a user deletes from user_favorites, THE RLS_Policy SHALL verify auth.jwt() email matches the row user_email
5. THE System SHALL use Supabase_Auth client with user session for all database operations requiring RLS

### Requirement 9: Implement Auth Callback Route

**User Story:** As a user, I want email confirmation links to work correctly, so that I can verify my account.

#### Acceptance Criteria

1. WHEN a user clicks an email confirmation link with a code parameter, THE Callback_Route SHALL exchange the auth code for a session
2. WHEN the code exchange succeeds, THE Callback_Route SHALL redirect to the intended destination or home page
3. IF the code exchange fails, THEN THE Callback_Route SHALL redirect to /login with an error query parameter
4. WHEN a user clicks an email link with token_hash and type parameters, THE Callback_Route SHALL verify the OTP token
5. IF the auth code is missing or malformed, THEN THE Callback_Route SHALL redirect to /login with an error query parameter

### Requirement 10: Clean Up Environment Variables

**User Story:** As a developer, I want only necessary environment variables, so that configuration is clear and secure.

#### Acceptance Criteria

1. THE System SHALL not require NEXTAUTH_SECRET environment variable
2. THE System SHALL not require NEXTAUTH_URL environment variable
3. THE System SHALL not require GOOGLE_CLIENT_ID environment variable
4. THE System SHALL not require GOOGLE_CLIENT_SECRET environment variable
5. THE System SHALL require NEXT_PUBLIC_SUPABASE_URL environment variable
6. THE System SHALL require NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable
7. THE .env.example file SHALL document only the required Supabase environment variables for authentication

### Requirement 11: Remove Obsolete Files

**User Story:** As a developer, I want obsolete authentication files removed, so that the codebase is clean and maintainable.

#### Acceptance Criteria

1. THE System SHALL not contain src/app/api/auth/[...nextauth]/route.ts after migration
2. THE System SHALL not contain src/lib/auth.ts after migration
3. THE System SHALL not contain any files importing from next-auth packages after migration
4. WHEN migration is complete, THE System SHALL have a single authentication implementation using Supabase_Auth
