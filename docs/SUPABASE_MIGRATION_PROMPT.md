# MODULAR SUPABASE MIGRATION - AI Tools Directory

## ARCHITECTURE PHILOSOPHY

This migration follows a **MODULAR, SCALABLE** architecture designed for:
1. **Easy Updates** - Each entity has isolated files; change one without touching others
2. **LLM-Friendly** - Small, focused files reduce context needed for AI-assisted updates
3. **Future-Proof** - Add new tables/features without restructuring existing code
4. **Testable** - Each layer can be tested independently
5. **Type-Safe** - Database types auto-generated, application types manually maintained

---

## ARCHITECTURE DIAGRAM

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
│  ├── faqs.repository.ts                                         │
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
│  ├── admin.ts              (service role client) [NEW]         │
│  └── types.ts              (auto-generated DB types)           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                           │
│  supabase/migrations/      (version-controlled schema)          │
│  supabase/seed.sql         (seed data)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## FOLDER STRUCTURE

```
project-root/
├── src/
│   └── lib/
│       ├── supabase/                    # Supabase client setup
│       │   ├── client.ts                # Browser client (existing)
│       │   ├── server.ts                # Server client (existing)
│       │   ├── admin.ts                 # Service role client [NEW]
│       │   ├── types.ts                 # Auto-generated DB types
│       │   └── index.ts                 # Re-exports
│       │
│       ├── db/                          # Database layer [NEW]
│       │   ├── repositories/            # Data access (one file per entity)
│       │   │   ├── base.repository.ts   # Shared CRUD operations
│       │   │   ├── tools.repository.ts
│       │   │   ├── categories.repository.ts
│       │   │   ├── subcategories.repository.ts
│       │   │   ├── faqs.repository.ts
│       │   │   ├── featured-tools.repository.ts
│       │   │   └── index.ts             # Barrel export
│       │   │
│       │   ├── mappers/                 # Type transformations
│       │   │   ├── tool.mapper.ts
│       │   │   ├── category.mapper.ts
│       │   │   └── index.ts
│       │   │
│       │   ├── constants/               # Table names, column mappings
│       │   │   ├── tables.ts
│       │   │   └── index.ts
│       │   │
│       │   └── index.ts                 # Main DB exports
│       │
│       ├── services/                    # Business logic layer
│       │   ├── tools.service.ts
│       │   ├── categories.service.ts
│       │   ├── admin.service.ts         # Updated to use repositories
│       │   └── index.ts
│       │
│       └── types/                       # Application types
│           ├── tool.types.ts            # Tool-related types
│           ├── category.types.ts        # Category-related types
│           ├── common.types.ts          # Shared types
│           └── index.ts
│
├── supabase/                            # Supabase CLI folder [NEW]
│   ├── migrations/                      # SQL migrations (one per change)
│   │   ├── 20250101000001_create_tools_table.sql
│   │   ├── 20250101000002_create_categories_table.sql
│   │   ├── 20250101000003_create_category_groups_table.sql
│   │   ├── 20250101000004_create_subcategories_table.sql
│   │   ├── 20250101000005_create_tool_categories_junction.sql
│   │   ├── 20250101000006_create_featured_tools_table.sql
│   │   ├── 20250101000007_create_faqs_table.sql
│   │   ├── 20250101000008_enable_rls.sql
│   │   └── 20250101000009_create_triggers.sql
│   │
│   ├── seed.sql                         # Main seed file
│   └── config.toml                      # Supabase config
│
└── scripts/
    ├── db/                              # Database scripts
    │   ├── migrate-json-to-supabase.ts  # One-time migration
    │   ├── seed-tools.ts
    │   ├── seed-categories.ts
    │   └── index.ts
    │
    └── scrape-free-ai-tools.ts          # Updated to use repositories
```

---

## DESIGN PATTERNS WITH CODE EXAMPLES

### 1. TABLE CONSTANTS (Easy to rename tables/columns)

**File: `src/lib/db/constants/tables.ts`**
```typescript
/**
 * Database table names - centralized for easy updates
 * If you rename a table, update ONLY this file
 */
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

/**
 * Column mappings - DB column name → App property name
 * Update here if DB columns are renamed
 */
export const TOOL_COLUMNS = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  short_description: 'shortDescription',
  image_url: 'image',
  website_url: 'websiteUrl',
  pricing: 'pricing',
  tags: 'tags',
  saved_count: 'savedCount',
  review_count: 'reviewCount',
  review_score: 'reviewScore',
  verified: 'verified',
  is_new: 'isNew',
  is_featured: 'isFeatured',
  created_at: 'dateAdded',
  updated_at: 'updatedAt',
} as const;
```

