# Implementation Plan: Database Schema Redesign

## Overview

This implementation plan covers the creation of an optimized 10-table database schema for the AI Tools Book directory application. The plan follows an incremental approach, starting with core tables and building up to feature tables, RLS policies, and comprehensive property-based tests.

## Tasks

- [x] 1. Create core database tables
  - [x] 1.1 Create category_groups table with indexes
    - Create table with id, name, icon_name, display_order, timestamps
    - Add B-tree index on display_order
    - _Requirements: 3.1, 3.2_
    - 🔧 **MCP Servers**: Supabase (execute SQL, verify table creation)

  - [x] 1.2 Create categories table with indexes and foreign key
    - Create table with id, name, slug, description, icon, tool_count, display_order, group_id, metadata, timestamps
    - Add foreign key to category_groups with ON DELETE SET NULL
    - Add B-tree indexes on slug, group_id, display_order
    - _Requirements: 2.1, 2.2, 2.3_
    - 🔧 **MCP Servers**: Supabase (execute SQL, verify foreign key)

  - [x] 1.3 Create subcategories table with indexes and cascade delete
    - Create table with id, category_id, name, slug, tool_count, display_order, timestamps
    - Add foreign key to categories with ON DELETE CASCADE
    - Add B-tree indexes on category_id, slug
    - _Requirements: 4.1, 4.2, 4.3_
    - 🔧 **MCP Servers**: Supabase (execute SQL, verify cascade behavior)

  - [x] 1.4 Create tools table with all columns, constraints, and indexes
    - Create table with core identification, classification, engagement metrics, display flags, ranking data, submission workflow, and search_vector
    - Add CHECK constraints for pricing and status
    - Add generated search_vector column with weighted tsvector
    - Add B-tree indexes on slug, pricing, status, is_featured (partial), created_at
    - Add GIN indexes on search_vector, tags
    - _Requirements: 1.1-1.11_
    - 🔧 **MCP Servers**: Sequential Thinking (complex table with many columns/constraints), Supabase (execute SQL, verify constraints and indexes), Fetch (reference PostgreSQL tsvector documentation if needed)

  - [x] 1.5 Create tool_categories junction table
    - Create table with composite primary key (tool_id, category_id)
    - Add foreign keys with ON DELETE CASCADE
    - Add B-tree indexes on tool_id, category_id
    - _Requirements: 5.1-5.4_
    - 🔧 **MCP Servers**: Supabase (execute SQL, verify composite key)

- [x] 2. Create feature tables
  - [x] 2.1 Create featured_tools table with sponsorship support
    - Create table with id, tool_id, display_order, placement_type, sponsorship fields, campaign dates, metrics
    - Add CHECK constraint for placement_type
    - Add foreign key to tools with ON DELETE CASCADE
    - Add B-tree indexes on (placement_type, display_order) and (start_date, end_date) partial
    - _Requirements: 6.1-6.6_
    - 🔧 **MCP Servers**: Supabase (execute SQL, verify partial index)

  - [x] 2.2 Create faqs table with category support
    - Create table with id, question, answer, display_order, category
    - Add B-tree index on (category, display_order)
    - _Requirements: 7.1-7.3_
    - 🔧 **MCP Servers**: Supabase (execute SQL, verify table)

  - [x] 2.3 Create user_favorites table with shortcuts support
    - Create table with id, user_email, tool_id, tool_name, category_id, is_shortcut, display_order, custom_icon_color, timestamps
    - Add unique constraint on (user_email, tool_id)
    - Add B-tree indexes on user_email, tool_id, (user_email, is_shortcut) partial
    - _Requirements: 8.1-8.6_
    - 🔧 **MCP Servers**: Supabase (execute SQL, verify unique constraint)

  - [x] 2.4 Create midjourney_prompts table
    - Create table with id, title, slug, sref_code, prompt_text, image_url, type, tags, view_count, copy_count, timestamps
    - Add CHECK constraint for type
    - Add B-tree indexes on slug, type, view_count, copy_count, created_at
    - Add GIN index on tags
    - _Requirements: 9.1-9.6_
    - 🔧 **MCP Servers**: Supabase (execute SQL, verify GIN index)

  - [x] 2.5 Create ai_news table
    - Create table with id, title, slug, summary, content, author fields, source fields, category, tags, metrics, is_published, published_at, timestamps
    - Add B-tree indexes on slug, category, (is_published, published_at), (priority_score, published_at)
    - Add GIN index on tags
    - _Requirements: 10.1-10.8_
    - 🔧 **MCP Servers**: Supabase (execute SQL, verify composite indexes)

