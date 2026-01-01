# Implementation Plan: Company Pages Management

## Overview

This implementation plan covers the Company Pages Management feature, which enables administrators to manage content for internal company information pages and adds external link management to the Social Links page. The implementation follows existing patterns in the codebase using Supabase, Next.js API routes, and React components.

## MCP Server Usage

- **Supabase MCP Server**: Use for all database operations, migrations, RLS policies, and verifying Supabase implementation
- **Playwright MCP Server**: Use for UI implementation testing, button functionality, and end-to-end testing
- **Sequential Thinking MCP Server**: Use for critical/complex tasks requiring step-by-step reasoning
- **Fetch MCP Server**: Use for web browser related tasks and API testing

## Tasks

- [x] 1. Create database migration for company_pages table
  - Create migration file in `supabase/migrations/`
  - Define company_pages table with id, slug, title, content, created_at, updated_at columns
  - Add unique constraint on slug
  - Seed with four fixed pages: about, contact, privacy, terms
  - Enable RLS and create public read policy
  - Create admin write policy
  - Add updated_at trigger
  - **Use Supabase MCP Server** to create and apply migration
  - **Use Supabase MCP Server** to verify table creation and RLS policies
  - _Requirements: 1.1, 2.5, 3.1, 3.2, 3.3, 3.4_

- [x] 2. Add external link rows to social_links table
  - Create migration to insert community and help_center platform rows
  - **Use Supabase MCP Server** to create and apply migration
  - **Use Supabase MCP Server** to verify rows were inserted correctly
  - _Requirements: 5.4_

- [x] 3. Create company pages repository
  - [x] 3.1 Create `src/lib/db/repositories/company-pages.repository.ts`
    - Implement `findAll()` method to fetch all company pages
    - Implement `findBySlug(slug)` method to fetch single page
    - Implement `update(slug, data)` method to update page content
    - **Use Supabase MCP Server** to test repository methods against database
    - **Use Sequential Thinking MCP Server** for designing repository interface
    - _Requirements: 1.1, 2.2, 2.5_

  - [x] 3.2 Write property test for repository round-trip
    - **Property 3: Form Pre-population Round-Trip**
    - **Use Supabase MCP Server** to verify data persistence
    - **Validates: Requirements 2.2**

- [x] 4. Create company pages admin API routes
  - [x] 4.1 Create `src/app/api/admin/company-pages/route.ts`
    - Implement GET handler to return all company pages
    - Add admin authentication check
    - **Use Supabase MCP Server** to query company_pages table
    - **Use Fetch MCP Server** to test API endpoint responses
    - _Requirements: 1.1_

  - [x] 4.2 Create `src/app/api/admin/company-pages/[slug]/route.ts`
    - Implement GET handler to return single page by slug
    - Implement PUT handler to update page content
    - Add admin authentication check
    - Add title validation (non-empty)
    - **Use Supabase MCP Server** for database operations
    - **Use Fetch MCP Server** to test API endpoint responses
    - **Use Sequential Thinking MCP Server** for validation logic design
    - _Requirements: 2.2, 2.4, 2.5, 2.6_

  - [x] 4.3 Write property test for title validation
    - **Property 4: Title Validation**
    - **Validates: Requirements 2.4, 2.6, 2.7**

- [x] 5. Create company pages admin UI
  - [x] 5.1 Create `src/app/admin/company-pages/page.tsx`
    - Fetch and display list of all company pages
    - Show title and last updated date for each page
    - Add Edit button linking to edit page
    - **Use Supabase MCP Server** to fetch page data
    - **Use Playwright MCP Server** to test list rendering and Edit button functionality
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 5.2 Write property test for list item rendering
    - **Property 1: Company Page List Item Rendering**
    - **Use Playwright MCP Server** to verify UI elements are rendered correctly
    - **Validates: Requirements 1.2, 1.3**

  - [x] 5.3 Create `src/app/admin/company-pages/[slug]/edit/page.tsx`
    - Create form with title text input and content rich text editor
    - Pre-populate form with current saved content
    - Implement save functionality with validation
    - Show success/error toast messages
    - **Use Supabase MCP Server** to fetch and save page content
    - **Use Playwright MCP Server** to test form inputs, buttons, and validation messages
    - **Use Sequential Thinking MCP Server** for form state management design
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 5.4 Write property test for edit navigation
    - **Property 2: Edit Navigation**
    - **Use Playwright MCP Server** to test navigation from list to edit page
    - **Validates: Requirements 1.4**