---

### 2. BASE REPOSITORY (Shared CRUD operations)

**File: `src/lib/db/repositories/base.repository.ts`**
```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

type TableName = keyof Database['public']['Tables'];

/**
 * Base repository with common CRUD operations
 * Extend this for entity-specific repositories
 */
export function createBaseRepository<T extends TableName>(
  supabase: SupabaseClient<Database>,
  tableName: T
) {
  type Row = Database['public']['Tables'][T]['Row'];
  type Insert = Database['public']['Tables'][T]['Insert'];
  type Update = Database['public']['Tables'][T]['Update'];

  return {
    /**
     * Find all records with optional filters
     */
    async findAll(options?: {
      limit?: number;
      offset?: number;
      orderBy?: keyof Row;
      ascending?: boolean;
    }) {
      let query = supabase.from(tableName).select('*');

      if (options?.orderBy) {
        query = query.order(options.orderBy as string, {
          ascending: options.ascending ?? false,
        });
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Row[];
    },

    /**
     * Find single record by ID
     */
    async findById(id: string) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Row;
    },

    /**
     * Find single record by column value
     */
    async findBy<K extends keyof Row>(column: K, value: Row[K]) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(column as string, value)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as Row | null;
    },

    /**
     * Create new record
     */
    async create(data: Insert) {
      const { data: created, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return created as Row;
    },

    /**
     * Update existing record
     */
    async update(id: string, data: Update) {
      const { data: updated, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated as Row;
    },

    /**
     * Delete record
     */
    async delete(id: string) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },

    /**
     * Upsert (insert or update)
     */
    async upsert(data: Insert, onConflict?: string) {
      const { data: upserted, error } = await supabase
        .from(tableName)
        .upsert(data, { onConflict })
        .select()
        .single();

      if (error) throw error;
      return upserted as Row;
    },

    /**
     * Count records
     */
    async count() {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
  };
}

export type BaseRepository<T extends TableName> = ReturnType<
  typeof createBaseRepository<T>
>;
```


---

### 3. ENTITY-SPECIFIC REPOSITORY (Tools example)

**File: `src/lib/db/repositories/tools.repository.ts`**
```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { createBaseRepository } from './base.repository';
import { TABLES } from '../constants/tables';

type ToolRow = Database['public']['Tables']['tools']['Row'];
type ToolInsert = Database['public']['Tables']['tools']['Insert'];

/**
 * Tools repository - handles all tool-related database operations
 * 
 * USAGE:
 * const supabase = await createClient();
 * const toolsRepo = createToolsRepository(supabase);
 * const tools = await toolsRepo.findAll();
 */
export function createToolsRepository(supabase: SupabaseClient<Database>) {
  const base = createBaseRepository(supabase, TABLES.TOOLS);

  return {
    // Inherit all base CRUD operations
    ...base,

    /**
     * Find tool by slug (common lookup)
     */
    async findBySlug(slug: string) {
      return base.findBy('slug', slug);
    },

    /**
     * Find tools with their categories (joined)
     */
    async findWithCategories(options?: {
      limit?: number;
      offset?: number;
    }) {
      let query = supabase
        .from(TABLES.TOOLS)
        .select(`
          *,
          tool_categories (
            category:categories (id, name, slug)
          )
        `)
        .order('created_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    /**
     * Find tools by category slug
     */
    async findByCategory(categorySlug: string, limit = 20) {
      const { data, error } = await supabase
        .from(TABLES.TOOLS)
        .select(`
          *,
          tool_categories!inner (
            category:categories!inner (slug)
          )
        `)
        .eq('tool_categories.category.slug', categorySlug)
        .limit(limit);

      if (error) throw error;
      return data;
    },

    /**
     * Find featured tools
     */
    async findFeatured(limit = 10) {
      const { data, error } = await supabase
        .from(TABLES.TOOLS)
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },

    /**
     * Search tools by name
     */
    async search(query: string, limit = 20) {
      const { data, error } = await supabase
        .from(TABLES.TOOLS)
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(limit);

      if (error) throw error;
      return data;
    },

    /**
     * Link tool to category (many-to-many)
     */
    async linkToCategory(toolId: string, categoryId: string) {
      const { error } = await supabase
        .from(TABLES.TOOL_CATEGORIES)
        .upsert({ tool_id: toolId, category_id: categoryId });

      if (error) throw error;
    },

    /**
     * Unlink tool from category
     */
    async unlinkFromCategory(toolId: string, categoryId: string) {
      const { error } = await supabase
        .from(TABLES.TOOL_CATEGORIES)
        .delete()
        .eq('tool_id', toolId)
        .eq('category_id', categoryId);

      if (error) throw error;
    },

    /**
     * Bulk upsert tools (for scraping)
     */
    async bulkUpsert(tools: ToolInsert[]) {
      const { data, error } = await supabase
        .from(TABLES.TOOLS)
        .upsert(tools, { onConflict: 'slug' })
        .select();

      if (error) throw error;
      return data;
    },
  };
}

export type ToolsRepository = ReturnType<typeof createToolsRepository>;
```

