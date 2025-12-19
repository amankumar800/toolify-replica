# Design Document: Supabase Migration

## Overview

This design document outlines the architecture and implementation details for migrating the AI Tools Directory from JSON file-based storage to Supabase PostgreSQL. The architecture follows a layered approach with clear separation of concerns:

1. **Constants Layer** - Centralized table/column naming
2. **Repository Layer** - Data access with generic and entity-specific operations
3. **Mapper Layer** - Type transformations between DB and application types
4. **Service Layer** - Business logic orchestration
5. **Error Handling** - Custom error types for different failure modes

The design prioritizes modularity, type safety, and maintainability for LLM-assisted development.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│  (React Components, Server Components, API Routes)              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                            │
│  src/lib/services/                                              │
│  ├── tools.service.ts      (business logic for tools)          │
│  ├── categories.service.ts (business logic for categories)     │
│  ├── admin.service.ts      (admin operations)                  │
│  └── index.ts              (barrel export)                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       REPOSITORY LAYER                           │
│  src/lib/db/repositories/                                       │
│  ├── base.repository.ts    (shared CRUD methods)               │
│  ├── tools.repository.ts   (tool-specific queries)             │
│  ├── categories.repository.ts                                   │
│  ├── subcategories.repository.ts                                │
│  ├── faqs.repository.ts                                         │
│  ├── featured-tools.repository.ts                               │
│  └── index.ts              (barrel export)                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MAPPER LAYER                             │
│  src/lib/db/mappers/                                            │
│  ├── tool.mapper.ts        (DB row → App type)                 │
│  ├── category.mapper.ts                                         │
│  └── index.ts                                                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE CLIENT                             │
│  src/lib/supabase/                                              │
│  ├── client.ts             (browser client)                     │
│  ├── server.ts             (server client)                      │
│  ├── admin.ts              (service role client)               │
│  └── types.ts              (auto-generated DB types)           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                           │
│  supabase/migrations/      (version-controlled schema)          │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Constants Module

**File: `src/lib/db/constants/tables.ts`**

```typescript
export const TABLES = {
  TOOLS: 'tools',
  CATEGORIES: 'categories',
  CATEGORY_GROUPS: 'category_groups',
  SUBCATEGORIES: 'subcategories',
  TOOL_CATEGORIES: 'tool_categories',
  FEATURED_TOOLS: 'featured_tools',
  FAQS: 'faqs',
  USER_FAVORITES: 'user_favorites',
} as const;

export type TableName = typeof TABLES[keyof typeof TABLES];
```

**File: `src/lib/db/constants/columns.ts`**

Column mapping constants enable single-point updates when database columns are renamed.

```typescript
/** Maps application property names to database column names for tools table */
export const TOOL_COLUMNS = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  shortDescription: 'short_description',
  image: 'image_url',
  websiteUrl: 'website_url',
  externalUrl: 'external_url',
  pricing: 'pricing',
  tags: 'tags',
  savedCount: 'saved_count',
  reviewCount: 'review_count',
  reviewScore: 'review_score',
  verified: 'verified',
  isNew: 'is_new',
  isFeatured: 'is_featured',
  monthlyVisits: 'monthly_visits',
  changePercentage: 'change_percentage',
  freeTierDetails: 'free_tier_details',
  metadata: 'metadata',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
} as const;

/** Maps application property names to database column names for categories table */
export const CATEGORY_COLUMNS = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  icon: 'icon',
  toolCount: 'tool_count',
  displayOrder: 'display_order',
  metadata: 'metadata',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
} as const;

/** Maps application property names to database column names for subcategories table */
export const SUBCATEGORY_COLUMNS = {
  id: 'id',
  categoryId: 'category_id',
  name: 'name',
  slug: 'slug',
  toolCount: 'tool_count',
  displayOrder: 'display_order',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
} as const;
```

### 2. Error Types Module

**File: `src/lib/db/errors.ts`**

```typescript
export class DatabaseError extends Error {
  constructor(
    public operation: string,
    public table: string,
    message: string,
    public originalError?: unknown
  ) {
    super(`Database error in ${operation} on ${table}: ${message}`);
    this.name = 'DatabaseError';
  }
}

export class NotFoundError extends Error {
  constructor(public entity: string, public identifier: string) {
    super(`${entity} not found: ${identifier}`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(`Validation error on ${field}: ${message}`);
    this.name = 'ValidationError';
  }
}
```

