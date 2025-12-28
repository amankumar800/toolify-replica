-- Migration: Drop ALL custom tables for complete reimplementation
-- Date: 2024-12-26
-- Reason: Starting fresh with new database design

-- ============================================
-- 1. Drop all remaining tables
-- ============================================

-- Drop subcategories (depends on categories)
DROP TABLE IF EXISTS subcategories CASCADE;
-- Drop categories (may have group_id FK to category_groups)
DROP TABLE IF EXISTS categories CASCADE;
-- Drop category_groups
DROP TABLE IF EXISTS category_groups CASCADE;
-- Drop faqs
DROP TABLE IF EXISTS faqs CASCADE;
-- ============================================
-- 2. Drop shared functions and triggers
-- ============================================

-- Drop the update_updated_at function (used by multiple tables)
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
-- ============================================
-- 3. Safety: Drop any tables that might still exist
--    (in case previous migration didn't run)
-- ============================================

DROP TABLE IF EXISTS user_favorites CASCADE;
DROP TABLE IF EXISTS featured_tools CASCADE;
DROP TABLE IF EXISTS tool_categories CASCADE;
DROP TABLE IF EXISTS tools CASCADE;
-- ============================================
-- Summary: Complete database reset
-- ============================================
-- All custom tables dropped:
--   - tools
--   - categories
--   - category_groups
--   - subcategories
--   - tool_categories
--   - featured_tools
--   - user_favorites
--   - faqs
--
-- All custom functions dropped:
--   - update_updated_at()
--
-- All triggers, indexes, and RLS policies auto-dropped with tables
--
-- Supabase system tables (auth, storage, etc.) are NOT affected
-- ============================================;
