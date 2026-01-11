# Implementation Plan: Category Page Redesign

## Overview

This implementation plan transforms the `/category` page into a visually appealing, card-based grid layout with hero section, search functionality, and responsive design. The implementation follows a component-first approach, building reusable UI components before integrating them into the page.

## MCP Server Usage

- **Sequential Thinking MCP**: Use for complex logic tasks requiring multi-step reasoning
- **Playwright MCP**: Use for front-end visual verification and UI testing
- **Supabase MCP**: Use for database queries and data fetching operations

## Tasks

- [x] 1. Create utility functions for category filtering and formatting
  - [x] 1.1 Create `isValidCategory` filter function
    - Implement filtering logic for toolCount > 0, no "Test" names, no timestamp patterns, no random strings
    - Export from `src/lib/utils/category-utils.ts`
    - 🧠 **Use Sequential Thinking MCP** to design the filtering logic with multiple edge cases
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Write property test for category filtering
    - **Property 1: Category Filtering Preserves Valid Categories**
    - Generate random categories with various tool counts and names
    - Verify filtered output satisfies all filter criteria
    - **Validates: Requirements 1.1, 1.2**

  - [x] 1.3 Create `formatToolCount` formatting function
    - Implement thousands separator formatting with "tool"/"tools" suffix
    - Handle edge cases: 0, 1, large numbers
    - Export from `src/lib/utils/category-utils.ts`
    - _Requirements: 2.2, 3.3_

  - [x] 1.4 Write property test for tool count formatting
    - **Property 2: Tool Count Formatting**
    - Generate random positive integers
    - Verify output contains proper separators and correct suffix
    - **Validates: Requirements 2.2, 3.3**

  - [x] 1.5 Create `generateCategoryLink` function
    - Return `/category/{slug}` for given category slug
    - Export from `src/lib/utils/category-utils.ts`
    - _Requirements: 3.5_

  - [x] 1.6 Write property test for category link generation
    - **Property 3: Category Link Generation**
    - Generate random valid slugs
    - Verify link format is exactly `/category/{slug}`
    - **Validates: Requirements 3.5**

- [x] 2. Checkpoint - Verify utility functions
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Create CategoryCard component
  - [x] 3.1 Implement CategoryCard component
    - Create `src/components/features/category/CategoryCard.tsx`
    - Display icon/emoji, category name (bold), formatted tool count
    - Apply hover effects with shadow and scale (transition ≤200ms)
    - Link to `/category/[slug]`
    - 🎭 **Use Playwright MCP** to verify card renders correctly with all elements visible
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Create CategoryCardSkeleton component
    - Create `src/components/features/category/CategoryCardSkeleton.tsx`
    - Match dimensions of CategoryCard with placeholder animation
    - 🎭 **Use Playwright MCP** to verify skeleton displays during loading state
    - _Requirements: 7.1_

- [x] 4. Create CategoryGrid component
  - [x] 4.1 Implement CategoryGrid component
    - Create `src/components/features/category/CategoryGrid.tsx`
    - Responsive grid: 4 cols (≥1024px), 3 cols (768-1023px), 2 cols (<768px)
    - Maintain 24px gap between cards
    - 🎭 **Use Playwright MCP** to verify responsive breakpoints at different viewport sizes
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Create CategoryPageHero component
  - [x] 5.1 Implement CategoryPageHero component
    - Create `src/components/features/category/CategoryPageHero.tsx`
    - Display title "Explore AI Tool Categories"
    - Show formatted total tool count and category count in subtitle
    - Include search input with onChange handler
    - Apply purple-600 gradient background
    - 🎭 **Use Playwright MCP** to verify hero section displays correctly with title, subtitle, and search input
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6. Create search filtering logic
  - [x] 6.1 Create `filterCategoriesBySearch` function
    - Implement case-insensitive name matching
    - Return all categories when search is empty
    - Export from `src/lib/utils/category-utils.ts`
    - 🧠 **Use Sequential Thinking MCP** to design case-insensitive matching with edge cases
    - _Requirements: 5.1, 5.2, 5.4_

  - [x] 6.2 Write property test for search filter case-insensitivity
    - **Property 4: Search Filter Case-Insensitivity**
    - Generate random search terms and category sets
    - Verify case-insensitive matching works correctly
    - **Validates: Requirements 5.1, 5.2**

  - [x] 6.3 Write property test for search clear round-trip
    - **Property 5: Search Clear Round-Trip**
    - Generate random category sets and search terms
    - Apply search, then clear, verify original set restored
    - **Validates: Requirements 5.4**

- [x] 7. Checkpoint - Verify components and search logic
  - Ensure all tests pass, ask the user if questions arise.
  - 🎭 **Use Playwright MCP** to verify search filtering works in real-time on the page

- [x] 8. Create CategoryPageClient component
  - [x] 8.1 Implement CategoryPageClient component
    - Create `src/components/features/category/CategoryPageClient.tsx`
    - Manage search query state with useState
    - Filter categories in real-time based on search
    - Render hero, grid, and empty state components
    - Display "No categories found" when search yields no results
    - 🧠 **Use Sequential Thinking MCP** to design state management and component composition
    - 🎭 **Use Playwright MCP** to verify empty state message appears when no matches found
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 9. Update Category page server component
  - [x] 9.1 Update `/category` page with ISR and data fetching
    - Update `src/app/(site)/category/page.tsx`
    - Configure ISR with revalidate = 3600
    - Fetch categories from Supabase with single query
    - Apply `isValidCategory` filter server-side
    - Calculate total tool count
    - Pass filtered data to CategoryPageClient
    - 🗄️ **Use Supabase MCP** to query categories table and verify data structure
    - 🧠 **Use Sequential Thinking MCP** to design the data fetching and filtering pipeline
    - _Requirements: 1.1, 1.2, 7.2, 7.3_

  - [x] 9.2 Update loading.tsx with skeleton grid
    - Update `src/app/(site)/category/loading.tsx`
    - Display grid of CategoryCardSkeleton components
    - 🎭 **Use Playwright MCP** to verify loading state displays skeleton grid
    - _Requirements: 7.1_

- [x] 10. Apply visual design consistency
  - [x] 10.1 Ensure color palette and typography consistency
    - Verify purple-600 and gray-500 usage across components
    - Confirm font family matches site design
    - Verify all hover transitions are ≤200ms
    - 🎭 **Use Playwright MCP** to take screenshots and verify visual consistency across components
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 11. Final checkpoint - Integration testing
  - Ensure all tests pass, ask the user if questions arise.
  - 🎭 **Use Playwright MCP** to verify full page renders within existing site layout with header/footer
  - 🗄️ **Use Supabase MCP** to verify categories are fetched correctly from database

## Notes

- All tasks including property tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases

## MCP Server Legend

- 🧠 **Sequential Thinking MCP**: For complex multi-step reasoning and logic design
- 🎭 **Playwright MCP**: For front-end visual verification and UI testing
- 🗄️ **Supabase MCP**: For database operations and data verification
