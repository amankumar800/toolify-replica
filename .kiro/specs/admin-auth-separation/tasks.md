# Implementation Plan: Admin Authentication Separation

## Overview

This implementation plan creates a dedicated authentication system for admin users, completely independent from Supabase Auth. The approach follows a bottom-up strategy: database layer first, then utilities, services, middleware, and finally UI components.

## MCP Server Usage Guide

The following MCP servers should be used for specific task types:

| MCP Server | Use Case |
|------------|----------|
| **Supabase** | Database operations, migrations, RLS policies, table verification |
| **Playwright** | Visual UI verification, login flow testing, page interactions |
| **Sequential Thinking** | Complex multi-step logic, authentication flows, middleware design |
| **Fetch** | External documentation lookup, bcrypt/JWT library references |

## Tasks

- [x] 1. Create admins database table and migration
  - Create migration file `supabase/migrations/YYYYMMDD_create_admins_table.sql`
  - Define admins table with all required columns (id, email, password_hash, is_active, last_login_at, failed_login_attempts, locked_until, created_at, updated_at)
  - Create unique index on email column
  - Enable RLS with service role only policy
  - Add updated_at trigger
  - 🔧 **Use Supabase MCP** to execute migration and verify table structure
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 2. Implement password utilities
  - [x] 2.1 Create password utility module at `src/lib/utils/password.ts`
    - Implement `hashPassword()` using bcrypt with 12 rounds
    - Implement `verifyPassword()` for hash comparison
    - Implement `validatePasswordStrength()` for 8+ chars, 1 uppercase, 1 number
    - 🌐 **Use Fetch MCP** to reference bcrypt library documentation for best practices
    - _Requirements: 1.4, 6.4_

  - [x] 2.2 Write property tests for password utilities
    - **Property 2: Password Hashing Format**
    - **Property 4: Password Strength Validation**
    - **Validates: Requirements 1.4, 6.4**

- [x] 3. Implement JWT utilities
  - [x] 3.1 Create JWT utility module at `src/lib/utils/jwt.ts`
    - Define JWTPayload interface with sub, email, iat, exp
    - Implement `signToken()` using ADMIN_JWT_SECRET
    - Implement `verifyToken()` for signature and expiry validation
    - Set token expiry to 8 hours
    - 🌐 **Use Fetch MCP** to reference jose/jsonwebtoken library documentation
    - 🧠 **Use Sequential Thinking MCP** to design token validation logic with edge cases
    - _Requirements: 3.1, 3.2, 3.4, 3.6_

  - [x] 3.2 Write property tests for JWT utilities
    - **Property 8: JWT Signature Validation**
    - **Validates: Requirements 3.6**

- [x] 4. Implement email validation utility
  - [x] 4.1 Create email validation at `src/lib/utils/validation.ts`
    - Implement `validateEmail()` using regex pattern `^[^\s@]+@[^\s@]+\.[^\s@]+$`
    - Return validation result with error message
    - _Requirements: 2.6, 8.1_

  - [x] 4.2 Write property tests for email validation
    - **Property 3: Email Format Validation**
    - **Validates: Requirements 2.6, 8.1**

- [x] 5. Checkpoint - Ensure all utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement admins repository
  - [x] 6.1 Create admins repository at `src/lib/db/repositories/admins.repository.ts`
    - Define AdminRecord interface
    - Implement `findByEmail()` using parameterized query
    - Implement `recordSuccessfulLogin()` to update last_login_at and reset failed_login_attempts
    - Implement `recordFailedLogin()` to increment failed_login_attempts
    - Implement `lockAccount()` to set locked_until to current time + 15 minutes
    - Implement `isAccountLocked()` helper function
    - Implement `upsertAdmin()` for setup script
    - 🔧 **Use Supabase MCP** to test queries and verify data operations
    - 🧠 **Use Sequential Thinking MCP** to design lockout logic flow
    - _Requirements: 2.7, 5.1, 5.2, 5.4, 6.2, 6.3, 8.2, 8.3_

  - [x] 6.2 Write property tests for admins repository
    - **Property 1: Email Uniqueness Constraint**
    - **Property 15: Admin Upsert Idempotence**
    - 🔧 **Use Supabase MCP** to verify constraint violations and upsert behavior
    - **Validates: Requirements 1.3, 6.2, 6.3**

- [x] 7. Implement admin auth service
  - [x] 7.1 Create admin auth service at `src/lib/services/admin-auth.service.ts`
    - Define AdminUser, AdminSession, LoginResult interfaces
    - Implement `loginAdmin()` with credential validation, lockout check, and session creation
    - Implement `verifyAdminSession()` for token validation
    - Implement `createAdminToken()` for JWT generation
    - Implement `logoutAdmin()` to clear cookie
    - Implement `getAdminFromRequest()` to read session from cookies
    - Implement `requireAdmin()` helper that throws on invalid session
    - 🧠 **Use Sequential Thinking MCP** to design complete authentication flow with all edge cases
    - _Requirements: 2.2, 2.3, 2.7, 3.1, 3.3, 3.5, 5.1, 5.2, 5.3, 5.4, 8.4, 11.1, 11.2_

  - [x] 7.2 Write property tests for admin auth service
    - **Property 5: Successful Login Flow**
    - **Property 6: Failed Login Error Handling**
    - **Property 7: Account Lockout Mechanism**
    - **Validates: Requirements 2.2, 2.3, 2.7, 5.1, 5.2, 5.3, 5.4**