---

### 4. MAPPER (DB Row → App Type)

**File: `src/lib/db/mappers/tool.mapper.ts`**
```typescript
import type { Database } from '@/lib/supabase/types';
import type { Tool } from '@/lib/types/tool.types';

type ToolRow = Database['public']['Tables']['tools']['Row'];
type ToolWithCategories = ToolRow & {
  tool_categories?: Array<{
    category: { id: string; name: string; slug: string } | null;
  }>;
};

/**
 * Maps database tool row to application Tool type
 * 
 * WHY THIS EXISTS:
 * - DB uses snake_case, app uses camelCase
 * - DB has nullable fields, app has defaults
 * - Isolates DB schema changes from app code
 * 
 * WHEN TO UPDATE:
 * - When DB column names change
 * - When adding new fields to Tool type
 */
export function mapToolRowToTool(row: ToolRow): Tool {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    shortDescription: row.short_description || '',
    image: row.image_url || 'https://placehold.co/600x400',
    websiteUrl: row.website_url,
    pricing: row.pricing as Tool['pricing'],
    categories: [], // Populated separately if needed
    tags: row.tags || [],
    savedCount: row.saved_count || 0,
    reviewCount: row.review_count || 0,
    reviewScore: row.review_score || 0,
    verified: row.verified || false,
    isNew: row.is_new || false,
    isFeatured: row.is_featured || false,
    dateAdded: row.created_at || undefined,
    monthlyVisits: row.monthly_visits || undefined,
    changePercentage: row.change_percentage || undefined,
  };
}

/**
 * Maps tool with joined categories
 */
export function mapToolWithCategories(row: ToolWithCategories): Tool {
  const tool = mapToolRowToTool(row);
  
  if (row.tool_categories) {
    tool.categories = row.tool_categories
      .filter(tc => tc.category !== null)
      .map(tc => tc.category!.name);
  }
  
  return tool;
}

/**
 * Maps application Tool to database insert format
 */
export function mapToolToInsert(
  tool: Omit<Tool, 'id' | 'dateAdded'>
): Database['public']['Tables']['tools']['Insert'] {
  return {
    name: tool.name,
    slug: tool.slug,
    description: tool.description,
    short_description: tool.shortDescription,
    image_url: tool.image,
    website_url: tool.websiteUrl,
    pricing: tool.pricing,
    tags: tool.tags,
    verified: tool.verified,
    is_new: tool.isNew,
    is_featured: tool.isFeatured,
    monthly_visits: tool.monthlyVisits,
    change_percentage: tool.changePercentage,
  };
}
```


---

### 5. SERVICE LAYER (Business Logic)

**File: `src/lib/services/tools.service.ts`**
```typescript
import { createClient } from '@/lib/supabase/server';
import { createToolsRepository } from '@/lib/db/repositories';
import { mapToolRowToTool, mapToolWithCategories, mapToolToInsert } from '@/lib/db/mappers';
import type { Tool } from '@/lib/types/tool.types';

/**
 * Tools service - business logic for tool operations
 * 
 * RESPONSIBILITIES:
 * - Orchestrates repository calls
 * - Applies business rules
 * - Transforms data using mappers
 * - Returns application types (not DB types)
 */

export async function getTools(options?: {
  category?: string;
  pricing?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Tool[]> {
  const supabase = await createClient();
  const repo = createToolsRepository(supabase);

  let tools;

  if (options?.category) {
    tools = await repo.findByCategory(options.category, options.limit);
  } else if (options?.search) {
    tools = await repo.search(options.search, options.limit);
  } else {
    tools = await repo.findWithCategories({
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  return tools.map(mapToolWithCategories);
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  const supabase = await createClient();
  const repo = createToolsRepository(supabase);

  const tool = await repo.findBySlug(slug);
  return tool ? mapToolRowToTool(tool) : null;
}

export async function getFeaturedTools(limit = 10): Promise<Tool[]> {
  const supabase = await createClient();
  const repo = createToolsRepository(supabase);

  const tools = await repo.findFeatured(limit);
  return tools.map(mapToolRowToTool);
}

export async function createTool(
  toolData: Omit<Tool, 'id' | 'dateAdded'>
): Promise<Tool> {
  const supabase = await createClient();
  const repo = createToolsRepository(supabase);

  const insertData = mapToolToInsert(toolData);
  const created = await repo.create(insertData);

  return mapToolRowToTool(created);
}

export async function updateTool(
  id: string,
  updates: Partial<Tool>
): Promise<Tool> {
  const supabase = await createClient();
  const repo = createToolsRepository(supabase);

  const updateData = mapToolToInsert(updates as Tool);
  const updated = await repo.update(id, updateData);

  return mapToolRowToTool(updated);
}

export async function deleteTool(id: string): Promise<void> {
  const supabase = await createClient();
  const repo = createToolsRepository(supabase);

  await repo.delete(id);
}
```

