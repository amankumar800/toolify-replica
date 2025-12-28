# Requirements Document

## Introduction

This document defines the requirements for a production-ready, resource-optimized database schema for the AI Tools Book directory application. The schema consists of 10 tables (reduced from 17 through strategic consolidation) while maintaining all core functionality through table merging and deferral to external services.

## Glossary

- **Tools_Table**: The primary database table storing AI tool information including metadata, engagement metrics, and submission workflow data
- **Categories_Table**: Database table organizing tools into browsable categories
- **Category_Groups_Table**: Database table grouping related categories for navigation hierarchy
- **Subcategories_Table**: Database table for finer-grained categorization within categories
- **Tool_Categories_Junction**: Junction table enabling many-to-many relationships between tools and categories
- **Featured_Tools_Table**: Database table managing featured and sponsored tool placements
- **FAQs_Table**: Database table storing frequently asked questions with page-specific targeting
- **User_Favorites_Table**: Database table storing user-specific tool favorites and shortcuts
- **Midjourney_Prompts_Table**: Database table storing Midjourney SREF codes and prompts
- **AI_News_Table**: Database table storing AI news articles and blog posts
- **RLS**: Row Level Security - PostgreSQL feature for controlling data access at the row level
- **GIN_Index**: Generalized Inverted Index - PostgreSQL index type optimized for array and full-text search
- **B_Tree_Index**: Balanced tree index - PostgreSQL default index type for equality and range queries
- **tsvector**: PostgreSQL data type for full-text search document representation
- **System**: The AI Tools Book application and its database infrastructure

## Requirements

### Requirement 1: Tools Table Schema

**User Story:** As a visitor, I want to browse AI tools and submit new tools for review, so that I can discover useful AI tools and contribute to the directory.

#### Acceptance Criteria

1. THE Tools_Table SHALL store core identification fields: `id` (UUID primary key), `name` (TEXT NOT NULL), `slug` (TEXT UNIQUE NOT NULL), `description` (TEXT), `short_description` (TEXT), `image_url` (TEXT), `website_url` (TEXT NOT NULL)
2. THE Tools_Table SHALL enforce pricing values via CHECK constraint: `'Free'`, `'Freemium'`, `'Paid'`, `'Free Trial'`, `'Contact for Pricing'`
3. THE Tools_Table SHALL store engagement metrics: `saved_count` (INTEGER DEFAULT 0), `review_count` (INTEGER DEFAULT 0), `review_score` (DECIMAL(2,1) DEFAULT 0 with CHECK 0-5)
4. THE Tools_Table SHALL store boolean display flags: `verified` (DEFAULT false), `is_new` (DEFAULT false), `is_featured` (DEFAULT false)
5. THE Tools_Table SHALL store ranking data: `monthly_visits` (INTEGER), `change_percentage` (DECIMAL(5,2))
6. THE Tools_Table SHALL enforce submission workflow status via CHECK constraint: `'draft'`, `'pending'`, `'published'`, `'rejected'`
7. THE Tools_Table SHALL store submitter information: `submitter_email` (TEXT), `submitter_name` (TEXT)
8. THE Tools_Table SHALL store review workflow data: `reviewed_by` (UUID REFERENCES auth.users), `reviewed_at` (TIMESTAMPTZ), `rejection_reason` (TEXT)
9. THE Tools_Table SHALL have a generated `search_vector` tsvector column combining `name` (weight A), `short_description` (weight B), `description` (weight C), `tags` (weight D)
10. THE Tools_Table SHALL have B_Tree_Index on: `slug`, `pricing`, `status`, `is_featured`, `created_at`
11. THE Tools_Table SHALL have GIN_Index on: `search_vector`, `tags`

### Requirement 2: Categories Table Schema

**User Story:** As a visitor, I want to browse tools by category, so that I can find AI tools relevant to my specific use case.

#### Acceptance Criteria

1. THE Categories_Table SHALL store: `id` (UUID primary key), `name` (TEXT NOT NULL), `slug` (TEXT UNIQUE NOT NULL), `description` (TEXT), `icon` (TEXT), `tool_count` (INTEGER DEFAULT 0), `display_order` (INTEGER DEFAULT 0)
2. THE Categories_Table SHALL reference Category_Groups_Table via `group_id` (UUID) foreign key with ON DELETE SET NULL
3. THE Categories_Table SHALL have B_Tree_Index on: `slug`, `group_id`, `display_order`

### Requirement 3: Category Groups Table Schema

**User Story:** As a visitor, I want to see categories organized into logical groups, so that I can navigate the directory more intuitively.

#### Acceptance Criteria

1. THE Category_Groups_Table SHALL store: `id` (UUID primary key), `name` (TEXT NOT NULL UNIQUE), `icon_name` (TEXT), `display_order` (INTEGER DEFAULT 0)
2. THE Category_Groups_Table SHALL have B_Tree_Index on `display_order`

### Requirement 4: Subcategories Table Schema

**User Story:** As a visitor, I want to navigate within a category using subcategory sections, so that I can find more specific tool groupings.

