-- Migration: Drop tools table and all related/dependent objects
-- Date: 2024-12-26
-- Reason: Preparing for reimplementation of tools schema
-- Note: Using CASCADE to handle all dependencies automatically

-- Drop all tools-related tables
DROP TABLE IF EXISTS user_favorites CASCADE;
DROP TABLE IF EXISTS featured_tools CASCADE;
DROP TABLE IF EXISTS tool_categories CASCADE;
DROP TABLE IF EXISTS tools CASCADE;
