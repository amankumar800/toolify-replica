-- Migration: Drop category_groups table and group_id column from categories
-- This migration removes the category_groups feature which was never fully implemented
-- in the frontend and is no longer needed.

-- Step 1: Drop the foreign key constraint from categories table
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_group_id_fkey;

-- Step 2: Drop the group_id column from categories table
ALTER TABLE public.categories DROP COLUMN IF EXISTS group_id;

-- Step 3: Drop the index on group_id (if exists)
DROP INDEX IF EXISTS idx_categories_group_id;

-- Step 4: Drop RLS policies on category_groups
DROP POLICY IF EXISTS "Public read access" ON public.category_groups;
DROP POLICY IF EXISTS "Admin write access" ON public.category_groups;
DROP POLICY IF EXISTS "Admin insert access" ON public.category_groups;
DROP POLICY IF EXISTS "Admin update access" ON public.category_groups;
DROP POLICY IF EXISTS "Admin delete access" ON public.category_groups;

-- Step 5: Drop the updated_at trigger on category_groups
DROP TRIGGER IF EXISTS set_updated_at ON public.category_groups;

-- Step 6: Drop the category_groups table
DROP TABLE IF EXISTS public.category_groups;

-- Add a comment to document this change
COMMENT ON TABLE public.categories IS 'Tool categories - group_id removed in migration 20260111000000';
