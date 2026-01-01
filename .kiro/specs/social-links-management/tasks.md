# Implementation Plan: Social Links Management

## Overview

This plan implements a social media links management feature for the admin panel. The implementation follows the existing codebase patterns using Supabase, Next.js API routes, and React components.

## Tasks

- [x] 1. Create database migration and types
  - [x] 1.1 Create Supabase migration for social_links table
    - Create migration file in `supabase/migrations/`
    - Define table with id, platform, url, created_at, updated_at columns
    - Add unique constraint on platform column
    - Seed with 4 fixed platforms (twitter, linkedin, facebook, instagram)
    - Enable RLS and create policies (public read, admin write)
    - _Requirements: 1.1, 1.3_
    - _MCP: Use Supabase MCP server for database operations_
  - [x] 1.2 Add TypeScript types for social links
    - Add SocialLinkRow type to `src/lib/supabase/types.ts`
    - Add SocialLinksResponse type for API responses
    - Add SocialLinksFormData type for form handling
    - _Requirements: 1.1_

- [x] 2. Implement API routes
  - [x] 2.1 Create admin API route for social links
    - Create `src/app/api/admin/social-links/route.ts`
    - Implement GET handler to fetch all social links
    - Implement PUT handler to update all social links
    - Add admin authentication check
    - _Requirements: 1.3, 1.5_
    - _MCP: Use Supabase MCP server for database queries_
  - [x] 2.2 Create public API route for footer
    - Create `src/app/api/social-links/route.ts`
    - Implement GET handler to fetch active social links
    - Return only platforms with non-empty URLs
    - _Requirements: 2.1, 2.2_
    - _MCP: Use Supabase MCP server for database queries_
  - [x] 2.3 Write property test for data round-trip consistency
    - **Property 2: Data Round-Trip Consistency**
    - **Validates: Requirements 1.3, 1.5**
    - _MCP: Use Supabase MCP server for test database operations_

- [x] 3. Implement URL validation utility
  - [x] 3.1 Create URL validation function
    - Create validation function in `src/lib/utils/validation.ts` or new file
    - Accept valid URLs (http:// or https://)
    - Accept empty strings
    - Reject all other strings
    - _Requirements: 1.4, 1.6, 1.7_
  - [x] 3.2 Write property test for URL validation
    - **Property 1: URL Validation**
    - **Validates: Requirements 1.4, 1.6, 1.7**

- [x] 4. Implement admin page
  - [x] 4.1 Create Social Links admin page
    - Create `src/app/admin/social-links/page.tsx`
    - Fetch current social links on load
    - Display form with 4 URL input fields (one per platform)
    - Display platform icon next to each field
    - Pre-populate fields with current values
    - _Requirements: 1.1, 1.2, 1.3_
    - _MCP: Use Sequential Thinking MCP server for complex component logic_
  - [x] 4.2 Implement form submission and validation
    - Validate URLs on submit using validation function
    - Display validation errors on invalid fields
    - Save via PUT to admin API
    - Show success/error toast messages
    - _Requirements: 1.4, 1.5, 1.6, 1.7_
  - [x] 4.3 Verify admin page UI implementation
    - Verify form renders correctly with all 4 platform fields
    - Verify icons display correctly for each platform
    - Verify validation errors display properly
    - Verify success/error toasts appear correctly
    - _Requirements: 1.1, 1.2, 1.6_
    - _MCP: Use Playwright MCP server for visual analysis and UI verification_

- [x] 5. Update Admin Sidebar
  - [x] 5.1 Add Settings group and Social Links item
    - Update `src/components/admin/AdminSidebar.tsx`
    - Add "Settings" navigation group at bottom
    - Add "Social Links" item with Share2 icon
    - Link to /admin/social-links
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 5.2 Verify sidebar UI implementation
    - Verify Settings group appears in sidebar
    - Verify Social Links item displays with correct icon
    - Verify navigation to /admin/social-links works
    - Verify active state highlighting on Social Links page
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
    - _MCP: Use Playwright MCP server for visual analysis and UI verification_

- [x] 6. Implement icon mapping utility
  - [x] 6.1 Create platform icon mapping function
    - Create function to map platform names to Lucide icons
    - Map twitter → Twitter icon
    - Map linkedin → Linkedin icon
    - Map facebook → Facebook icon
    - Map instagram → Instagram icon
    - _Requirements: 2.4_
  - [x] 6.2 Write property test for platform icon mapping
    - **Property 4: Platform Icon Mapping**
    - **Validates: Requirements 2.4**

- [x] 7. Update Footer component
  - [x] 7.1 Fetch and display social links in Footer
    - Update `src/components/layout/Footer.tsx`
    - Fetch social links from `/api/social-links` on mount
    - Display only platforms with non-empty URLs
    - Use platform icon mapping for icons
    - Open links in new tab (target="_blank")
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
    - _MCP: Use Fetch MCP server for API data fetching_
  - [x] 7.2 Write property test for footer filtering
    - **Property 3: Footer Filtering**
    - **Validates: Requirements 2.2**
  - [x] 7.3 Verify footer UI implementation
    - Verify social links display correctly in footer
    - Verify only non-empty URLs are shown
    - Verify correct icons for each platform
    - Verify links open in new tab
    - _Requirements: 2.2, 2.3, 2.4_
    - _MCP: Use Playwright MCP server for visual analysis and UI verification_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The sidebar active state (Property 5) is already handled by existing AdminSidebar logic

## MCP Server Usage

- **Supabase MCP**: Database migrations, queries, and data operations (tasks 1.1, 2.1, 2.2, 2.3)
- **Playwright MCP**: Visual analysis and UI verification (tasks 4.3, 5.2, 7.3)
- **Sequential Thinking MCP**: Complex component logic and problem-solving (task 4.1)
- **Fetch MCP**: Browser-related API data fetching (task 7.1)
