# Implementation Plan

## MCP Server Usage Guide
- **🗄️ Supabase MCP**: Use for all database operations - creating tables, applying migrations, verifying schema, testing queries
- **🧠 Sequential Thinking MCP**: Use for complex multi-step tasks requiring careful reasoning and planning
- **🌐 Fetch MCP**: Use for web research - Supabase documentation, best practices, API references

---

- [x] 1. Set up Supabase infrastructure and database schema




  - [x] 1.1 Initialize Supabase CLI and create migration files structure

    - Run `npx supabase init` to create supabase directory
    - Create migrations folder structure
    - 🌐 **Fetch MCP**: Research latest Supabase CLI setup from https://supabase.com/docs/guides/cli
    - 🗄️ **Supabase MCP**: Verify project connection and list existing tables
    - _Requirements: 6.1-6.8_


  - [x] 1.2 Create tools table migration
    - Define all columns: id, name, slug, description, short_description, image_url, website_url, external_url, pricing, tags, saved_count, review_count, review_score, verified, is_new, is_featured, monthly_visits, change_percentage, free_tier_details, metadata, created_at, updated_at
    - Add CHECK constraints for pricing values and review_score range
    - Add UNIQUE constraint on slug
    - 🧠 **Sequential Thinking MCP**: Plan column types, constraints, and defaults carefully
    - 🗄️ **Supabase MCP**: Execute migration and verify table structure
    - _Requirements: 6.1, 15.2, 15.3, 15.4_
  - [x] 1.3 Create categories and category_groups tables migration
    - Define categories table with id, name, slug, description, icon, tool_count, display_order, metadata, created_at, updated_at
    - Define category_groups table with id, name, icon_name, display_order, created_at, updated_at
    - Add UNIQUE constraints on slugs and category_groups.name
    - 🗄️ **Supabase MCP**: Execute migration and verify both tables created correctly
    - _Requirements: 6.2, 6.3, 15.2, 15.4_
  - [x] 1.4 Create subcategories table migration

    - Define subcategories with foreign key to categories
    - Add ON DELETE CASCADE for category_id
    - 🗄️ **Supabase MCP**: Execute migration and verify foreign key relationship
    - _Requirements: 6.4, 15.1_

  - [x] 1.5 Create junction and supporting tables migration

    - Create tool_categories junction table with composite primary key
    - Create featured_tools table with foreign key to tools
    - Create faqs table
    - Create user_favorites table
    - Add ON DELETE CASCADE for all foreign keys
    - 🧠 **Sequential Thinking MCP**: Plan junction table design and cascade behavior
    - 🗄️ **Supabase MCP**: Execute migration and verify all tables and relationships
    - _Requirements: 6.5, 6.6, 6.7, 15.1_

  - [x] 1.6 Create indexes migration

    - Add indexes: idx_tools_slug, idx_tools_pricing, idx_tools_is_featured, idx_tools_created_at, idx_categories_slug, idx_categories_display_order, idx_subcategories_category_id, idx_tool_categories_tool, idx_tool_categories_category
    - 🌐 **Fetch MCP**: Research PostgreSQL indexing best practices from https://supabase.com/docs/guides/database/postgres/indexes
    - 🗄️ **Supabase MCP**: Execute migration and verify indexes created
    - _Requirements: 6.8_

  - [x] 1.7 Create RLS policies migration

    - Enable RLS on all tables
    - Create public read policies for content tables
    - Create user-specific policies for user_favorites
    - 🌐 **Fetch MCP**: Research RLS best practices from https://supabase.com/docs/guides/auth/row-level-security
    - 🧠 **Sequential Thinking MCP**: Plan security policies for each table carefully
    - 🗄️ **Supabase MCP**: Execute migration and verify RLS is enabled on all tables
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 1.8 Create triggers migration

    - Create update_updated_at() function
    - Add BEFORE UPDATE triggers on tools, categories, subcategories
    - 🗄️ **Supabase MCP**: Execute migration and test trigger by updating a record
    - _Requirements: 8.1, 8.2_

  - [x] 1.9 Write property test for check constraints

    - **Property 18: Check constraints enforce valid ranges**
    - 🗄️ **Supabase MCP**: Test constraint by attempting invalid inserts
    - **Validates: Requirements 15.3**

  - [x] 1.10 Write property test for unique constraints

    - **Property 17: Unique constraints prevent duplicates**
    - 🗄️ **Supabase MCP**: Test constraint by attempting duplicate slug inserts
    - **Validates: Requirements 15.2**