### 3. Base Repository Interface

**File: `src/lib/db/repositories/base.repository.ts`**

```typescript
export interface FindAllOptions<T> {
  limit?: number;
  offset?: number;
  orderBy?: keyof T;
  ascending?: boolean;
}

export interface BaseRepository<Row, Insert, Update> {
  findAll(options?: FindAllOptions<Row>): Promise<Row[]>;
  findById(id: string): Promise<Row>;
  findBy<K extends keyof Row>(column: K, value: Row[K]): Promise<Row | null>;
  create(data: Insert): Promise<Row>;
  update(id: string, data: Update): Promise<Row>;
  delete(id: string): Promise<void>;
  upsert(data: Insert, onConflict?: string): Promise<Row>;
  count(): Promise<number>;
}
```

### 4. Entity Repository Interfaces

**File: `src/lib/db/repositories/tools.repository.ts`**

```typescript
export interface ToolsRepository extends BaseRepository<ToolRow, ToolInsert, ToolUpdate> {
  findBySlug(slug: string): Promise<ToolRow | null>;
  findWithCategories(options?: FindAllOptions<ToolRow>): Promise<ToolWithCategories[]>;
  findByCategory(categorySlug: string, limit?: number): Promise<ToolRow[]>;
  findFeatured(limit?: number): Promise<ToolRow[]>;
  search(query: string, limit?: number): Promise<ToolRow[]>;
  linkToCategory(toolId: string, categoryId: string): Promise<void>;
  unlinkFromCategory(toolId: string, categoryId: string): Promise<void>;
  bulkUpsert(tools: ToolInsert[]): Promise<ToolRow[]>;
}
```

**File: `src/lib/db/repositories/categories.repository.ts`**

```typescript
export interface CategoriesRepository extends BaseRepository<CategoryRow, CategoryInsert, CategoryUpdate> {
  findBySlug(slug: string): Promise<CategoryRow | null>;
  findWithToolCount(): Promise<CategoryWithToolCount[]>;
  findByGroup(groupId: string): Promise<CategoryRow[]>;
}
```

**File: `src/lib/db/repositories/subcategories.repository.ts`**

```typescript
export interface SubcategoriesRepository extends BaseRepository<SubcategoryRow, SubcategoryInsert, SubcategoryUpdate> {
  findByCategory(categoryId: string): Promise<SubcategoryRow[]>;
  findWithTools(subcategoryId: string): Promise<SubcategoryWithTools>;
}
```

**File: `src/lib/db/repositories/faqs.repository.ts`**

```typescript
export interface FaqsRepository extends BaseRepository<FaqRow, FaqInsert, FaqUpdate> {
  findAllOrdered(): Promise<FaqRow[]>;
}
```

**File: `src/lib/db/repositories/featured-tools.repository.ts`**

```typescript
export interface FeaturedToolsRepository extends BaseRepository<FeaturedToolRow, FeaturedToolInsert, FeaturedToolUpdate> {
  findAllWithTools(): Promise<FeaturedToolWithTool[]>;
  reorder(toolIds: string[]): Promise<void>;
}
```

### 5. Mapper Interfaces

**File: `src/lib/db/mappers/tool.mapper.ts`**

```typescript
// DB Row → Application Type
export function mapToolRowToTool(row: ToolRow): Tool;

// DB Row with joins → Application Type
export function mapToolWithCategories(row: ToolWithCategories): Tool;

// Application Type → DB Insert
export function mapToolToInsert(tool: Omit<Tool, 'id' | 'dateAdded'>): ToolInsert;

/** Default values applied when database columns are null */
export const TOOL_DEFAULTS = {
  description: '',
  shortDescription: '',
  image: 'https://placehold.co/600x400',
  tags: [] as string[],
  savedCount: 0,
  reviewCount: 0,
  reviewScore: 0,
  verified: false,
  isNew: false,
  isFeatured: false,
} as const;
```

**File: `src/lib/db/mappers/category.mapper.ts`**