---

### 6. REPOSITORY INDEX (Barrel Export)

**File: `src/lib/db/repositories/index.ts`**
```typescript
/**
 * Repository exports
 * Import from here for clean imports:
 * import { createToolsRepository } from '@/lib/db/repositories'
 */

export { createBaseRepository, type BaseRepository } from './base.repository';
export { createToolsRepository, type ToolsRepository } from './tools.repository';
export { createCategoriesRepository, type CategoriesRepository } from './categories.repository';
export { createSubcategoriesRepository } from './subcategories.repository';
export { createFaqsRepository } from './faqs.repository';
export { createFeaturedToolsRepository } from './featured-tools.repository';
```

---

## DATABASE MIGRATIONS

### Migration Workflow

```bash
# 1. Initialize Supabase (if not done)
npx supabase init

# 2. Link to your project
npx supabase link --project-ref <your-project-id>

# 3. Create a new migration
npx supabase migration new create_tools_table

# 4. Edit the migration file in supabase/migrations/

# 5. Apply migrations locally
npx supabase db reset

# 6. Deploy to production
npx supabase db push

# 7. Regenerate types
npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
```

### Migration Files (One per table/change)

**File: `supabase/migrations/20250101000001_create_tools_table.sql`**
```sql
-- Create tools table
-- This migration creates the main tools table

CREATE TABLE IF NOT EXISTS public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  website_url TEXT NOT NULL,
  external_url TEXT,
  pricing TEXT CHECK (pricing IN ('Free', 'Freemium', 'Paid', 'Free Trial', 'Contact for Pricing')) DEFAULT 'Freemium',
  tags TEXT[] DEFAULT '{}',
  saved_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  review_score DECIMAL(2,1) DEFAULT 0 CHECK (review_score >= 0 AND review_score <= 5),
  verified BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  monthly_visits INTEGER,
  change_percentage DECIMAL(5,2),
  free_tier_details TEXT,
  metadata JSONB DEFAULT '{}', -- Extensible field for future data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tools_slug ON public.tools(slug);
CREATE INDEX IF NOT EXISTS idx_tools_pricing ON public.tools(pricing);
CREATE INDEX IF NOT EXISTS idx_tools_is_featured ON public.tools(is_featured);
CREATE INDEX IF NOT EXISTS idx_tools_created_at ON public.tools(created_at DESC);

-- Comment for documentation
COMMENT ON TABLE public.tools IS 'AI tools directory - main tools listing';
```


**File: `supabase/migrations/20250101000002_create_categories_table.sql`**
```sql
-- Create categories table

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- emoji or icon name
  tool_count INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);

COMMENT ON TABLE public.categories IS 'Tool categories for organization';
```

**File: `supabase/migrations/20250101000005_create_tool_categories_junction.sql`**
```sql
-- Create junction table for tools <-> categories (many-to-many)

CREATE TABLE IF NOT EXISTS public.tool_categories (
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tool_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_tool_categories_tool ON public.tool_categories(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_categories_category ON public.tool_categories(category_id);

COMMENT ON TABLE public.tool_categories IS 'Junction table linking tools to categories';
```

**File: `supabase/migrations/20250101000008_enable_rls.sql`**
```sql
-- Enable Row Level Security on all tables

ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read access" ON public.tools FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.category_groups FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.subcategories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.tool_categories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.featured_tools FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.faqs FOR SELECT USING (true);

-- Note: Write access is handled via service role key (bypasses RLS)
```

**File: `supabase/migrations/20250101000009_create_triggers.sql`**
```sql
-- Create updated_at trigger function

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER tools_updated_at
  BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER subcategories_updated_at
  BEFORE UPDATE ON public.subcategories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

## HOW TO ADD A NEW ENTITY

When you need to add a new table (e.g., `reviews`):

### Step 1: Create Migration
```bash
npx supabase migration new create_reviews_table
```

### Step 2: Write SQL
```sql
-- supabase/migrations/TIMESTAMP_create_reviews_table.sql
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 3: Regenerate Types
```bash
npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
```