- [x] 2. Create constants and error types modules





  - [x] 2.1 Create database constants module


    - Create `src/lib/db/constants/tables.ts` with TABLES constant
    - Create `src/lib/db/constants/columns.ts` with TOOL_COLUMNS, CATEGORY_COLUMNS, SUBCATEGORY_COLUMNS
    - Create barrel export `src/lib/db/constants/index.ts`
    - 🗄️ **Supabase MCP**: Query table schemas to ensure constants match actual database columns
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Create error types module

    - Create `src/lib/db/errors.ts` with DatabaseError, NotFoundError, ValidationError classes
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [x] 2.3 Write unit tests for error types

    - Test DatabaseError contains operation, table, message, originalError
    - Test NotFoundError contains entity, identifier
    - Test ValidationError contains field, message
    - _Requirements: 14.1, 14.2, 14.3_

- [x] 3. Create admin Supabase client





  - [x] 3.1 Implement admin client


    - Create `src/lib/supabase/admin.ts` with createAdminClient function
    - Use SUPABASE_SERVICE_ROLE_KEY environment variable
    - Configure auth options: autoRefreshToken=false, persistSession=false
    - Add JSDoc warning about server-side only usage
    - Throw error if service role key is missing
    - 🌐 **Fetch MCP**: Research service role client setup from https://supabase.com/docs/reference/javascript/initializing
    - 🗄️ **Supabase MCP**: Verify admin client can bypass RLS by testing a write operation
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 3.2 Write unit tests for admin client

    - Test client creation with valid credentials
    - Test error thrown when service role key missing
    - _Requirements: 9.3_

- [x] 4. Checkpoint - Ensure infrastructure is ready





  - Ensure all tests pass, ask the user if questions arise.
  - 🗄️ **Supabase MCP**: List all tables and verify schema matches design document

- [x] 5. Create base repository




  - [x] 5.1 Implement base repository with CRUD operations

    - Create `src/lib/db/repositories/base.repository.ts`
    - Implement findAll with limit, offset, orderBy, ascending options
    - Implement findById, findBy, create, update, delete, upsert, count methods
    - Wrap Supabase errors in DatabaseError
    - 🧠 **Sequential Thinking MCP**: Design generic repository pattern with proper TypeScript generics
    - 🌐 **Fetch MCP**: Research Supabase query builder patterns from https://supabase.com/docs/reference/javascript/select
    - 🗄️ **Supabase MCP**: Test each CRUD operation against the tools table
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_
  - [x] 5.2 Write property test for findAll limit constraint








    - **Property 1: Repository findAll respects limit constraint**
    - 🗄️ **Supabase MCP**: Insert test data and verify limit behavior
    - **Validates: Requirements 2.1**
  - [x] 5.3 Write property test for CRUD round-trip
    - **Property 2: Repository CRUD round-trip consistency**
    - 🗄️ **Supabase MCP**: Create, read, verify data matches
    - **Validates: Requirements 2.2, 2.4**
  - [x] 5.4 Write property test for findBy
    - **Property 3: Repository findBy returns correct match or null**
    - 🗄️ **Supabase MCP**: Test findBy with existing and non-existing values
    - **Validates: Requirements 2.3, 3.7**
  - [x] 5.5 Write property test for update preserves fields
    - **Property 4: Repository update preserves unmodified fields**
    - 🗄️ **Supabase MCP**: Update partial fields and verify others unchanged
    - **Validates: Requirements 2.5**
  - [x] 5.6 Write property test for delete
    - **Property 5: Repository delete removes record**
    - 🗄️ **Supabase MCP**: Delete record and verify it's gone
    - **Validates: Requirements 2.6**
  - [x] 5.7 Write property test for upsert idempotency
    - **Property 6: Repository upsert is idempotent**
    - 🗄️ **Supabase MCP**: Upsert same data twice and verify single record
    - **Validates: Requirements 2.7, 10.8**
  - [x] 5.8 Write property test for count
    - **Property 7: Repository count reflects actual records**
    - 🗄️ **Supabase MCP**: Compare count() result with actual table count
    - **Validates: Requirements 2.8**