- [x] 3. Create database functions and triggers
  - [x] 3.1 Create is_admin() function
    - Create function with SECURITY DEFINER
    - Set search_path to 'public'
    - Query auth.users for admin role in raw_user_meta_data
    - _Requirements: 11.5, 11.6_
    - 🔧 **MCP Servers**: Sequential Thinking (security-sensitive function design), Supabase (execute SQL, verify function), Fetch (reference Supabase auth documentation)

  - [x] 3.2 Create updated_at trigger function
    - Create update_updated_at_column() function
    - _Requirements: 12.4_
    - 🔧 **MCP Servers**: Supabase (execute SQL, verify function)

  - [x] 3.3 Apply updated_at triggers to all tables with updated_at column
    - Apply to tools, categories, category_groups, subcategories, midjourney_prompts, ai_news
    - _Requirements: 12.4_
    - 🔧 **MCP Servers**: Supabase (execute SQL, verify triggers on each table)

  - [x] 3.4 Create shortcut limit enforcement trigger
    - Create enforce_shortcut_limit() function
    - Apply trigger to user_favorites table
    - _Requirements: 8.8_
    - 🔧 **MCP Servers**: Sequential Thinking (complex trigger logic), Supabase (execute SQL, test trigger behavior)

- [x] 4. Checkpoint - Verify table structure
  - Ensure all tables are created with correct columns and constraints
  - Verify all indexes exist
  - Ask the user if questions arise
  - 🔧 **MCP Servers**: Supabase (query information_schema to verify all tables, columns, indexes, constraints)

- [x] 5. Enable RLS and create policies
  - [x] 5.1 Enable RLS on all tables
    - Enable RLS on tools, categories, category_groups, subcategories, tool_categories, featured_tools, faqs, user_favorites, midjourney_prompts, ai_news
    - _Requirements: 11.1_
    - 🔧 **MCP Servers**: Supabase (execute SQL, verify RLS enabled)

  - [x] 5.2 Create public read policies
    - Create "Public read access" policy on tools, categories, category_groups, subcategories, tool_categories, featured_tools, faqs, midjourney_prompts
    - Create filtered read policy on ai_news (WHERE is_published = true)
    - _Requirements: 11.2, 11.3_
    - 🔧 **MCP Servers**: Supabase (execute SQL, verify policies)

  - [x] 5.3 Create user_favorites RLS policies
    - Create SELECT, INSERT, UPDATE, DELETE policies for owner-only access
    - Use auth.jwt() ->> 'email' = user_email for access control
    - _Requirements: 8.7, 11.4_
    - 🔧 **MCP Servers**: Sequential Thinking (complex RLS logic), Supabase (execute SQL, test with different user contexts), Fetch (reference Supabase RLS documentation)

  - [x] 5.4 Create admin write policies
    - Create INSERT, UPDATE, DELETE policies using is_admin() function
    - Create special INSERT policy for tools allowing status = 'pending' for public submissions
    - _Requirements: 11.5, 11.7_
    - 🔧 **MCP Servers**: Sequential Thinking (complex policy logic), Supabase (execute SQL, verify admin policies)

- [x] 6. Checkpoint - Verify RLS policies
  - Ensure all RLS policies are correctly configured
  - Ask the user if questions arise
  - 🔧 **MCP Servers**: Supabase (query pg_policies to verify all policies)

- [x] 7. Create TypeScript types and mappers
  - [x] 7.1 Create database types in src/lib/supabase/types.ts
    - Define Tool, Category, CategoryGroup, Subcategory, ToolCategory, FeaturedTool, FAQ, UserFavorite, MidjourneyPrompt, AINews interfaces
    - Match all column types from schema
    - _Requirements: 1.1-1.8, 2.1, 3.1, 4.1, 5.1, 6.1-6.5, 7.1-7.2, 8.1-8.5, 9.1-9.4, 10.1-10.6_
    - 🔧 **MCP Servers**: Sequential Thinking (ensure type consistency across 10 interfaces), Supabase (verify column types match)

  - [x] 7.2 Update existing mappers for new schema
    - Update tool.mapper.ts for new columns
    - Update category.mapper.ts for group_id
    - Update subcategory.mapper.ts
    - _Requirements: 1.1-1.8, 2.1-2.2, 4.1-4.2_

- [x] 8. Update repository layer
  - [x] 8.1 Update tools.repository.ts for new schema
    - Add methods for submission workflow (create pending, approve, reject)
    - Add full-text search method using search_vector
    - _Requirements: 1.6-1.8, 13.4_
    - 🔧 **MCP Servers**: Sequential Thinking (complex search logic), Supabase (test queries), Fetch (reference PostgreSQL full-text search documentation)

  - [x] 8.2 Update categories.repository.ts
    - Add methods to fetch categories with group information
    - _Requirements: 2.2_
    - 🔧 **MCP Servers**: Supabase (test join queries)

  - [x] 8.3 Create featured-tools.repository.ts
    - Add method to get active featured tools (date filtering)
    - _Requirements: 6.7_
    - 🔧 **MCP Servers**: Supabase (test date filtering queries)

  - [x] 8.4 Create user-favorites.repository.ts
    - Add CRUD methods for favorites
    - Add shortcut management methods
    - _Requirements: 8.1-8.8_
    - 🔧 **MCP Servers**: Sequential Thinking (shortcut limit logic), Supabase (test CRUD operations)

  - [x] 8.5 Create midjourney-prompts.repository.ts
    - Add methods for listing, filtering by type, sorting
    - _Requirements: 9.1-9.7_
    - 🔧 **MCP Servers**: Supabase (test sorting and filtering queries)

  - [x] 8.6 Create ai-news.repository.ts
    - Add methods for listing published news with priority ordering
    - _Requirements: 10.1-10.9_
    - 🔧 **MCP Servers**: Supabase (test priority ordering queries)

