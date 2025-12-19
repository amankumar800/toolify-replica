# Requirements Document

## Introduction

This document specifies the requirements for migrating the AI Tools Directory application from JSON file-based data storage to a Supabase PostgreSQL database. The migration follows a modular, scalable architecture with a repository pattern, mapper layer, and service layer to ensure maintainability, testability, and LLM-friendly code organization. The architecture prioritizes type safety, error handling, and data integrity.

## Glossary

- **Repository**: A data access layer component that encapsulates database operations for a specific entity
- **Mapper**: A transformation layer that converts between database row types (snake_case) and application types (camelCase)
- **Service**: A business logic layer that orchestrates repository calls and applies business rules
- **RLS (Row Level Security)**: Supabase's security feature that restricts database access at the row level based on policies
- **Migration**: A versioned SQL file that modifies the database schema, applied in chronological order
- **Junction Table**: A database table that implements many-to-many relationships between entities using foreign keys
- **Barrel Export**: An index.ts file that re-exports modules for cleaner imports (e.g., `import { x } from '@/lib/db'`)
- **Service Role Key**: A Supabase key with elevated privileges that bypasses RLS for admin operations
- **Upsert**: An operation that inserts a new record or updates an existing one based on a conflict column
- **DatabaseError**: A custom error type that wraps Supabase errors with additional context

## Requirements

### Requirement 1

**User Story:** As a developer, I want a centralized database constants file, so that I can easily rename tables or columns without searching through the codebase.

#### Acceptance Criteria

1. WHEN a developer needs to reference a table name THEN the Constants_Module SHALL provide a TABLES constant object containing keys: TOOLS, CATEGORIES, CATEGORY_GROUPS, SUBCATEGORIES, TOOL_CATEGORIES, FEATURED_TOOLS, FAQS, USER_FAVORITES
2. WHEN a developer needs to map database columns to application properties THEN the Constants_Module SHALL provide TOOL_COLUMNS, CATEGORY_COLUMNS, and SUBCATEGORY_COLUMNS mapping objects
3. WHEN a table or column is renamed in the database THEN the Constants_Module SHALL be the only file requiring updates for name changes

### Requirement 2

**User Story:** As a developer, I want a base repository with common CRUD operations, so that I can avoid duplicating database access code across entities.

#### Acceptance Criteria

1. WHEN a repository needs to find all records THEN the Base_Repository SHALL provide a findAll method accepting optional parameters: limit (number), offset (number), orderBy (column name), ascending (boolean, default false)
2. WHEN a repository needs to find a record by ID THEN the Base_Repository SHALL provide a findById method that returns a single record or throws DatabaseError if not found
3. WHEN a repository needs to find a record by a specific column THEN the Base_Repository SHALL provide a findBy method that returns the record or null if not found
4. WHEN a repository needs to create a record THEN the Base_Repository SHALL provide a create method that returns the created record with generated ID
5. WHEN a repository needs to update a record THEN the Base_Repository SHALL provide an update method that accepts ID and partial update data, returning the updated record
6. WHEN a repository needs to delete a record THEN the Base_Repository SHALL provide a delete method that accepts an ID and returns void on success
7. WHEN a repository needs to upsert a record THEN the Base_Repository SHALL provide an upsert method with onConflict parameter defaulting to 'id'
8. WHEN a repository needs to count records THEN the Base_Repository SHALL provide a count method returning a number
9. IF a database operation fails THEN the Base_Repository SHALL throw a DatabaseError containing the operation name, table name, and original Supabase error message

### Requirement 3

**User Story:** As a developer, I want entity-specific repositories, so that I can perform specialized queries for each data type.

#### Acceptance Criteria

1. WHEN querying tools THEN the Tools_Repository SHALL provide: findBySlug(slug: string) returning Tool or null, findWithCategories(options) returning tools with joined category names, findByCategory(categorySlug: string, limit: number) returning filtered tools, findFeatured(limit: number) returning featured tools, search(query: string, limit: number) returning matching tools
2. WHEN managing tool-category relationships THEN the Tools_Repository SHALL provide linkToCategory(toolId, categoryId) and unlinkFromCategory(toolId, categoryId) methods that handle junction table operations
3. WHEN bulk importing tools THEN the Tools_Repository SHALL provide a bulkUpsert(tools: ToolInsert[]) method using slug as the conflict column
4. WHEN querying categories THEN the Categories_Repository SHALL provide: findBySlug(slug: string), findWithToolCount() returning categories with computed tool counts, findByGroup(groupId: string) returning categories in a group
5. WHEN querying subcategories THEN the Subcategories_Repository SHALL provide: findByCategory(categoryId: string) returning subcategories ordered by display_order, findWithTools(subcategoryId: string) returning subcategory with its tools
6. WHEN querying FAQs THEN the FAQs_Repository SHALL provide findAllOrdered() returning FAQs sorted by display_order ascending
7. IF a findBySlug or findById operation finds no record THEN the Repository SHALL return null without throwing an error