```typescript
// DB Row → Application Type
export function mapCategoryRowToCategory(row: CategoryRow): Category;

// DB Row with tool count → Application Type
export function mapCategoryWithToolCount(row: CategoryWithToolCount): Category;

// Application Type → DB Insert
export function mapCategoryToInsert(category: Omit<Category, 'id'>): CategoryInsert;

/** Default values applied when database columns are null */
export const CATEGORY_DEFAULTS = {
  description: '',
  icon: '',
  toolCount: 0,
  displayOrder: 0,
} as const;
```

**File: `src/lib/db/mappers/subcategory.mapper.ts`**

```typescript
// DB Row → Application Type
export function mapSubcategoryRowToSubcategory(row: SubcategoryRow): Subcategory;

// Application Type → DB Insert
export function mapSubcategoryToInsert(subcategory: Omit<Subcategory, 'id'>): SubcategoryInsert;

/** Default values applied when database columns are null */
export const SUBCATEGORY_DEFAULTS = {
  toolCount: 0,
  displayOrder: 0,
} as const;
```

### 6. Service Interfaces

**File: `src/lib/services/tools.service.ts`**

```typescript
export interface GetToolsOptions {
  category?: string;
  pricing?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getTools(options?: GetToolsOptions): Promise<Tool[]>;
export async function getToolBySlug(slug: string): Promise<Tool | null>;
export async function getFeaturedTools(limit?: number): Promise<Tool[]>;
export async function createTool(data: CreateToolInput): Promise<Tool>;
export async function updateTool(id: string, updates: Partial<Tool>): Promise<Tool>;
export async function deleteTool(id: string): Promise<void>;
```

**File: `src/lib/services/categories.service.ts`**

```typescript
export interface GetCategoriesOptions {
  groupId?: string;
  withToolCount?: boolean;
  limit?: number;
  offset?: number;
}

export async function getCategories(options?: GetCategoriesOptions): Promise<Category[]>;
export async function getCategoryBySlug(slug: string): Promise<Category | null>;
export async function getCategoryGroups(): Promise<CategoryGroup[]>;
export async function getSubcategories(categoryId: string): Promise<Subcategory[]>;
export async function getFaqs(): Promise<FAQ[]>;
```

### 7. Admin Client

**File: `src/lib/supabase/admin.ts`**

```typescript
/**
 * Creates a Supabase client with SERVICE ROLE key.
 * WARNING: Only use server-side! Bypasses all RLS policies.
 */
export function createAdminClient(): SupabaseClient<Database>;
```

## Data Models

### Database Schema (ERD)

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      tools       │     │  tool_categories │     │   categories     │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)          │────<│ tool_id (FK)     │>────│ id (PK)          │
│ name             │     │ category_id (FK) │     │ name             │
│ slug (UNIQUE)    │     │ created_at       │     │ slug (UNIQUE)    │
│ description      │     └──────────────────┘     │ description      │
│ short_description│                              │ icon             │
│ image_url        │                              │ tool_count       │
│ website_url      │                              │ display_order    │
│ external_url     │                              │ metadata         │
│ pricing          │                              │ created_at       │
│ tags[]           │                              │ updated_at       │
│ saved_count      │                              └────────┬─────────┘
│ review_count     │                                       │
│ review_score     │                                       │
│ verified         │     ┌──────────────────┐              │
│ is_new           │     │  subcategories   │              │
│ is_featured      │     ├──────────────────┤              │
│ monthly_visits   │     │ id (PK)          │<─────────────┘
│ change_percentage│     │ category_id (FK) │
│ free_tier_details│     │ name             │
│ metadata         │     │ slug (UNIQUE)    │
│ created_at       │     │ tool_count       │
│ updated_at       │     │ display_order    │
└──────────────────┘     │ created_at       │
                         │ updated_at       │
┌──────────────────┐     └──────────────────┘
│ category_groups  │
├──────────────────┤     ┌──────────────────┐
│ id (PK)          │     │  featured_tools  │
│ name (UNIQUE)    │     ├──────────────────┤
│ icon_name        │     │ id (PK)          │
│ display_order    │     │ tool_id (FK)     │───> tools.id
│ created_at       │     │ display_order    │
│ updated_at       │     │ created_at       │
└──────────────────┘     └──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│      faqs        │     │  user_favorites  │
├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │
│ question         │     │ user_email       │
│ answer           │     │ tool_id          │
│ display_order    │     │ tool_name        │
│ created_at       │     │ category_id      │
└──────────────────┘     │ created_at       │
                         └──────────────────┘