#### Acceptance Criteria

1. THE Subcategories_Table SHALL store: `id` (UUID primary key), `name` (TEXT NOT NULL), `slug` (TEXT UNIQUE NOT NULL), `tool_count` (INTEGER DEFAULT 0), `display_order` (INTEGER DEFAULT 0)
2. THE Subcategories_Table SHALL reference Categories_Table via `category_id` (UUID NOT NULL) foreign key with ON DELETE CASCADE
3. THE Subcategories_Table SHALL have B_Tree_Index on: `category_id`, `slug`

### Requirement 5: Tool Categories Junction Table Schema

**User Story:** As a system administrator, I want tools to belong to multiple categories, so that users can discover tools through different category paths.

#### Acceptance Criteria

1. THE Tool_Categories_Junction SHALL use composite primary key `(tool_id, category_id)`
2. THE Tool_Categories_Junction SHALL have `tool_id` (UUID NOT NULL) foreign key to Tools_Table with ON DELETE CASCADE
3. THE Tool_Categories_Junction SHALL have `category_id` (UUID NOT NULL) foreign key to Categories_Table with ON DELETE CASCADE
4. THE Tool_Categories_Junction SHALL have B_Tree_Index on both `tool_id` and `category_id`

### Requirement 6: Featured Tools Table Schema

**User Story:** As an admin, I want to manage featured and sponsored tool placements, so that I can monetize the directory and highlight quality tools.

#### Acceptance Criteria

1. THE Featured_Tools_Table SHALL store: `id` (UUID primary key), `tool_id` (UUID NOT NULL) foreign key to Tools_Table with ON DELETE CASCADE, `display_order` (INTEGER DEFAULT 0)
2. THE Featured_Tools_Table SHALL enforce placement types via CHECK constraint: `'homepage'`, `'category'`, `'search'`
3. THE Featured_Tools_Table SHALL store sponsorship data: `is_sponsored` (BOOLEAN DEFAULT false), `sponsor_name` (TEXT), `campaign_id` (TEXT)
4. THE Featured_Tools_Table SHALL store campaign dates: `start_date` (TIMESTAMPTZ), `end_date` (TIMESTAMPTZ)
5. THE Featured_Tools_Table SHALL store performance metrics: `impression_count` (INTEGER DEFAULT 0), `click_count` (INTEGER DEFAULT 0)
6. THE Featured_Tools_Table SHALL have B_Tree_Index on `(placement_type, display_order)`
7. WHEN displaying featured tools, THE System SHALL filter by active campaigns where `start_date <= NOW() AND end_date >= NOW()`

### Requirement 7: FAQs Table Schema

**User Story:** As a visitor, I want to read FAQs relevant to the page I'm viewing, so that I can find answers to common questions.

#### Acceptance Criteria

1. THE FAQs_Table SHALL store: `id` (UUID primary key), `question` (TEXT NOT NULL), `answer` (TEXT NOT NULL in markdown format), `display_order` (INTEGER DEFAULT 0)
2. THE FAQs_Table SHALL support page-specific FAQs via `category` (TEXT DEFAULT 'general') column
3. THE FAQs_Table SHALL have B_Tree_Index on `(category, display_order)`

### Requirement 8: User Favorites Table Schema

**User Story:** As a signed-in user, I want to save favorite tools and customize my quick-access list, so that I can easily return to tools I use frequently.

#### Acceptance Criteria

1. THE User_Favorites_Table SHALL store: `id` (UUID primary key), `user_email` (TEXT NOT NULL), `tool_id` (TEXT NOT NULL), `tool_name` (TEXT), `category_id` (TEXT)
2. THE User_Favorites_Table SHALL enforce unique constraint on `(user_email, tool_id)`
3. THE User_Favorites_Table SHALL support shortcuts via `is_shortcut` (BOOLEAN DEFAULT false)
4. THE User_Favorites_Table SHALL support ordering via `display_order` (INTEGER DEFAULT 0)
5. THE User_Favorites_Table SHALL support customization via `custom_icon_color` (TEXT)
6. THE User_Favorites_Table SHALL have B_Tree_Index on: `user_email`, `tool_id`, `(user_email, is_shortcut)`
7. THE User_Favorites_Table SHALL have RLS policies allowing users to manage only their own records
8. THE System SHALL limit shortcuts where `is_shortcut = true` to maximum 20 per user

### Requirement 9: Midjourney Prompts Table Schema

**User Story:** As a creative user, I want to browse Midjourney SREF codes and prompts, so that I can find inspiration for AI art generation.

#### Acceptance Criteria