### Requirement 4

**User Story:** As a developer, I want mapper functions to transform database rows to application types, so that the application code is decoupled from database schema changes.

#### Acceptance Criteria

1. WHEN a database tool row is retrieved THEN the Tool_Mapper SHALL transform snake_case columns (image_url, website_url, short_description, saved_count, review_count, review_score, is_new, is_featured, created_at, updated_at) to camelCase properties
2. WHEN a tool row has null values THEN the Tool_Mapper SHALL apply these defaults: description='', shortDescription='', image='https://placehold.co/600x400', tags=[], savedCount=0, reviewCount=0, reviewScore=0, verified=false, isNew=false, isFeatured=false
3. WHEN a tool is retrieved with joined categories THEN the Tool_Mapper SHALL extract category names from the tool_categories join into a string array
4. WHEN an application tool object needs to be inserted THEN the Tool_Mapper SHALL transform camelCase properties to snake_case columns matching the database schema
5. WHEN a database category row is retrieved THEN the Category_Mapper SHALL transform to application Category type with camelCase properties and default toolCount=0 if null

### Requirement 5

**User Story:** As a developer, I want service layer functions for business logic, so that presentation components don't directly access the database.

#### Acceptance Criteria

1. WHEN the application needs tools THEN the Tools_Service SHALL provide getTools(options?: {category?: string, pricing?: string, search?: string, limit?: number, offset?: number}) returning Promise<Tool[]>
2. WHEN the application needs a single tool THEN the Tools_Service SHALL provide getToolBySlug(slug: string) returning Promise<Tool | null>
3. WHEN the application needs featured tools THEN the Tools_Service SHALL provide getFeaturedTools(limit?: number) returning Promise<Tool[]> with default limit of 10
4. WHEN the application needs to create a tool THEN the Tools_Service SHALL provide createTool(data: CreateToolInput) that validates required fields (name, slug, websiteUrl) and returns Promise<Tool>
5. WHEN the application needs to update a tool THEN the Tools_Service SHALL provide updateTool(id: string, updates: Partial<Tool>) returning Promise<Tool>
6. WHEN the application needs to delete a tool THEN the Tools_Service SHALL provide deleteTool(id: string) returning Promise<void> that also removes tool_categories relationships

### Requirement 6

**User Story:** As a database administrator, I want SQL migrations for all tables, so that schema changes are version-controlled and reproducible.

#### Acceptance Criteria

