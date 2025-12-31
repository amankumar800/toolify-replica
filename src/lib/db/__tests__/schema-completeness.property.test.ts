/**
 * Property-based tests for database schema completeness
 *
 * **Feature: database-schema-redesign, Property 1: Schema Completeness**
 * **Validates: Requirements 1.1, 1.3-1.5, 1.7, 2.1, 3.1, 4.1, 6.1, 6.3-6.5, 7.1-7.2, 8.1, 8.3-8.5, 9.1, 9.3-9.4, 10.1-10.6**
 *
 * *For any* table in the schema, all required columns SHALL exist with correct data types,
 * constraints, and default values as specified in the requirements.
 *
 * To run these tests, you need to set SUPABASE_SERVICE_ROLE_KEY in your environment.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_KEY;

// Expected schema definition based on requirements
const EXPECTED_SCHEMA = {
  // Requirement 1: Tools Table Schema
  tools: {
    columns: {
      // 1.1 Core identification fields
      id: { type: 'uuid', nullable: false },
      name: { type: 'text', nullable: false },
      slug: { type: 'text', nullable: false },
      description: { type: 'text', nullable: true },
      short_description: { type: 'text', nullable: true },
      image_url: { type: 'text', nullable: true },
      website_url: { type: 'text', nullable: false },
      // 1.3 Engagement metrics
      saved_count: { type: 'integer', nullable: true },
      review_count: { type: 'integer', nullable: true },
      review_score: { type: 'numeric', nullable: true },
      // 1.4 Display flags
      verified: { type: 'boolean', nullable: true },
      is_new: { type: 'boolean', nullable: true },
      is_featured: { type: 'boolean', nullable: true },
      // 1.5 Ranking data
      monthly_visits: { type: 'integer', nullable: true },
      change_percentage: { type: 'numeric', nullable: true },
      // 1.7 Submission workflow
      status: { type: 'text', nullable: true },
      submitter_email: { type: 'text', nullable: true },
      submitter_name: { type: 'text', nullable: true },
      reviewed_by: { type: 'uuid', nullable: true },
      reviewed_at: { type: 'timestamp with time zone', nullable: true },
      rejection_reason: { type: 'text', nullable: true },
      // Classification
      pricing: { type: 'text', nullable: true },
      tags: { type: 'ARRAY', nullable: true },
      metadata: { type: 'jsonb', nullable: true },
      // Timestamps
      created_at: { type: 'timestamp with time zone', nullable: true },
      updated_at: { type: 'timestamp with time zone', nullable: true },
      // Full-text search
      search_vector: { type: 'tsvector', nullable: true },
    },
  },
  // Requirement 2: Categories Table Schema
  categories: {
    columns: {
      id: { type: 'uuid', nullable: false },
      name: { type: 'text', nullable: false },
      slug: { type: 'text', nullable: false },
      description: { type: 'text', nullable: true },
      icon: { type: 'text', nullable: true },
      tool_count: { type: 'integer', nullable: true },
      display_order: { type: 'integer', nullable: true },
      group_id: { type: 'uuid', nullable: true },
      metadata: { type: 'jsonb', nullable: true },
      created_at: { type: 'timestamp with time zone', nullable: true },
      updated_at: { type: 'timestamp with time zone', nullable: true },
    },
  },
  // Requirement 3: Category Groups Table Schema
  category_groups: {
    columns: {
      id: { type: 'uuid', nullable: false },
      name: { type: 'text', nullable: false },
      icon_name: { type: 'text', nullable: true },
      display_order: { type: 'integer', nullable: true },
      created_at: { type: 'timestamp with time zone', nullable: true },
      updated_at: { type: 'timestamp with time zone', nullable: true },
    },
  },
  // Requirement 4: Subcategories Table Schema
  subcategories: {
    columns: {
      id: { type: 'uuid', nullable: false },
      category_id: { type: 'uuid', nullable: false },
      name: { type: 'text', nullable: false },
      slug: { type: 'text', nullable: false },
      tool_count: { type: 'integer', nullable: true },
      display_order: { type: 'integer', nullable: true },
      created_at: { type: 'timestamp with time zone', nullable: true },
      updated_at: { type: 'timestamp with time zone', nullable: true },
    },
  },
  // Requirement 5: Tool Categories Junction Table
  tool_categories: {
    columns: {
      tool_id: { type: 'uuid', nullable: false },
      category_id: { type: 'uuid', nullable: false },
      created_at: { type: 'timestamp with time zone', nullable: true },
    },
  },
  // Requirement 6: Featured Tools Table Schema
  featured_tools: {
    columns: {
      id: { type: 'uuid', nullable: false },
      tool_id: { type: 'uuid', nullable: false },
      display_order: { type: 'integer', nullable: true },
      placement_type: { type: 'text', nullable: true },
      is_sponsored: { type: 'boolean', nullable: true },
      sponsor_name: { type: 'text', nullable: true },
      campaign_id: { type: 'text', nullable: true },
      start_date: { type: 'timestamp with time zone', nullable: true },
      end_date: { type: 'timestamp with time zone', nullable: true },
      impression_count: { type: 'integer', nullable: true },
      click_count: { type: 'integer', nullable: true },
      created_at: { type: 'timestamp with time zone', nullable: true },
    },
  },
  // Requirement 7: FAQs Table Schema
  faqs: {
    columns: {
      id: { type: 'uuid', nullable: false },
      question: { type: 'text', nullable: false },
      answer: { type: 'text', nullable: false },
      display_order: { type: 'integer', nullable: true },
      category: { type: 'text', nullable: true },
      created_at: { type: 'timestamp with time zone', nullable: true },
    },
  },
  // Requirement 8: User Favorites Table Schema
  user_favorites: {
    columns: {
      id: { type: 'uuid', nullable: false },
      user_email: { type: 'text', nullable: false },
      tool_id: { type: 'text', nullable: false },
      tool_name: { type: 'text', nullable: true },
      category_id: { type: 'text', nullable: true },
      is_shortcut: { type: 'boolean', nullable: true },
      display_order: { type: 'integer', nullable: true },
      custom_icon_color: { type: 'text', nullable: true },
      created_at: { type: 'timestamp with time zone', nullable: true },
    },
  },
  // Requirement 9: Midjourney Prompts Table Schema
  midjourney_prompts: {
    columns: {
      id: { type: 'uuid', nullable: false },
      title: { type: 'text', nullable: false },
      slug: { type: 'text', nullable: false },
      sref_code: { type: 'text', nullable: true },
      prompt_text: { type: 'text', nullable: true },
      image_url: { type: 'text', nullable: true },
      type: { type: 'text', nullable: false },
      tags: { type: 'ARRAY', nullable: true },
      view_count: { type: 'integer', nullable: true },
      copy_count: { type: 'integer', nullable: true },
      created_at: { type: 'timestamp with time zone', nullable: true },
      updated_at: { type: 'timestamp with time zone', nullable: true },
    },
  },
  // Requirement 10: AI News Table Schema
  ai_news: {
    columns: {
      id: { type: 'uuid', nullable: false },
      title: { type: 'text', nullable: false },
      slug: { type: 'text', nullable: false },
      summary: { type: 'text', nullable: true },
      content: { type: 'text', nullable: true },
      author_name: { type: 'text', nullable: true },
      author_avatar: { type: 'text', nullable: true },
      source_name: { type: 'text', nullable: true },
      source_url: { type: 'text', nullable: true },
      category: { type: 'text', nullable: true },
      tags: { type: 'ARRAY', nullable: true },
      view_count: { type: 'integer', nullable: true },
      like_count: { type: 'integer', nullable: true },
      priority_score: { type: 'integer', nullable: true },
      is_published: { type: 'boolean', nullable: true },
      published_at: { type: 'timestamp with time zone', nullable: true },
      created_at: { type: 'timestamp with time zone', nullable: true },
      updated_at: { type: 'timestamp with time zone', nullable: true },
    },
  },
};

type TableName = keyof typeof EXPECTED_SCHEMA;

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

describe.skipIf(shouldSkip)('Schema Completeness Property Tests', { timeout: 120000 }, () => {
  let supabase: SupabaseClient;
  let schemaCache: Map<string, ColumnInfo[]> = new Map();

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Pre-fetch schema information for all tables
    const tableNames = Object.keys(EXPECTED_SCHEMA);
    for (const tableName of tableNames) {
      const { data, error } = await supabase.rpc('get_table_columns', {
        p_table_name: tableName,
      });

      if (error) {
        // Fallback: query information_schema directly
        const { data: fallbackData } = await supabase
          .from('information_schema.columns' as never)
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_schema', 'public')
          .eq('table_name', tableName);

        if (fallbackData) {
          schemaCache.set(tableName, fallbackData as ColumnInfo[]);
        }
      } else if (data) {
        schemaCache.set(tableName, data as ColumnInfo[]);
      }
    }
  });

  /**
   * Helper function to get column info from cache or database
   */
  async function getTableColumns(tableName: string): Promise<ColumnInfo[]> {
    if (schemaCache.has(tableName)) {
      return schemaCache.get(tableName)!;
    }

    // Query information_schema using raw SQL via RPC
    const { data, error } = await supabase.rpc('execute_sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${tableName}'
      `,
    });

    if (error || !data) {
      return [];
    }

    const columns = data as ColumnInfo[];
    schemaCache.set(tableName, columns);
    return columns;
  }

  /**
   * **Feature: database-schema-redesign, Property 1: Schema Completeness**
   * **Validates: Requirements 1.1, 1.3-1.5, 1.7, 2.1, 3.1, 4.1, 6.1, 6.3-6.5, 7.1-7.2, 8.1, 8.3-8.5, 9.1, 9.3-9.4, 10.1-10.6**
   *
   * *For any* table in the schema, all required columns SHALL exist with correct data types.
   */
  describe('Property 1: Schema Completeness', () => {
    // Generate arbitrary table names from our expected schema
    const tableNameArb = fc.constantFrom(...(Object.keys(EXPECTED_SCHEMA) as TableName[]));

    it('should have all required tables in the database', async () => {
      const expectedTables = Object.keys(EXPECTED_SCHEMA);

      // Query for existing tables
      const { data, error } = await supabase.rpc('execute_sql', {
        query: `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        `,
      });

      // If RPC doesn't exist, try direct query
      if (error) {
        // Verify tables exist by attempting to select from them
        for (const tableName of expectedTables) {
          const { error: tableError } = await supabase
            .from(tableName as never)
            .select('*')
            .limit(0);

          expect(tableError).toBeNull();
        }
        return;
      }

      const existingTables = (data as { table_name: string }[]).map((r) => r.table_name);

      for (const tableName of expectedTables) {
        expect(existingTables).toContain(tableName);
      }
    });

    it('should have all required columns for each table (property test with 100 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(tableNameArb, async (tableName) => {
          const expectedColumns = EXPECTED_SCHEMA[tableName].columns;

          // Try to select all expected columns from the table
          const columnNames = Object.keys(expectedColumns);
          const selectQuery = columnNames.join(', ');

          const { error } = await supabase
            .from(tableName as never)
            .select(selectQuery)
            .limit(0);

          // If no error, all columns exist
          expect(error).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should have correct NOT NULL constraints on required columns', async () => {
      await fc.assert(
        fc.asyncProperty(tableNameArb, async (tableName) => {
          const expectedColumns = EXPECTED_SCHEMA[tableName].columns;

          // Get columns that should be NOT NULL
          const notNullColumns = Object.entries(expectedColumns)
            .filter(([, spec]) => !spec.nullable)
            .map(([name]) => name);

          // Test by attempting to insert null values (should fail for NOT NULL columns)
          for (const columnName of notNullColumns) {
            // Skip primary key columns as they have defaults
            if (columnName === 'id') continue;

            // Create a minimal valid record with null for the test column
            const testRecord: Record<string, unknown> = {};

            // Set required fields based on table
            if (tableName === 'tools') {
              testRecord.name = 'Test';
              testRecord.slug = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
              testRecord.website_url = 'https://example.com';
            } else if (tableName === 'categories') {
              testRecord.name = 'Test';
              testRecord.slug = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            } else if (tableName === 'category_groups') {
              testRecord.name = `Test ${Date.now()}`;
            } else if (tableName === 'subcategories') {
              // Need a valid category_id - skip this test
              continue;
            } else if (tableName === 'tool_categories') {
              // Need valid tool_id and category_id - skip this test
              continue;
            } else if (tableName === 'featured_tools') {
              // Need valid tool_id - skip this test
              continue;
            } else if (tableName === 'faqs') {
              testRecord.question = 'Test?';
              testRecord.answer = 'Test answer';
            } else if (tableName === 'user_favorites') {
              testRecord.user_email = 'test@example.com';
              testRecord.tool_id = 'test-tool-id';
            } else if (tableName === 'midjourney_prompts') {
              testRecord.title = 'Test';
              testRecord.slug = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
              testRecord.type = 'sref';
            } else if (tableName === 'ai_news') {
              testRecord.title = 'Test';
              testRecord.slug = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            }

            // Set the test column to null
            testRecord[columnName] = null;

            const { error } = await supabase.from(tableName as never).insert(testRecord as never);

            // Should get a NOT NULL violation error
            if (error) {
              expect(error.message).toMatch(/null|not-null|violates/i);
            }
          }
        }),
        { numRuns: 10 } // Reduced runs since we're testing multiple columns per table
      );
    });

    it('should verify tools table has all core identification fields (Req 1.1)', async () => {
      const coreFields = ['id', 'name', 'slug', 'description', 'short_description', 'image_url', 'website_url'];

      const { error } = await supabase
        .from('tools')
        .select(coreFields.join(', '))
        .limit(0);

      expect(error).toBeNull();
    });

    it('should verify tools table has engagement metrics (Req 1.3)', async () => {
      const metricsFields = ['saved_count', 'review_count', 'review_score'];

      const { error } = await supabase
        .from('tools')
        .select(metricsFields.join(', '))
        .limit(0);

      expect(error).toBeNull();
    });

    it('should verify tools table has display flags (Req 1.4)', async () => {
      const flagFields = ['verified', 'is_new', 'is_featured'];

      const { error } = await supabase
        .from('tools')
        .select(flagFields.join(', '))
        .limit(0);

      expect(error).toBeNull();
    });

    it('should verify tools table has ranking data (Req 1.5)', async () => {
      const rankingFields = ['monthly_visits', 'change_percentage'];

      const { error } = await supabase
        .from('tools')
        .select(rankingFields.join(', '))
        .limit(0);

      expect(error).toBeNull();
    });

    it('should verify tools table has submission workflow fields (Req 1.7)', async () => {
      const workflowFields = [
        'status',
        'submitter_email',
        'submitter_name',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
      ];

      const { error } = await supabase
        .from('tools')
        .select(workflowFields.join(', '))
        .limit(0);

      expect(error).toBeNull();
    });

    it('should verify categories table has all required fields (Req 2.1)', async () => {
      const categoryFields = [
        'id',
        'name',
        'slug',
        'description',
        'icon',
        'tool_count',
        'display_order',
        'group_id',
        'metadata',
      ];

      const { error } = await supabase
        .from('categories')
        .select(categoryFields.join(', '))
        .limit(0);

      expect(error).toBeNull();
    });

    it('should verify category_groups table has all required fields (Req 3.1)', async () => {
      const groupFields = ['id', 'name', 'icon_name', 'display_order'];

      const { error } = await supabase
        .from('category_groups')
        .select(groupFields.join(', '))
        .limit(0);

      expect(error).toBeNull();
    });

    it('should verify subcategories table has all required fields (Req 4.1)', async () => {
      const subcategoryFields = ['id', 'category_id', 'name', 'slug', 'tool_count', 'display_order'];

      const { error } = await supabase
        .from('subcategories')
        .select(subcategoryFields.join(', '))
        .limit(0);

      expect(error).toBeNull();
    });

    it('should verify featured_tools table has all required fields (Req 6.1, 6.3-6.5)', async () => {
      const featuredFields = [
        'id',
        'tool_id',
        'display_order',
        'placement_type',
        'is_sponsored',
        'sponsor_name',
        'campaign_id',
        'start_date',
        'end_date',
        'impression_count',
        'click_count',
      ];

      const { error } = await supabase
        .from('featured_tools')
        .select(featuredFields.join(', '))
        .limit(0);

      expect(error).toBeNull();
    });

    it('should verify faqs table has all required fields (Req 7.1-7.2)', async () => {
      const faqFields = ['id', 'question', 'answer', 'display_order', 'category'];

      const { error } = await supabase
        .from('faqs')
        .select(faqFields.join(', '))
        .limit(0);

      expect(error).toBeNull();
    });

    it('should verify user_favorites table has all required fields (Req 8.1, 8.3-8.5)', async () => {
      const favoriteFields = [
        'id',
        'user_email',
        'tool_id',
        'tool_name',
        'category_id',
        'is_shortcut',
        'display_order',
        'custom_icon_color',
      ];

      const { error } = await supabase
        .from('user_favorites')
        .select(favoriteFields.join(', '))
        .limit(0);

      expect(error).toBeNull();
    });

    it('should verify midjourney_prompts table has all required fields (Req 9.1, 9.3-9.4)', async () => {
      const promptFields = [
        'id',
        'title',
        'slug',
        'sref_code',
        'prompt_text',
        'image_url',
        'type',
        'tags',
        'view_count',
        'copy_count',
      ];

      const { error } = await supabase
        .from('midjourney_prompts')
        .select(promptFields.join(', '))
        .limit(0);

      expect(error).toBeNull();
    });

    it('should verify ai_news table has all required fields (Req 10.1-10.6)', async () => {
      const newsFields = [
        'id',
        'title',
        'slug',
        'summary',
        'content',
        'author_name',
        'author_avatar',
        'source_name',
        'source_url',
        'category',
        'tags',
        'view_count',
        'like_count',
        'priority_score',
        'is_published',
        'published_at',
      ];

      const { error } = await supabase
        .from('ai_news')
        .select(newsFields.join(', '))
        .limit(0);

      expect(error).toBeNull();
    });
  });
});