### Step 4: Create Repository
```typescript
// src/lib/db/repositories/reviews.repository.ts
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { createBaseRepository } from './base.repository';
import { TABLES } from '../constants/tables';

export function createReviewsRepository(supabase: SupabaseClient<Database>) {
  const base = createBaseRepository(supabase, 'reviews');

  return {
    ...base,

    async findByToolId(toolId: string) {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('tool_id', toolId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    async getAverageRating(toolId: string) {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('tool_id', toolId);

      if (error) throw error;
      if (!data.length) return 0;

      const sum = data.reduce((acc, r) => acc + r.rating, 0);
      return sum / data.length;
    },
  };
}
```

### Step 5: Create Mapper (if needed)
```typescript
// src/lib/db/mappers/review.mapper.ts
import type { Database } from '@/lib/supabase/types';

type ReviewRow = Database['public']['Tables']['reviews']['Row'];

export interface Review {
  id: string;
  toolId: string;
  userEmail: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export function mapReviewRowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    toolId: row.tool_id,
    userEmail: row.user_email,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  };
}
```

### Step 6: Create Service
```typescript
// src/lib/services/reviews.service.ts
import { createClient } from '@/lib/supabase/server';
import { createReviewsRepository } from '@/lib/db/repositories';
import { mapReviewRowToReview } from '@/lib/db/mappers';

export async function getToolReviews(toolId: string) {
  const supabase = await createClient();
  const repo = createReviewsRepository(supabase);
  const reviews = await repo.findByToolId(toolId);
  return reviews.map(mapReviewRowToReview);
}

export async function createReview(data: {
  toolId: string;
  userEmail: string;
  rating: number;
  comment?: string;
}) {
  const supabase = await createClient();
  const repo = createReviewsRepository(supabase);
  const created = await repo.create({
    tool_id: data.toolId,
    user_email: data.userEmail,
    rating: data.rating,
    comment: data.comment || null,
  });
  return mapReviewRowToReview(created);
}
```

### Step 7: Export from Index Files
```typescript
// Add to src/lib/db/repositories/index.ts
export { createReviewsRepository } from './reviews.repository';

// Add to src/lib/db/mappers/index.ts
export * from './review.mapper';

// Add to src/lib/services/index.ts
export * from './reviews.service';
```


---

## HOW TO MODIFY AN EXISTING ENTITY

When you need to add a column to an existing table:

### Example: Add `source` column to tools table

### Step 1: Create Migration
```bash
npx supabase migration new add_source_to_tools
```

### Step 2: Write ALTER SQL
```sql
-- supabase/migrations/TIMESTAMP_add_source_to_tools.sql
ALTER TABLE public.tools
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

COMMENT ON COLUMN public.tools.source IS 'Where the tool was added from: manual, scraper, api';
```

### Step 3: Regenerate Types
```bash
npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
```

### Step 4: Update Mapper (ONLY file that needs change)
```typescript
// src/lib/db/mappers/tool.mapper.ts
// Add to mapToolRowToTool function:
export function mapToolRowToTool(row: ToolRow): Tool {
  return {
    // ... existing fields
    source: row.source || 'manual', // NEW FIELD
  };
}
```

### Step 5: Update Type (if needed)
```typescript
// src/lib/types/tool.types.ts
export interface Tool {
  // ... existing fields
  source?: 'manual' | 'scraper' | 'api'; // NEW FIELD
}
```

**That's it!** Repository and service don't need changes because:
- Repository uses generic types from Supabase
- Service uses mapper which handles the transformation

---

## IMPLEMENTATION PHASES

### Phase 1: Setup Foundation (Day 1)
```
□ Initialize Supabase CLI: npx supabase init
□ Link project: npx supabase link --project-ref <id>
□ Create folder structure:
  □ src/lib/db/repositories/
  □ src/lib/db/mappers/
  □ src/lib/db/constants/
  □ src/lib/services/
  □ src/lib/types/
□ Create constants/tables.ts
□ Create base.repository.ts
```

### Phase 2: Database Migrations (Day 1-2)
```
□ Create migration: 20250101000001_create_tools_table.sql
□ Create migration: 20250101000002_create_categories_table.sql
□ Create migration: 20250101000003_create_category_groups_table.sql
□ Create migration: 20250101000004_create_subcategories_table.sql
□ Create migration: 20250101000005_create_tool_categories_junction.sql
□ Create migration: 20250101000006_create_featured_tools_table.sql
□ Create migration: 20250101000007_create_faqs_table.sql
□ Create migration: 20250101000008_enable_rls.sql
□ Create migration: 20250101000009_create_triggers.sql
□ Apply migrations: npx supabase db reset
□ Regenerate types: npx supabase gen types typescript
```