1. WHEN the tools table is created THEN the Migration SHALL define: id (UUID PRIMARY KEY DEFAULT gen_random_uuid()), name (TEXT NOT NULL), slug (TEXT UNIQUE NOT NULL), description (TEXT), short_description (TEXT), image_url (TEXT), website_url (TEXT NOT NULL), external_url (TEXT), pricing (TEXT CHECK IN ('Free', 'Freemium', 'Paid', 'Free Trial', 'Contact for Pricing') DEFAULT 'Freemium'), tags (TEXT[] DEFAULT '{}'), saved_count (INTEGER DEFAULT 0), review_count (INTEGER DEFAULT 0), review_score (DECIMAL(2,1) DEFAULT 0 CHECK >= 0 AND <= 5), verified (BOOLEAN DEFAULT false), is_new (BOOLEAN DEFAULT false), is_featured (BOOLEAN DEFAULT false), monthly_visits (INTEGER), change_percentage (DECIMAL(5,2)), free_tier_details (TEXT), metadata (JSONB DEFAULT '{}'), created_at (TIMESTAMPTZ DEFAULT NOW()), updated_at (TIMESTAMPTZ DEFAULT NOW())
2. WHEN the categories table is created THEN the Migration SHALL define: id (UUID PRIMARY KEY), name (TEXT NOT NULL), slug (TEXT UNIQUE NOT NULL), description (TEXT), icon (TEXT), tool_count (INTEGER DEFAULT 0), display_order (INTEGER DEFAULT 0), metadata (JSONB DEFAULT '{}'), created_at (TIMESTAMPTZ DEFAULT NOW()), updated_at (TIMESTAMPTZ DEFAULT NOW())
3. WHEN the category_groups table is created THEN the Migration SHALL define: id (UUID PRIMARY KEY), name (TEXT NOT NULL UNIQUE), icon_name (TEXT), display_order (INTEGER DEFAULT 0), created_at (TIMESTAMPTZ DEFAULT NOW()), updated_at (TIMESTAMPTZ DEFAULT NOW())
4. WHEN the subcategories table is created THEN the Migration SHALL define: id (UUID PRIMARY KEY), category_id (UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE), name (TEXT NOT NULL), slug (TEXT UNIQUE NOT NULL), tool_count (INTEGER DEFAULT 0), display_order (INTEGER DEFAULT 0), created_at (TIMESTAMPTZ DEFAULT NOW()), updated_at (TIMESTAMPTZ DEFAULT NOW())
5. WHEN the tool_categories junction table is created THEN the Migration SHALL define: tool_id (UUID REFERENCES tools(id) ON DELETE CASCADE), category_id (UUID REFERENCES categories(id) ON DELETE CASCADE), created_at (TIMESTAMPTZ DEFAULT NOW()), PRIMARY KEY (tool_id, category_id)
6. WHEN the featured_tools table is created THEN the Migration SHALL define: id (UUID PRIMARY KEY), tool_id (UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE), display_order (INTEGER DEFAULT 0), created_at (TIMESTAMPTZ DEFAULT NOW())
7. WHEN the faqs table is created THEN the Migration SHALL define: id (UUID PRIMARY KEY), question (TEXT NOT NULL), answer (TEXT NOT NULL), display_order (INTEGER DEFAULT 0), created_at (TIMESTAMPTZ DEFAULT NOW())
8. WHEN indexes are created THEN the Migration SHALL add indexes: idx_tools_slug, idx_tools_pricing, idx_tools_is_featured, idx_tools_created_at (DESC), idx_categories_slug, idx_categories_display_order, idx_subcategories_category_id, idx_tool_categories_tool, idx_tool_categories_category

### Requirement 7

**User Story:** As a security administrator, I want Row Level Security policies, so that public users can only read data while writes require elevated privileges.

#### Acceptance Criteria

1. WHEN RLS is enabled THEN the Migration SHALL execute ALTER TABLE ... ENABLE ROW LEVEL SECURITY on tables: tools, categories, category_groups, subcategories, tool_categories, featured_tools, faqs
2. WHEN a public user queries data THEN the RLS_Policy SHALL allow SELECT operations using policy "FOR SELECT USING (true)" on all tables
3. WHEN authenticated users manage favorites THEN the RLS_Policy SHALL allow INSERT, UPDATE, DELETE on user_favorites WHERE user_email matches the authenticated user's email
4. WHEN admin write operations are needed THEN the System SHALL use the service role client which bypasses all RLS policies

### Requirement 8

**User Story:** As a developer, I want automatic updated_at timestamps, so that I can track when records were last modified.

#### Acceptance Criteria

1. WHEN the trigger function is created THEN the Migration SHALL create function update_updated_at() that sets NEW.updated_at = NOW() and returns NEW
2. WHEN a record in tools, categories, or subcategories is updated THEN the Database_Trigger SHALL execute BEFORE UPDATE to set updated_at to current timestamp

### Requirement 9

**User Story:** As a developer, I want an admin Supabase client, so that I can perform write operations that bypass RLS.

#### Acceptance Criteria

1. WHEN admin operations are needed THEN the Admin_Client SHALL create a Supabase client using NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
2. WHEN the admin client is created THEN the System SHALL configure auth options: autoRefreshToken=false, persistSession=false
3. IF SUPABASE_SERVICE_ROLE_KEY is missing THEN the Admin_Client SHALL throw Error('Missing Supabase admin credentials: SUPABASE_SERVICE_ROLE_KEY')
4. WHEN the admin client module is imported THEN the Module SHALL include a JSDoc warning that it must only be used server-side

### Requirement 10

**User Story:** As a data engineer, I want a migration script to transfer JSON data to Supabase, so that existing data is preserved during the migration.

#### Acceptance Criteria