- [x] 6. Update Admin Sidebar
  - [x] 6.1 Update `src/components/admin/AdminSidebar.tsx`
    - Add "Company Pages" item to Settings group with FileText icon
    - Link to /admin/company-pages
    - **Use Playwright MCP Server** to test sidebar navigation and link functionality
    - _Requirements: 4.1, 4.2_

  - [x] 6.2 Write property test for sidebar active state
    - **Property 7: Sidebar Active State**
    - **Use Playwright MCP Server** to verify active state highlighting
    - **Validates: Requirements 4.3**

- [x] 7. Checkpoint - Admin functionality complete
  - Ensure all admin tests pass, ask the user if questions arise.
  - **Use Playwright MCP Server** to run full admin UI test suite
  - **Use Supabase MCP Server** to verify all database operations work correctly

- [x] 8. Create frontend company pages
  - [x] 8.1 Create `src/app/(site)/about/page.tsx`
    - Fetch About Us content from database
    - Render title and rich text content
    - Show placeholder if content is empty
    - **Use Supabase MCP Server** to fetch page content
    - **Use Playwright MCP Server** to test page rendering
    - _Requirements: 3.1_

  - [x] 8.2 Create `src/app/(site)/contact/page.tsx`
    - Fetch Contact content from database
    - Render title and rich text content
    - Show placeholder if content is empty
    - **Use Supabase MCP Server** to fetch page content
    - **Use Playwright MCP Server** to test page rendering
    - _Requirements: 3.2_

  - [x] 8.3 Create `src/app/(site)/privacy/page.tsx`
    - Fetch Privacy Policy content from database
    - Render title and rich text content
    - Show placeholder if content is empty
    - **Use Supabase MCP Server** to fetch page content
    - **Use Playwright MCP Server** to test page rendering
    - _Requirements: 3.3_

  - [x] 8.4 Create `src/app/(site)/terms/page.tsx`
    - Fetch Terms of Service content from database
    - Render title and rich text content
    - Show placeholder if content is empty
    - **Use Supabase MCP Server** to fetch page content
    - **Use Playwright MCP Server** to test page rendering
    - _Requirements: 3.4_

  - [x] 8.5 Write property test for content display round-trip
    - **Property 5: Content Display Round-Trip**
    - **Use Supabase MCP Server** to save test content
    - **Use Playwright MCP Server** to verify content displays correctly on frontend
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [x] 9. Update Footer component
  - [x] 9.1 Update `src/components/layout/Footer.tsx`
    - Add "Company" section with links to /about, /contact, /privacy, /terms
    - Add "Resources" section for external links
    - Fetch external links from social_links table
    - Conditionally display Community and Help Center links when URLs are non-empty
    - **Use Supabase MCP Server** to fetch external links
    - **Use Playwright MCP Server** to test footer link rendering and navigation
    - _Requirements: 3.5, 3.6, 5.5_

  - [x] 9.2 Write property test for footer company link navigation
    - **Property 6: Footer Company Link Navigation**
    - **Use Playwright MCP Server** to test link clicks navigate to correct pages
    - **Validates: Requirements 3.6**

  - [x] 9.3 Write property test for conditional external link display
    - **Property 10: Conditional External Link Display**
    - **Use Supabase MCP Server** to set/unset external link URLs
    - **Use Playwright MCP Server** to verify conditional rendering
    - **Validates: Requirements 5.5**

- [x] 10. Update Social Links admin page
  - [x] 10.1 Update `src/app/admin/social-links/page.tsx`
    - Add Community and Help Center URL input fields
    - Organize fields into "Social Media" and "External Links" sections
    - Apply same URL validation to new fields
    - Save external link URLs to database
    - **Use Supabase MCP Server** to save and fetch external links
    - **Use Playwright MCP Server** to test form inputs, sections, and save functionality
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 10.2 Write property test for URL validation consistency
    - **Property 8: URL Validation Consistency**
    - **Use Playwright MCP Server** to test validation behavior on URL inputs
    - **Validates: Requirements 5.3**

  - [x] 10.3 Write property test for external links round-trip
    - **Property 9: External Links Round-Trip**
    - **Use Supabase MCP Server** to verify data persistence
    - **Use Fetch MCP Server** to test API responses
    - **Validates: Requirements 5.4**

- [x] 11. Final checkpoint - All tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - **Use Playwright MCP Server** to run full end-to-end test suite
  - **Use Supabase MCP Server** to verify all database state is correct

## Notes

- All tasks including property tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows existing patterns in the codebase (repositories, API routes, admin forms)

## MCP Server Reference

| MCP Server | Usage |
|------------|-------|
| **Supabase MCP Server** | Database migrations, RLS policies, data operations, verification |
| **Playwright MCP Server** | UI testing, button functionality, navigation, end-to-end tests |
| **Sequential Thinking MCP Server** | Complex/critical task reasoning, architecture decisions |
| **Fetch MCP Server** | API endpoint testing, web requests |