### Phase 3: Repository Layer (Day 2)
```
□ Create tools.repository.ts
□ Create categories.repository.ts
□ Create subcategories.repository.ts
□ Create faqs.repository.ts
□ Create featured-tools.repository.ts
□ Create repositories/index.ts (barrel export)
```

### Phase 4: Mapper Layer (Day 2)
```
□ Create tool.mapper.ts
□ Create category.mapper.ts
□ Create mappers/index.ts (barrel export)
```

### Phase 5: Service Layer (Day 3)
```
□ Update tools.service.ts (use repository + mapper)
□ Update categories.service.ts
□ Update admin.service.ts
□ Create services/index.ts (barrel export)
```

### Phase 6: Data Migration (Day 3)
```
□ Create scripts/db/migrate-json-to-supabase.ts
□ Run migration script
□ Verify data in Supabase Studio
```

### Phase 7: Update Scraper (Day 4)
```
□ Update scripts/scrape-free-ai-tools.ts to use repositories
□ Test scraper writes to Supabase
```

### Phase 8: Cleanup (Day 4)
```
□ Remove JSON file dependencies
□ Update any remaining imports
□ Test all functionality
□ Deploy to production: npx supabase db push
```

---

## FILES TO CREATE (CHECKLIST)

### Database Layer
```
□ src/lib/db/constants/tables.ts
□ src/lib/db/constants/index.ts
□ src/lib/db/repositories/base.repository.ts
□ src/lib/db/repositories/tools.repository.ts
□ src/lib/db/repositories/categories.repository.ts
□ src/lib/db/repositories/subcategories.repository.ts
□ src/lib/db/repositories/faqs.repository.ts
□ src/lib/db/repositories/featured-tools.repository.ts
□ src/lib/db/repositories/index.ts
□ src/lib/db/mappers/tool.mapper.ts
□ src/lib/db/mappers/category.mapper.ts
□ src/lib/db/mappers/index.ts
□ src/lib/db/index.ts
```

### Supabase
```
□ src/lib/supabase/admin.ts (service role client)
□ supabase/migrations/20250101000001_create_tools_table.sql
□ supabase/migrations/20250101000002_create_categories_table.sql
□ supabase/migrations/20250101000003_create_category_groups_table.sql
□ supabase/migrations/20250101000004_create_subcategories_table.sql
□ supabase/migrations/20250101000005_create_tool_categories_junction.sql
□ supabase/migrations/20250101000006_create_featured_tools_table.sql
□ supabase/migrations/20250101000007_create_faqs_table.sql
□ supabase/migrations/20250101000008_enable_rls.sql
□ supabase/migrations/20250101000009_create_triggers.sql
□ supabase/seed.sql
```

### Services (Update)
```
□ src/lib/services/tools.service.ts
□ src/lib/services/categories.service.ts
□ src/lib/services/admin.service.ts
□ src/lib/services/index.ts
```

### Scripts
```
□ scripts/db/migrate-json-to-supabase.ts
□ scripts/db/index.ts
```


---

## ADMIN CLIENT FOR WRITE OPERATIONS