```

### Application Types

**File: `src/lib/types/tool.ts`**

```typescript
export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  image: string;
  websiteUrl: string;
  externalUrl?: string;
  pricing: 'Free' | 'Freemium' | 'Paid' | 'Free Trial' | 'Contact for Pricing';
  categories: string[];
  tags: string[];
  savedCount: number;
  reviewCount: number;
  reviewScore: number;
  verified: boolean;
  isNew: boolean;
  isFeatured: boolean;
  dateAdded?: string;
  monthlyVisits?: number;
  changePercentage?: number;
  freeTierDetails?: string;
}

export interface CreateToolInput {
  name: string;
  slug: string;
  websiteUrl: string;
  description?: string;
  shortDescription?: string;
  image?: string;
  pricing?: Tool['pricing'];
  tags?: string[];
  categoryIds?: string[];
}
```

**File: `src/lib/types/category.ts`**

```typescript
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  toolCount: number;
  displayOrder: number;
}

export interface CategoryGroup {
  id: string;
  name: string;
  iconName?: string;
  displayOrder: number;
  categories: Category[];
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  toolCount: number;
  displayOrder: number;
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following properties have been identified. Redundant properties have been consolidated where one property subsumes another.

### Property 1: Repository findAll respects limit constraint
*For any* repository and any limit value N > 0, calling findAll({ limit: N }) SHALL return an array with length <= N.
**Validates: Requirements 2.1**

### Property 2: Repository CRUD round-trip consistency
*For any* valid insert data, creating a record and then finding it by ID SHALL return a record with matching data fields.
**Validates: Requirements 2.2, 2.4**

### Property 3: Repository findBy returns correct match or null
*For any* column and value, findBy(column, value) SHALL return a record where record[column] === value, or null if no match exists.
**Validates: Requirements 2.3, 3.7**

### Property 4: Repository update preserves unmodified fields
*For any* existing record and partial update data, updating the record SHALL preserve fields not included in the update while changing only the specified fields.
**Validates: Requirements 2.5**

### Property 5: Repository delete removes record
*For any* existing record ID, after calling delete(id), calling findBy('id', id) SHALL return null.
**Validates: Requirements 2.6**

### Property 6: Repository upsert is idempotent
*For any* insert data with a conflict column value, calling upsert twice with the same data SHALL result in exactly one record with that conflict column value.
**Validates: Requirements 2.7, 10.8**

### Property 7: Repository count reflects actual records
*For any* repository, count() SHALL equal the length of findAll() when called without limit.
**Validates: Requirements 2.8**

### Property 8: Tool-category link/unlink consistency
*For any* tool and category, after linkToCategory(toolId, categoryId), findByCategory(categorySlug) SHALL include the tool. After unlinkFromCategory, it SHALL NOT include the tool.
**Validates: Requirements 3.2**

### Property 9: BulkUpsert returns correct count
*For any* array of N tools with unique slugs, bulkUpsert SHALL return an array of length N.
**Validates: Requirements 3.3**

### Property 10: Subcategories ordered by display_order
*For any* category, findByCategory SHALL return subcategories sorted by display_order in ascending order.
**Validates: Requirements 3.5**

### Property 11: FAQs ordered by display_order
*For any* call to findAllOrdered, the returned FAQs SHALL be sorted by display_order in ascending order.
**Validates: Requirements 3.6**

### Property 12: Mapper snake_case to camelCase transformation
*For any* database row with snake_case columns, the mapper SHALL produce an object with equivalent camelCase properties where the values are preserved.
**Validates: Requirements 4.1, 4.5**

### Property 13: Mapper applies defaults for null values
*For any* database row with null values in optional fields, the mapper SHALL produce an object with the specified default values (description='', image='https://placehold.co/600x400', savedCount=0, etc.).
**Validates: Requirements 4.2**

### Property 14: Mapper round-trip preserves data
*For any* valid Tool object, mapToolToInsert followed by mapToolRowToTool (after DB insert) SHALL produce an object with equivalent data to the original (excluding auto-generated fields like id, created_at).
**Validates: Requirements 4.4**

### Property 15: Updated_at trigger updates timestamp
*For any* record update, the updated_at timestamp after the update SHALL be greater than or equal to the updated_at timestamp before the update.
**Validates: Requirements 8.2**

### Property 16: Foreign key cascade deletes related records
*For any* tool with category relationships, deleting the tool SHALL also delete all related tool_categories records.
**Validates: Requirements 15.1**

### Property 17: Unique constraints prevent duplicates
*For any* attempt to insert a record with a slug that already exists, the database SHALL reject the insert with a constraint violation error.
**Validates: Requirements 15.2**

### Property 18: Check constraints enforce valid ranges
*For any* tool insert or update, review_score values outside [0, 5] SHALL be rejected by the database.
**Validates: Requirements 15.3**

### Property 19: Scraper metadata contains required fields
*For any* tool upserted by the scraper, the metadata JSONB field SHALL contain 'source' equal to 'scraper' and 'scraped_at' as a valid ISO timestamp string.
**Validates: Requirements 12.2**

### Property 20: Scraper continues on individual failures
*For any* batch of tools processed by the scraper where some tools fail validation, the scraper SHALL successfully process all valid tools and report the count of failures without stopping.
**Validates: Requirements 12.5**

## Error Handling

### Error Types Hierarchy

```typescript
// Base error for all database operations
class DatabaseError extends Error {
  operation: string;  // 'findAll', 'create', 'update', etc.
  table: string;      // 'tools', 'categories', etc.
  originalError: unknown;
}

// Thrown when a required record is not found
class NotFoundError extends Error {
  entity: string;     // 'Tool', 'Category', etc.
  identifier: string; // The ID or slug that wasn't found
}

// Thrown when input validation fails
class ValidationError extends Error {
  field: string;      // The field that failed validation
}
```

### Error Handling Strategy

1. **Repository Layer**: Catches Supabase errors and wraps them in `DatabaseError`
2. **Service Layer**: Catches repository errors, may throw `NotFoundError` or `ValidationError`
3. **Presentation Layer**: Catches service errors and displays appropriate user messages

### Error Flow Example

```typescript
// Repository
async findById(id: string): Promise<Row> {
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
  if (error) {
    throw new DatabaseError('findById', this.tableName, error.message, error);
  }
  return data;
}

// Service
async getToolBySlug(slug: string): Promise<Tool | null> {
  try {
    const row = await toolsRepo.findBySlug(slug);
    return row ? mapToolRowToTool(row) : null;
  } catch (error) {
    if (error instanceof DatabaseError) {
      // Log and re-throw or handle gracefully
      console.error(`Failed to get tool: ${error.message}`);
      throw error;
    }
    throw error;
  }
}
```

## Row Level Security (RLS) Policies

RLS policies control data access at the database level. The design uses a read-public, write-admin pattern.

### Policy Definitions

**File: `supabase/migrations/20250101000008_enable_rls.sql`**

```sql
-- Enable RLS on all tables
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Public read access for content tables
CREATE POLICY "Public read access" ON tools FOR SELECT USING (true);
CREATE POLICY "Public read access" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON category_groups FOR SELECT USING (true);
CREATE POLICY "Public read access" ON subcategories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON tool_categories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON featured_tools FOR SELECT USING (true);
CREATE POLICY "Public read access" ON faqs FOR SELECT USING (true);

-- User favorites: users can only access their own favorites
CREATE POLICY "Users can view own favorites" ON user_favorites 
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can insert own favorites" ON user_favorites 
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can delete own favorites" ON user_favorites 
  FOR DELETE USING (auth.jwt() ->> 'email' = user_email);
```

### Access Pattern Summary

| Table | Public Read | Authenticated Write | Admin Write |
|-------|-------------|---------------------|-------------|
| tools | ✅ | ❌ | ✅ (service role) |
| categories | ✅ | ❌ | ✅ (service role) |
| category_groups | ✅ | ❌ | ✅ (service role) |
| subcategories | ✅ | ❌ | ✅ (service role) |
| tool_categories | ✅ | ❌ | ✅ (service role) |
| featured_tools | ✅ | ❌ | ✅ (service role) |
| faqs | ✅ | ❌ | ✅ (service role) |
| user_favorites | Own only | Own only | ✅ (service role) |

## Scraper Integration

The scraper writes directly to Supabase instead of JSON files, enabling real-time data availability.

### Scraper Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SCRAPER                                  │
│  scripts/scrape-free-ai-tools.ts                                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN SUPABASE CLIENT                         │
│  Uses service role key to bypass RLS                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                           │
│  Upserts with conflict resolution on slug                       │
└─────────────────────────────────────────────────────────────────┘
```

### Scraper Service Interface

**File: `scripts/lib/scraper-db.service.ts`**

```typescript
export interface ScraperDbService {
  /** Upsert categories with slug as conflict column */
  upsertCategories(categories: CategoryInsert[]): Promise<void>;
  