- [x] 8. Checkpoint - Ensure all service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement admin dashboard service
  - [x] 9.1 Create admin dashboard service at `src/lib/services/admin-dashboard.service.ts`
    - Implement `getToolsCount()` to count tools table rows
    - Implement `getCategoriesCount()` to count categories table rows
    - Implement `getAiNewsCount()` to count ai_news table rows
    - Implement `getRecentTools(limit)` to fetch N most recent tools ordered by created_at DESC
    - 🔧 **Use Supabase MCP** to verify count queries and ordering
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 9.2 Write property tests for admin dashboard service
    - **Property 13: Recent Tools Ordering**
    - **Property 16: Dashboard Statistics Accuracy**
    - 🔧 **Use Supabase MCP** to insert test data and verify statistics
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

- [x] 10. Implement admin API routes
  - [x] 10.1 Create login API route at `src/app/api/admin/login/route.ts`
    - Handle POST requests with email and password
    - Validate email format before processing
    - Call admin auth service loginAdmin()
    - Set httpOnly, secure, sameSite=strict cookie on success
    - Return generic error messages
    - 🧠 **Use Sequential Thinking MCP** to design request/response flow with error handling
    - _Requirements: 2.2, 2.3, 2.6, 8.4, 11.3_

  - [x] 10.2 Create logout API route at `src/app/api/admin/logout/route.ts`
    - Handle POST requests
    - Clear admin_session cookie
    - Redirect to /admin/login
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 11. Update middleware for admin route protection
  - [x] 11.1 Extend middleware at `src/middleware.ts`
    - Add admin route detection for `/admin/*` paths
    - Skip authentication for `/admin/login`
    - Redirect authenticated users from `/admin/login` to `/admin/dashboard`
    - Validate admin session for protected routes
    - Check is_active status
    - Redirect to `/admin/login` on invalid/expired session
    - Log unauthorized access attempts
    - 🧠 **Use Sequential Thinking MCP** to design middleware decision tree for all route scenarios
    - _Requirements: 2.4, 4.1, 4.2, 4.3, 4.4, 4.5, 11.4_

  - [x] 11.2 Write property tests for middleware
    - **Property 9: Route Protection**
    - **Property 10: Inactive Account Denial**
    - **Property 11: Authenticated Admin Login Redirect**
    - **Validates: Requirements 2.4, 4.1, 4.2, 4.3, 4.5**

- [x] 12. Checkpoint - Ensure middleware tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Implement admin login page
  - [x] 13.1 Create admin login page at `src/app/admin/login/page.tsx`
    - Create client component with email and password inputs
    - Add client-side email format validation
    - Implement form submission to /api/admin/login
    - Display loading state during submission
    - Display error messages from API response
    - Apply admin-specific branding distinct from user login
    - 🎭 **Use Playwright MCP** to verify visual layout, form interactions, and error display
    - _Requirements: 2.1, 2.3, 2.5, 2.6_

- [x] 14. Update admin layout
  - [x] 14.1 Update admin layout at `src/app/admin/layout.tsx`
    - Remove all Supabase Auth dependencies
    - Read admin session from cookie using getAdminFromRequest()
    - Display admin email from session
    - Add logout button calling /api/admin/logout
    - Redirect to /admin/login if session invalid
    - 🎭 **Use Playwright MCP** to verify layout renders correctly with admin email and logout button
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 15. Implement admin dashboard page
  - [x] 15.1 Update admin dashboard at `src/app/admin/dashboard/page.tsx`
    - Fetch dashboard statistics using admin dashboard service
    - Display total tools count
    - Display total categories count
    - Display total AI news articles count
    - Display list of 5 most recently added tools
    - 🎭 **Use Playwright MCP** to verify statistics cards and recent tools list display correctly
    - 🔧 **Use Supabase MCP** to verify data matches what's displayed
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 16. Create admin setup script
  - [x] 16.1 Create setup script at `scripts/setup-admin-user.ts`
    - Read ADMIN_EMAIL and ADMIN_PASSWORD from environment variables
    - Validate password strength
    - Hash password using bcrypt
    - Upsert admin record (create or update)
    - Log success/failure message
    - 🔧 **Use Supabase MCP** to verify admin record is created/updated correctly
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 17. Add environment variables
  - [x] 17.1 Update `.env.example` with required variables
    - Add ADMIN_JWT_SECRET placeholder
    - Add ADMIN_EMAIL placeholder
    - Add ADMIN_PASSWORD placeholder
    - _Requirements: 3.2, 6.2_

- [x] 18. Final checkpoint - Full integration test
  - Ensure all tests pass, ask the user if questions arise.
  - 🎭 **Use Playwright MCP** to perform end-to-end visual verification:
    - Navigate to /admin/login and verify page renders
    - Submit login form with valid credentials
    - Verify redirect to /admin/dashboard
    - Verify dashboard displays statistics correctly
    - Click logout and verify redirect to /admin/login
  - 🔧 **Use Supabase MCP** to verify:
    - Admin record exists with correct data
    - last_login_at is updated after login
    - failed_login_attempts resets on successful login
  - 🧠 **Use Sequential Thinking MCP** to systematically verify all edge cases:
    - Invalid credentials show generic error
    - Account lockout after 5 failed attempts
    - Locked account shows appropriate message
    - Expired session redirects to login

## Notes

- All tasks including property tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: database → utilities → services → middleware → UI

## MCP Server Legend

- 🔧 **Supabase MCP** - Database operations and verification
- 🎭 **Playwright MCP** - Visual UI testing and browser interactions
- 🧠 **Sequential Thinking MCP** - Complex logic design and edge case analysis
- 🌐 **Fetch MCP** - External documentation and library references