**File: `src/lib/supabase/admin.ts`**
```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Creates a Supabase client with SERVICE ROLE key
 * USE ONLY for admin operations (bypasses RLS)
 * 
 * WARNING: Never expose this client to the browser!
 * Only use in:
 * - Server Actions
 * - API Routes
 * - Scripts
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials');
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

---

## DATA MIGRATION SCRIPT

**File: `scripts/db/migrate-json-to-supabase.ts`**
```typescript
/**
 * One-time migration script: JSON files → Supabase
 * 
 * Run with: npx tsx scripts/db/migrate-json-to-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import type { Database } from '../../src/lib/supabase/types';

// Use service role for migration (bypasses RLS)
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrateTools() {
  console.log('Migrating tools...');
  
  const mockDb = JSON.parse(
    fs.readFileSync('src/data/mock-db.json', 'utf-8')
  );

  for (const tool of mockDb.tools) {
    const { data, error } = await supabase
      .from('tools')
      .upsert({
        name: tool.name,
        slug: tool.slug,
        description: tool.description,
        short_description: tool.shortDescription,
        image_url: tool.image,
        website_url: tool.websiteUrl,
        pricing: tool.pricing,
        tags: tool.tags,
        saved_count: tool.savedCount,
        review_count: tool.reviewCount,
        review_score: tool.reviewScore,
        verified: tool.verified,
        is_new: tool.isNew,
        is_featured: tool.isFeatured,
        monthly_visits: tool.monthlyVisits,
        change_percentage: tool.changePercentage,
      }, { onConflict: 'slug' })
      .select()
      .single();

    if (error) {
      console.error(`Failed to migrate tool ${tool.name}:`, error);
    } else {
      console.log(`  ✓ ${tool.name}`);
      
      // Link to categories
      for (const categoryName of tool.categories || []) {
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('name', categoryName)
          .single();

        if (category && data) {
          await supabase
            .from('tool_categories')
            .upsert({ tool_id: data.id, category_id: category.id });
        }
      }
    }
  }
}

async function migrateCategories() {
  console.log('Migrating categories...');
  
  const categories = JSON.parse(
    fs.readFileSync('src/data/free-ai-tools/categories.json', 'utf-8')
  );

  for (const cat of categories) {
    const { error } = await supabase
      .from('categories')
      .upsert({
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        tool_count: cat.toolCount,
      }, { onConflict: 'slug' });

    if (error) {
      console.error(`Failed to migrate category ${cat.name}:`, error);
    } else {
      console.log(`  ✓ ${cat.name}`);
    }
  }
}

async function migrateCategoryGroups() {
  console.log('Migrating category groups...');
  
  const mockDb = JSON.parse(
    fs.readFileSync('src/data/mock-db.json', 'utf-8')
  );

  for (let i = 0; i < mockDb.categoryGroups.length; i++) {
    const group = mockDb.categoryGroups[i];
    
    const { data: groupData, error } = await supabase
      .from('category_groups')
      .upsert({
        name: group.name,
        icon_name: group.iconName,
        display_order: i,
      }, { onConflict: 'name' })
      .select()
      .single();

    if (error) {
      console.error(`Failed to migrate group ${group.name}:`, error);
      continue;
    }

    console.log(`  ✓ ${group.name}`);

    // Link categories to group
    for (const cat of group.categories || []) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', cat.slug)
        .single();

      if (category && groupData) {
        await supabase
          .from('category_group_categories')
          .upsert({
            group_id: groupData.id,
            category_id: category.id,
          });
      }
    }
  }
}

async function migrateFaqs() {
  console.log('Migrating FAQs...');
  
  const faqs = JSON.parse(
    fs.readFileSync('src/data/free-ai-tools/faq.json', 'utf-8')
  );

  for (let i = 0; i < faqs.length; i++) {
    const faq = faqs[i];
    
    const { error } = await supabase
      .from('faqs')
      .upsert({
        question: faq.question,
        answer: faq.answer,
        display_order: i,
      });

    if (error) {
      console.error(`Failed to migrate FAQ:`, error);
    } else {
      console.log(`  ✓ FAQ ${i + 1}`);
    }
  }
}

async function migrateScrapedTools() {
  console.log('Migrating scraped tools from category files...');
  
  const categoriesDir = 'src/data/free-ai-tools/categories';
  
  if (!fs.existsSync(categoriesDir)) {
    console.log('  No category files found, skipping...');
    return;
  }

  const files = fs.readdirSync(categoriesDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const catData = JSON.parse(
      fs.readFileSync(path.join(categoriesDir, file), 'utf-8')
    );

    console.log(`  Processing ${catData.name}...`);

    // Get or create category
    const { data: category } = await supabase
      .from('categories')
      .upsert({
        name: catData.name,
        slug: catData.slug,
        description: catData.description,
        icon: catData.icon,
        tool_count: catData.toolCount,
      }, { onConflict: 'slug' })
      .select()
      .single();

    if (!category) continue;

    // Process subcategories
    for (let i = 0; i < (catData.subcategories || []).length; i++) {
      const sub = catData.subcategories[i];

      const { data: subcategory } = await supabase
        .from('subcategories')
        .upsert({
          category_id: category.id,
          name: sub.name,
          slug: sub.id,
          tool_count: sub.toolCount,
          display_order: i,
        }, { onConflict: 'slug' })
        .select()
        .single();

      // Process tools in subcategory
      for (const tool of sub.tools || []) {
        const { data: toolData } = await supabase
          .from('tools')
          .upsert({
            name: tool.name,
            slug: tool.slug,
            description: tool.description,
            website_url: tool.externalUrl || '',
            external_url: tool.externalUrl,
            free_tier_details: tool.freeTierDetails,
            pricing: tool.pricing?.includes('$') ? 'Paid' : 'Freemium',
            metadata: { source: 'scraper' },
          }, { onConflict: 'slug' })
          .select()
          .single();

        if (toolData) {
          await supabase
            .from('tool_categories')
            .upsert({ tool_id: toolData.id, category_id: category.id });
        }
      }
    }

    console.log(`    ✓ ${catData.subcategories?.length || 0} subcategories processed`);
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('Starting JSON → Supabase Migration');
  console.log('='.repeat(50));

  try {
    await migrateCategories();
    await migrateCategoryGroups();
    await migrateTools();
    await migrateFaqs();
    await migrateScrapedTools();

    console.log('='.repeat(50));
    console.log('Migration complete!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
```


---

## UPDATED SCRAPER (Using Repositories)

**File: `scripts/scrape-free-ai-tools.ts` (key changes)**
```typescript
// At the top, add:
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/lib/supabase/types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Replace writeOutputFiles method with:
private async writeToSupabase(
  categories: ScrapedCategory[],
  categoryData: Map<string, ScrapedCategoryPage>,
  featuredTools: ScrapedFeaturedTool[],
  faqItems: ScrapedFAQItem[]
): Promise<void> {
  console.log('Writing to Supabase...');

  // Upsert categories
  for (const cat of categories) {
    await supabase
      .from('categories')
      .upsert({
        name: cat.name,
        slug: cat.slug,
        icon: cat.iconUrl,
      }, { onConflict: 'slug' });
  }
  console.log(`  ✓ ${categories.length} categories`);

  // Upsert tools
  let toolCount = 0;
  for (const [slug, data] of categoryData) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!category) continue;

    for (const sub of data.subcategories) {
      for (const tool of sub.tools) {
        const { data: toolData } = await supabase
          .from('tools')
          .upsert({
            name: tool.name,
            slug: tool.slug,
            description: tool.description,
            external_url: tool.externalUrl,
            website_url: tool.externalUrl || '',
            free_tier_details: tool.freeTierDetails,
            pricing: tool.pricing?.includes('$') ? 'Paid' : 'Freemium',
            metadata: { source: 'scraper', scraped_at: new Date().toISOString() },
          }, { onConflict: 'slug' })
          .select()
          .single();

        if (toolData) {
          await supabase
            .from('tool_categories')
            .upsert({ tool_id: toolData.id, category_id: category.id });
          toolCount++;
        }
      }
    }
  }
  console.log(`  ✓ ${toolCount} tools`);

  // Upsert FAQs
  for (let i = 0; i < faqItems.length; i++) {
    await supabase
      .from('faqs')
      .upsert({
        question: faqItems[i].question,
        answer: faqItems[i].answer,
        display_order: i,
      });
  }
  console.log(`  ✓ ${faqItems.length} FAQs`);

  console.log('Supabase write complete!');
}

// In run() method, replace:
// await this.writeOutputFiles(...)
// with:
// await this.writeToSupabase(...)
```

---

## ENVIRONMENT VARIABLES

Add to `.env`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Required for admin operations and property tests
# WARNING: Never expose this key in client-side code
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## TESTING CHECKLIST

After implementation:
```
□ All migrations applied successfully
□ Types regenerated and match schema
□ Repositories can CRUD all entities
□ Mappers correctly transform data
□ Services return correct application types
□ Admin panel creates/updates/deletes tools
□ Scraper writes to Supabase
□ Frontend displays data from Supabase
□ RLS policies allow public read
□ No JSON file dependencies remain
```

---

## QUICK REFERENCE: COMMON OPERATIONS

### Add new column
```bash
npx supabase migration new add_column_to_table
# Edit SQL file
npx supabase db reset
npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
# Update mapper only
```

### Add new table
```bash
npx supabase migration new create_new_table
# Edit SQL file
npx supabase db reset
npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
# Create: repository, mapper, service
# Export from index files
```

### Rename column
```bash
npx supabase migration new rename_column
# ALTER TABLE ... RENAME COLUMN old TO new
npx supabase db reset
npx supabase gen types typescript
# Update mapper only (change column mapping)
```

### Deploy to production
```bash
npx supabase db push
```

---

## SUMMARY

This modular architecture provides:

| Benefit | How |
|---------|-----|
| **Easy Updates** | One file per entity, isolated changes |
| **LLM-Friendly** | Small files, clear naming, barrel exports |
| **Type Safety** | Auto-generated DB types, manual app types |
| **Testable** | Each layer mockable independently |
| **Scalable** | Add entities without touching existing code |
| **Version Control** | Migrations track all schema changes |
| **Future-Proof** | JSONB metadata field for extensibility |

**Key Files to Know:**
- `constants/tables.ts` - Table/column names (change here if renaming)
- `repositories/*.ts` - Data access (one per entity)
- `mappers/*.ts` - Type transformations (update when schema changes)
- `services/*.ts` - Business logic (orchestrates repos + mappers)
- `supabase/migrations/*.sql` - Schema changes (never modify old ones)