1. WHEN migrating tools THEN the Migration_Script SHALL read from src/data/mock-db.json, transform each tool using the mapper, and upsert to tools table with slug as conflict column
2. WHEN migrating categories THEN the Migration_Script SHALL read from src/data/free-ai-tools/categories.json and upsert to categories table with slug as conflict column
3. WHEN migrating category groups THEN the Migration_Script SHALL read categoryGroups from mock-db.json, create groups, and establish group-category relationships
4. WHEN migrating FAQs THEN the Migration_Script SHALL read from src/data/free-ai-tools/faq.json and insert with sequential display_order starting at 0
5. WHEN migrating scraped tools THEN the Migration_Script SHALL read from src/data/free-ai-tools/categories/*.json files and create tool-category-subcategory relationships
6. WHEN the migration completes THEN the Migration_Script SHALL log counts: total tools migrated, total categories migrated, total FAQs migrated, total errors encountered
7. IF a single record migration fails THEN the Migration_Script SHALL log the error with record identifier and continue processing remaining records
8. WHEN the migration script runs multiple times THEN the Script SHALL be idempotent, producing the same result without duplicating data

### Requirement 11

**User Story:** As a developer, I want barrel exports for all layers, so that imports are clean and consistent.

#### Acceptance Criteria

1. WHEN importing repositories THEN the Developer SHALL use import path '@/lib/db/repositories' which exports: createBaseRepository, createToolsRepository, createCategoriesRepository, createSubcategoriesRepository, createFaqsRepository, createFeaturedToolsRepository
2. WHEN importing mappers THEN the Developer SHALL use import path '@/lib/db/mappers' which exports: mapToolRowToTool, mapToolWithCategories, mapToolToInsert, mapCategoryRowToCategory
3. WHEN importing services THEN the Developer SHALL use import path '@/lib/services' which exports: getTools, getToolBySlug, getFeaturedTools, createTool, updateTool, deleteTool, getCategories, getCategoryBySlug
4. WHEN importing database layer THEN the Developer SHALL use import path '@/lib/db' which re-exports repositories, mappers, and constants

### Requirement 12

**User Story:** As a developer, I want the scraper to write directly to Supabase, so that scraped data is immediately available in the database.

#### Acceptance Criteria

1. WHEN the scraper runs THEN the Scraper SHALL upsert categories to the categories table using slug as conflict column
2. WHEN the scraper processes tools THEN the Scraper SHALL upsert tools with metadata JSONB containing: source='scraper', scraped_at=ISO timestamp
3. WHEN the scraper creates tool-category relationships THEN the Scraper SHALL upsert to tool_categories junction table using (tool_id, category_id) as conflict
4. WHEN the scraper processes FAQs THEN the Scraper SHALL upsert FAQs preserving display_order from source
5. IF a scraper database operation fails THEN the Scraper SHALL log the error and continue processing remaining items

### Requirement 13

**User Story:** As a developer, I want auto-generated TypeScript types from the database schema, so that I have compile-time type safety for all database operations.

#### Acceptance Criteria

1. WHEN the database schema changes THEN the Developer SHALL regenerate types using command: npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/types.ts
2. WHEN types are generated THEN the Types_File SHALL export: Database type, Tables helper type, TablesInsert helper type, TablesUpdate helper type
3. WHEN repositories use Supabase client THEN the Repository SHALL pass Database type as generic parameter to createClient<Database>()

### Requirement 14

**User Story:** As a developer, I want custom error types for database operations, so that I can handle different failure modes appropriately.

#### Acceptance Criteria

1. WHEN a database operation fails THEN the System SHALL throw DatabaseError containing: operation (string), table (string), message (string), originalError (unknown)
2. WHEN a required record is not found THEN the System SHALL throw NotFoundError containing: entity (string), identifier (string)
3. WHEN input validation fails THEN the System SHALL throw ValidationError containing: field (string), message (string)
4. WHEN error types are defined THEN the Error_Module SHALL export: DatabaseError, NotFoundError, ValidationError classes extending Error

### Requirement 15

**User Story:** As a data engineer, I want proper data integrity constraints, so that the database prevents invalid data from being stored.

#### Acceptance Criteria

1. WHEN foreign keys are defined THEN the Migration SHALL use ON DELETE CASCADE for: tool_categories.tool_id, tool_categories.category_id, subcategories.category_id, featured_tools.tool_id
2. WHEN unique constraints are defined THEN the Migration SHALL enforce uniqueness on: tools.slug, categories.slug, subcategories.slug, category_groups.name
3. WHEN check constraints are defined THEN the Migration SHALL enforce: tools.pricing IN valid values, tools.review_score BETWEEN 0 AND 5, tools.saved_count >= 0, tools.review_count >= 0
4. WHEN NOT NULL constraints are defined THEN the Migration SHALL require: tools.name, tools.slug, tools.website_url, categories.name, categories.slug, faqs.question, faqs.answer