  /** Upsert tools with metadata containing source and timestamp */
  upsertTools(tools: ToolInsert[]): Promise<void>;
  
  /** Upsert tool-category relationships */
  upsertToolCategories(relationships: ToolCategoryInsert[]): Promise<void>;
  
  /** Upsert FAQs preserving display_order */
  upsertFaqs(faqs: FaqInsert[]): Promise<void>;
}
```

### Scraper Metadata

Tools inserted by the scraper include metadata for tracking:

```typescript
interface ScraperMetadata {
  source: 'scraper';
  scraped_at: string; // ISO timestamp
  source_url?: string;
}

// Example tool insert with metadata
const toolInsert: ToolInsert = {
  name: 'ChatGPT',
  slug: 'chatgpt',
  website_url: 'https://chat.openai.com',
  metadata: {
    source: 'scraper',
    scraped_at: new Date().toISOString(),
  },
};
```

### Error Handling in Scraper

The scraper continues processing on individual record failures:

```typescript
async function processTools(tools: ToolData[]): Promise<ScraperResult> {
  const results = { success: 0, failed: 0, errors: [] as string[] };
  
  for (const tool of tools) {
    try {
      await scraperDb.upsertTools([mapScrapedToolToInsert(tool)]);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to upsert tool ${tool.slug}: ${error.message}`);
      console.error(`[Scraper] Error processing ${tool.slug}:`, error);
      // Continue with next tool
    }
  }
  
  return results;
}
```

## Testing Strategy

### Dual Testing Approach

This implementation uses both unit tests and property-based tests for comprehensive coverage:

1. **Unit Tests**: Verify specific examples, edge cases, and error conditions
2. **Property-Based Tests**: Verify universal properties that should hold across all inputs

### Property-Based Testing Library

**Library**: `fast-check` (TypeScript-native, well-maintained, good Vitest integration)

**Configuration**: Each property test runs minimum 100 iterations.

### Test File Structure

```
src/lib/db/
├── repositories/
│   ├── base.repository.ts
│   ├── base.repository.test.ts      # Unit tests
│   ├── base.repository.property.test.ts  # Property tests
│   ├── tools.repository.ts
│   └── tools.repository.test.ts
├── mappers/
│   ├── tool.mapper.ts
│   ├── tool.mapper.test.ts          # Unit tests
│   └── tool.mapper.property.test.ts # Property tests
└── errors.ts
    └── errors.test.ts
```

### Property Test Example

```typescript
import * as fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { mapToolRowToTool, mapToolToInsert } from './tool.mapper';

describe('Tool Mapper Properties', () => {
  /**
   * **Feature: supabase-migration, Property 14: Mapper round-trip preserves data**
   * **Validates: Requirements 4.4**
   */
  it('round-trip preserves data', () => {
    const toolArbitrary = fc.record({
      name: fc.string({ minLength: 1 }),
      slug: fc.string({ minLength: 1 }).map(s => s.toLowerCase().replace(/\s/g, '-')),
      description: fc.string(),
      shortDescription: fc.string(),
      websiteUrl: fc.webUrl(),
      pricing: fc.constantFrom('Free', 'Freemium', 'Paid', 'Free Trial', 'Contact for Pricing'),
      tags: fc.array(fc.string()),
      verified: fc.boolean(),
      isNew: fc.boolean(),
      isFeatured: fc.boolean(),
    });

    fc.assert(
      fc.property(toolArbitrary, (tool) => {
        const inserted = mapToolToInsert(tool);
        // Simulate DB row with snake_case
        const dbRow = {
          id: 'test-id',
          name: inserted.name,
          slug: inserted.slug,
          description: inserted.description,
          short_description: inserted.short_description,
          website_url: inserted.website_url,
          // ... other fields
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const result = mapToolRowToTool(dbRow);
        
        expect(result.name).toBe(tool.name);
        expect(result.slug).toBe(tool.slug);
        expect(result.description).toBe(tool.description);
      }),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { DatabaseError, NotFoundError, ValidationError } from './errors';

describe('Error Types', () => {
  it('DatabaseError contains operation and table', () => {
    const error = new DatabaseError('findById', 'tools', 'Connection failed');
    expect(error.operation).toBe('findById');
    expect(error.table).toBe('tools');
    expect(error.message).toContain('findById');
    expect(error.message).toContain('tools');
  });

  it('NotFoundError contains entity and identifier', () => {
    const error = new NotFoundError('Tool', 'my-slug');
    expect(error.entity).toBe('Tool');
    expect(error.identifier).toBe('my-slug');
  });
});
```

### Integration Test Strategy

Integration tests verify the full stack works together with a real Supabase instance:

1. Use a separate test database or Supabase project
2. Seed test data before each test suite
3. Clean up after tests
4. Test RLS policies with different auth contexts

```typescript
// integration/tools.integration.test.ts
describe('Tools Integration', () => {
  beforeAll(async () => {
    // Seed test data
  });

  afterAll(async () => {
    // Clean up
  });

  it('creates and retrieves a tool', async () => {
    const tool = await createTool({ name: 'Test Tool', slug: 'test-tool', websiteUrl: 'https://test.com' });
    const retrieved = await getToolBySlug('test-tool');
    expect(retrieved).toMatchObject({ name: 'Test Tool' });
  });
});
```

## Migration Strategy

### Phase 1: Schema Setup
1. Initialize Supabase CLI
2. Create all migration files
3. Apply migrations to development database
4. Generate TypeScript types

### Phase 2: Code Implementation
1. Create constants module
2. Create error types
3. Create base repository
4. Create entity repositories
5. Create mappers
6. Update services to use repositories

### Phase 3: Data Migration
1. Run migration script to transfer JSON data
2. Verify data integrity
3. Update scraper to write to Supabase

### Phase 4: Cutover
1. Update all components to use new services
2. Remove JSON file dependencies
3. Deploy to production

## File Structure Summary

```
src/lib/
├── db/
│   ├── constants/
│   │   ├── tables.ts
│   │   ├── columns.ts        # NEW: Column mapping constants
│   │   └── index.ts
│   ├── repositories/
│   │   ├── base.repository.ts
│   │   ├── tools.repository.ts
│   │   ├── categories.repository.ts
│   │   ├── subcategories.repository.ts
│   │   ├── faqs.repository.ts
│   │   ├── featured-tools.repository.ts
│   │   └── index.ts
│   ├── mappers/
│   │   ├── tool.mapper.ts
│   │   ├── category.mapper.ts
│   │   ├── subcategory.mapper.ts  # NEW
│   │   └── index.ts
│   ├── errors.ts
│   └── index.ts
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   ├── admin.ts              # NEW: Service role client
│   ├── types.ts
│   └── index.ts
├── services/
│   ├── tools.service.ts      # UPDATED
│   ├── categories.service.ts # NEW
│   ├── admin.service.ts
│   └── index.ts
└── types/
    ├── tool.ts
    ├── category.ts
    └── index.ts

supabase/
├── migrations/
│   ├── 20250101000001_create_tools_table.sql
│   ├── 20250101000002_create_categories_table.sql
│   ├── 20250101000003_create_category_groups_table.sql
│   ├── 20250101000004_create_subcategories_table.sql
│   ├── 20250101000005_create_tool_categories_junction.sql
│   ├── 20250101000006_create_featured_tools_table.sql
│   ├── 20250101000007_create_faqs_table.sql
│   ├── 20250101000008_enable_rls.sql
│   ├── 20250101000009_create_triggers.sql
│   └── 20250101000010_create_indexes.sql  # NEW
└── seed.sql

scripts/
├── db/
│   ├── migrate-json-to-supabase.ts
│   └── index.ts
└── lib/
    └── scraper-db.service.ts  # NEW: Scraper database service
```