- [x] 6. Create entity repositories
  - [x] 6.1 Implement tools repository
    - Create `src/lib/db/repositories/tools.repository.ts`
    - Implement findBySlug, findWithCategories, findByCategory, findFeatured, search
    - Implement linkToCategory, unlinkFromCategory, bulkUpsert
    - 🧠 **Sequential Thinking MCP**: Plan complex join queries for findWithCategories
    - 🗄️ **Supabase MCP**: Test each method with real database queries
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 6.2 Write property test for tool-category linking
    - **Property 8: Tool-category link/unlink consistency**
    - 🗄️ **Supabase MCP**: Link tool to category, verify in junction table, unlink, verify removed
    - **Validates: Requirements 3.2**
  - [x] 6.3 Write property test for bulkUpsert
    - **Property 9: BulkUpsert returns correct count**
    - 🗄️ **Supabase MCP**: Bulk upsert multiple tools and verify count
    - **Validates: Requirements 3.3**
  - [x] 6.4 Implement categories repository
    - Create `src/lib/db/repositories/categories.repository.ts`
    - Implement findBySlug, findWithToolCount, findByGroup
    - 🗄️ **Supabase MCP**: Test queries and verify tool count aggregation
    - _Requirements: 3.4_
  - [x] 6.5 Implement subcategories repository
    - Create `src/lib/db/repositories/subcategories.repository.ts`
    - Implement findByCategory (ordered by display_order), findWithTools
    - 🗄️ **Supabase MCP**: Test ordering and verify results sorted correctly
    - _Requirements: 3.5_
  - [x] 6.6 Write property test for subcategories ordering
    - **Property 10: Subcategories ordered by display_order**
    - 🗄️ **Supabase MCP**: Insert subcategories with various display_orders and verify sort
    - **Validates: Requirements 3.5**
  - [x] 6.7 Implement FAQs repository
    - Create `src/lib/db/repositories/faqs.repository.ts`
    - Implement findAllOrdered (sorted by display_order ascending)
    - 🗄️ **Supabase MCP**: Test ordering query
    - _Requirements: 3.6_
  - [x] 6.8 Write property test for FAQs ordering
    - **Property 11: FAQs ordered by display_order**
    - 🗄️ **Supabase MCP**: Insert FAQs with various display_orders and verify sort
    - **Validates: Requirements 3.6**
  - [x] 6.9 Implement featured tools repository
    - Create `src/lib/db/repositories/featured-tools.repository.ts`
    - Implement findAllWithTools, reorder
    - 🗄️ **Supabase MCP**: Test join query and reorder functionality
    - _Requirements: 3.1_
  - [x] 6.10 Create repositories barrel export
    - Create `src/lib/db/repositories/index.ts`
    - Export all repository factory functions
    - _Requirements: 11.1_

- [x] 7. Checkpoint - Ensure repositories work correctly
  - Ensure all tests pass, ask the user if questions arise.
  - 🗄️ **Supabase MCP**: Run sample queries through each repository to verify functionality

- [x] 8. Create mappers
  - [x] 8.1 Implement tool mapper
    - Create `src/lib/db/mappers/tool.mapper.ts`
    - Implement mapToolRowToTool with snake_case to camelCase transformation
    - Implement mapToolWithCategories for joined queries
    - Implement mapToolToInsert for camelCase to snake_case
    - Define TOOL_DEFAULTS constant
    - 🧠 **Sequential Thinking MCP**: Plan transformation logic and default value handling
    - 🗄️ **Supabase MCP**: Query a tool row to verify mapper produces correct output
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 8.2 Write property test for snake_case transformation
    - **Property 12: Mapper snake_case to camelCase transformation**
    - **Validates: Requirements 4.1, 4.5**
  - [x] 8.3 Write property test for default values
    - **Property 13: Mapper applies defaults for null values**
    - 🗄️ **Supabase MCP**: Insert row with nulls and verify mapper applies defaults
    - **Validates: Requirements 4.2**
  - [x] 8.4 Write property test for mapper round-trip
    - **Property 14: Mapper round-trip preserves data**
    - 🗄️ **Supabase MCP**: Insert via mapper, retrieve, map back, compare
    - **Validates: Requirements 4.4**
  - [x] 8.5 Implement category mapper
    - Create `src/lib/db/mappers/category.mapper.ts`
    - Implement mapCategoryRowToCategory, mapCategoryWithToolCount, mapCategoryToInsert
    - Define CATEGORY_DEFAULTS constant
    - 🗄️ **Supabase MCP**: Query category row to verify mapper output
    - _Requirements: 4.5_
  - [x] 8.6 Implement subcategory mapper
    - Create `src/lib/db/mappers/subcategory.mapper.ts`
    - Implement mapSubcategoryRowToSubcategory, mapSubcategoryToInsert
    - Define SUBCATEGORY_DEFAULTS constant
    - 🗄️ **Supabase MCP**: Query subcategory row to verify mapper output
    - _Requirements: 4.5_
  - [x] 8.7 Create mappers barrel export
    - Create `src/lib/db/mappers/index.ts`
    - Export all mapper functions
    - _Requirements: 11.2_

- [x] 9. Create database layer barrel export
  - [x] 9.1 Create main db barrel export
    - Create `src/lib/db/index.ts`
    - Re-export repositories, mappers, constants, errors
    - _Requirements: 11.4_