- [x] 9. Checkpoint - Verify repository layer
  - Ensure all repository methods work correctly
  - Ask the user if questions arise
  - 🔧 **MCP Servers**: Supabase (run test queries for each repository)

- [x] 10. Write property-based tests for schema correctness
  - [x] 10.1 Write property test for schema completeness
    - **Property 1: Schema Completeness**
    - **Validates: Requirements 1.1, 1.3-1.5, 1.7, 2.1, 3.1, 4.1, 6.1, 6.3-6.5, 7.1-7.2, 8.1, 8.3-8.5, 9.1, 9.3-9.4, 10.1-10.6**
    - 🔧 **MCP Servers**: Sequential Thinking (design comprehensive property test), Supabase (verify schema via information_schema), Fetch (reference fast-check documentation)

  - [x] 10.2 Write property test for index completeness
    - **Property 2: Index Completeness**
    - **Validates: Requirements 1.10-1.11, 2.3, 3.2, 4.3, 5.4, 6.6, 7.3, 8.6, 9.5-9.6, 10.7-10.8**
    - 🔧 **MCP Servers**: Supabase (query pg_indexes to verify), Fetch (reference fast-check documentation)

  - [x] 10.3 Write property test for CHECK constraint enforcement
    - **Property 3: CHECK Constraint Enforcement**
    - **Validates: Requirements 1.2, 1.6, 6.2, 9.2**
    - 🔧 **MCP Servers**: Sequential Thinking (generate valid/invalid test values), Supabase (test constraint violations)

  - [x] 10.4 Write property test for cascade delete behavior
    - **Property 4: Cascade Delete Behavior**
    - **Validates: Requirements 4.2, 5.2, 5.3**
    - 🔧 **MCP Servers**: Supabase (create parent/child records, test cascade)

  - [x] 10.5 Write property test for unique constraint enforcement
    - **Property 5: Unique Constraint Enforcement**
    - **Validates: Requirements 5.1, 8.2**
    - 🔧 **MCP Servers**: Supabase (test duplicate insertions)

- [x] 11. Write property-based tests for RLS and triggers
  - [x] 11.1 Write property test for RLS policy enforcement
    - **Property 6: RLS Policy Enforcement**
    - **Validates: Requirements 11.1-11.5, 11.7**
    - 🔧 **MCP Servers**: Sequential Thinking (complex multi-role test scenarios), Supabase (test with different auth contexts), Fetch (reference Supabase RLS testing patterns)

  - [x] 11.2 Write property test for trigger behavior
    - **Property 7: Trigger Behavior**
    - **Validates: Requirements 12.4**
    - 🔧 **MCP Servers**: Supabase (update records, verify updated_at changes)

  - [x] 11.3 Write property test for shortcut limit enforcement
    - **Property 12: Shortcut Limit Enforcement**
    - **Validates: Requirements 8.8**
    - 🔧 **MCP Servers**: Sequential Thinking (boundary testing logic), Supabase (test 20+ shortcut insertions)

- [x] 12. Write property-based tests for search and filtering
  - [x] 12.1 Write property test for full-text search generation
    - **Property 8: Full-Text Search Generation**
    - **Validates: Requirements 1.9, 13.2, 13.5**
    - 🔧 **MCP Servers**: Sequential Thinking (weighted search vector validation), Supabase (insert tools, verify search_vector), Fetch (reference PostgreSQL tsvector documentation)

  - [x] 12.2 Write property test for search relevance ordering
    - **Property 9: Search Relevance Ordering**
    - **Validates: Requirements 13.4**
    - 🔧 **MCP Servers**: Sequential Thinking (relevance scoring logic), Supabase (test ts_rank ordering)

  - [x] 12.3 Write property test for featured tools date filtering
    - **Property 10: Featured Tools Date Filtering**
    - **Validates: Requirements 6.7**
    - 🔧 **MCP Servers**: Supabase (create records with various date ranges, test filtering)

  - [x] 12.4 Write property test for news publication filtering
    - **Property 11: News Publication Filtering**
    - **Validates: Requirements 10.9, 11.3**
    - 🔧 **MCP Servers**: Supabase (test published/unpublished visibility)

- [x] 13. Final checkpoint - Ensure all tests pass
  - Run all property-based tests
  - Verify all requirements are covered
  - Ask the user if questions arise
  - 🔧 **MCP Servers**: Supabase (final schema verification)

## MCP Server Legend

| Server | Purpose |
|--------|---------|
| **Supabase** | Execute SQL, verify database objects, test queries, validate constraints and policies |
| **Sequential Thinking** | Break down complex tasks, design multi-step logic, plan comprehensive test scenarios |
| **Fetch** | Access external documentation (PostgreSQL, Supabase, fast-check) when needed |

## Notes

- All tasks are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Use fast-check library for property-based testing with minimum 100 iterations
- Tests should run against Supabase local development environment