1. THE Midjourney_Prompts_Table SHALL store: `id` (UUID primary key), `title` (TEXT NOT NULL), `slug` (TEXT UNIQUE NOT NULL), `sref_code` (TEXT), `prompt_text` (TEXT), `image_url` (TEXT)
2. THE Midjourney_Prompts_Table SHALL enforce entry types via CHECK constraint: `'sref'`, `'prompt'`
3. THE Midjourney_Prompts_Table SHALL support multiple tags via `tags` (TEXT[] DEFAULT '{}')
4. THE Midjourney_Prompts_Table SHALL store engagement metrics: `view_count` (INTEGER DEFAULT 0), `copy_count` (INTEGER DEFAULT 0)
5. THE Midjourney_Prompts_Table SHALL have B_Tree_Index on: `slug`, `type`
6. THE Midjourney_Prompts_Table SHALL have GIN_Index on `tags`
7. THE Midjourney_Prompts_Table SHALL support sorting by: `created_at`, `view_count`, `copy_count`

### Requirement 10: AI News Table Schema

**User Story:** As a visitor, I want to read AI news and blog posts, so that I can stay updated on AI industry developments.

#### Acceptance Criteria

1. THE AI_News_Table SHALL store article info: `id` (UUID primary key), `title` (TEXT NOT NULL), `slug` (TEXT UNIQUE NOT NULL), `summary` (TEXT), `content` (TEXT in markdown format)
2. THE AI_News_Table SHALL store author info: `author_name` (TEXT), `author_avatar` (TEXT)
3. THE AI_News_Table SHALL store source info: `source_name` (TEXT), `source_url` (TEXT)
4. THE AI_News_Table SHALL categorize via `category` (TEXT) and `tags` (TEXT[] DEFAULT '{}')
5. THE AI_News_Table SHALL store engagement metrics: `view_count` (INTEGER DEFAULT 0), `like_count` (INTEGER DEFAULT 0), `priority_score` (INTEGER DEFAULT 0)
6. THE AI_News_Table SHALL support draft/published workflow via `is_published` (BOOLEAN DEFAULT false)
7. THE AI_News_Table SHALL have B_Tree_Index on: `slug`, `category`, `published_at DESC`, `is_published`
8. THE AI_News_Table SHALL have GIN_Index on `tags`
9. WHEN displaying news, THE System SHALL order by `priority_score DESC`, `published_at DESC`

### Requirement 11: Row Level Security Policies

**User Story:** As a system administrator, I want data access controlled at the database level, so that unauthorized users cannot access or modify protected data.

#### Acceptance Criteria

1. THE System SHALL enable RLS on all tables
2. THE System SHALL allow public read access to: Tools_Table, Categories_Table, Category_Groups_Table, Subcategories_Table, Tool_Categories_Junction, Featured_Tools_Table, FAQs_Table, Midjourney_Prompts_Table
3. THE System SHALL allow public read access to AI_News_Table only WHERE `is_published = true`
4. THE System SHALL restrict User_Favorites_Table to owner-only access for SELECT, INSERT, UPDATE, DELETE operations
5. THE System SHALL use `is_admin()` function for admin write operations on all public tables
6. THE `is_admin()` function SHALL be created with SECURITY DEFINER and immutable `search_path` set to `'public'`
7. THE System SHALL allow public INSERT on Tools_Table only WHERE `status = 'pending'` for tool submissions

### Requirement 12: Database Performance Optimization

**User Story:** As a system administrator, I want the database to perform efficiently under load, so that users experience fast response times.

#### Acceptance Criteria

1. THE System SHALL use B_Tree_Index for equality and range queries on frequently filtered columns
2. THE System SHALL use GIN_Index for array containment queries on `tags` columns and `search_vector` columns
3. THE System SHALL use partial indexes for boolean flags (e.g., `WHERE is_featured = true`)
4. THE System SHALL implement `updated_at` triggers for automatic timestamp updates on all tables with `updated_at` columns
5. THE System SHALL use foreign key constraints with ON DELETE CASCADE for referential integrity
6. THE System SHALL use connection pooling via Supabase built-in pooler

### Requirement 13: Full-Text Search Optimization

**User Story:** As a visitor, I want fast and relevant search results, so that I can quickly find tools matching my needs.

#### Acceptance Criteria

1. THE Tools_Table SHALL have a generated `search_vector` tsvector column using GENERATED ALWAYS AS STORED
2. THE `search_vector` SHALL combine weighted vectors: `name` (weight A), `short_description` (weight B), `description` (weight C), `tags` (weight D)
3. THE Tools_Table SHALL have GIN_Index on `search_vector`
4. THE System SHALL use `ts_rank()` function for relevance scoring in search queries
5. WHEN a tool is inserted or updated, THE System SHALL automatically update `search_vector` via the generated column

---

## Entity Relationship Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| Category_Groups_Table → Categories_Table | 1:N | One group has many categories |
| Categories_Table → Subcategories_Table | 1:N | One category has many subcategories |
| Tools_Table ↔ Categories_Table | M:N | Many-to-many via Tool_Categories_Junction |
| Tools_Table → Featured_Tools_Table | 1:N | One tool can have multiple featured placements |
| Tools_Table → User_Favorites_Table | 1:N | One tool can be favorited by many users |
| auth.users → User_Favorites_Table | 1:N | One user can have many favorites |

## Standalone Tables

The following tables have no foreign key relationships to other application tables:
- Midjourney_Prompts_Table
- AI_News_Table
- FAQs_Table