- [x] 10. Create service layer
  - [x] 10.1 Update tools service to use repository
    - Update `src/lib/services/tools.service.ts`
    - Implement getTools with category, pricing, search, limit, offset options
    - Implement getToolBySlug, getFeaturedTools (default limit 10), createTool, updateTool, deleteTool
    - Validate required fields in createTool (name, slug, websiteUrl)
    - Handle tool_categories cleanup in deleteTool
    - 🧠 **Sequential Thinking MCP**: Plan service layer error handling and validation logic
    - 🗄️ **Supabase MCP**: Test each service method with real database operations
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [x] 10.2 Create categories service
    - Create `src/lib/services/categories.service.ts`
    - Implement getCategories, getCategoryBySlug, getCategoryGroups, getSubcategories, getFaqs
    - 🗄️ **Supabase MCP**: Test each service method with real database queries
    - _Requirements: 5.1, 5.2_
  - [x] 10.3 Update services barrel export
    - Update `src/lib/services/index.ts`
    - Export all service functions
    - _Requirements: 11.3_
  - [x] 10.4 Write property test for updated_at trigger
    - **Property 15: Updated_at trigger updates timestamp**
    - 🗄️ **Supabase MCP**: Update record and verify updated_at changed
    - **Validates: Requirements 8.2**
  - [x] 10.5 Write property test for cascade delete
    - **Property 16: Foreign key cascade deletes related records**
    - 🗄️ **Supabase MCP**: Delete tool with categories, verify junction records removed
    - **Validates: Requirements 15.1**

- [x] 11. Checkpoint - Ensure service layer works correctly
  - Ensure all tests pass, ask the user if questions arise.
  - 🗄️ **Supabase MCP**: Verify data integrity after service layer operations

- [x] 12. Create data migration script
  - [x] 12.1 Implement JSON to Supabase migration script
    - Create `scripts/db/migrate-json-to-supabase.ts`
    - Read tools from src/data/mock-db.json and upsert with slug conflict
    - Read categories from src/data/free-ai-tools/categories.json
    - Read category groups from mock-db.json
    - Read FAQs from src/data/free-ai-tools/faq.json with sequential display_order
    - Read scraped tools from src/data/free-ai-tools/categories/*.json
    - Log migration counts and errors
    - Continue processing on individual record failures
    - Ensure idempotency
    - 🧠 **Sequential Thinking MCP**: Plan migration order to handle foreign key dependencies
    - 🗄️ **Supabase MCP**: Execute migration and verify data counts match source files
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_
  - [x] 12.2 Create migration scripts barrel export
    - Create `scripts/db/index.ts`
    - _Requirements: 10.1_

- [x] 13. Update scraper for Supabase integration
  - [x] 13.1 Create scraper database service
    - Create `scripts/lib/scraper-db.service.ts`
    - Implement upsertCategories, upsertTools, upsertToolCategories, upsertFaqs
    - Add metadata with source='scraper' and scraped_at timestamp
    - Handle errors gracefully and continue processing
    - 🧠 **Sequential Thinking MCP**: Plan error handling and retry logic
    - 🗄️ **Supabase MCP**: Test upsert operations and verify metadata stored correctly
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  - [x] 13.2 Write property test for scraper metadata
    - **Property 19: Scraper metadata contains required fields**
    - 🗄️ **Supabase MCP**: Query tool metadata and verify source and scraped_at fields
    - **Validates: Requirements 12.2**
  - [x] 13.3 Write property test for scraper error resilience
    - **Property 20: Scraper continues on individual failures**
    - 🗄️ **Supabase MCP**: Simulate partial failures and verify successful records persisted
    - **Validates: Requirements 12.5**
  - [x] 13.4 Update scraper to use database service
    - Update `scripts/scrape-free-ai-tools.ts` to use ScraperDbService
    - Replace JSON file writes with database upserts
    - 🗄️ **Supabase MCP**: Run scraper and verify data appears in database
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 14. Generate TypeScript types from database
  - [x] 14.1 Generate and update Supabase types
    - Run `npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/types.ts`
    - Verify Database, Tables, TablesInsert, TablesUpdate types are exported
    - Update repository type parameters to use generated types
    - 🌐 **Fetch MCP**: Research type generation from https://supabase.com/docs/guides/api/rest/generating-types
    - 🗄️ **Supabase MCP**: Verify generated types match actual schema
    - _Requirements: 13.1, 13.2, 13.3_

- [x] 15. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - 🗄️ **Supabase MCP**: Final verification - list all tables, count records, verify relationships
