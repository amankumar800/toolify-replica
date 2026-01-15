-- Migration: Add platform availability columns to tools table
-- Purpose: Enable filtering tools by platform (mobile app, browser extension, Discord)
-- Part of: Apps Filter Implementation

-- Add columns with safe IF NOT EXISTS
ALTER TABLE tools ADD COLUMN IF NOT EXISTS has_mobile_app BOOLEAN DEFAULT false;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS has_browser_extension BOOLEAN DEFAULT false;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS has_discord_bot BOOLEAN DEFAULT false;

-- Partial indexes for efficient WHERE clause filtering
-- Only indexes rows where the flag is true AND tool is published (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_tools_mobile_app 
  ON tools(has_mobile_app) WHERE has_mobile_app = true AND status = 'published';

CREATE INDEX IF NOT EXISTS idx_tools_browser_ext 
  ON tools(has_browser_extension) WHERE has_browser_extension = true AND status = 'published';

CREATE INDEX IF NOT EXISTS idx_tools_discord 
  ON tools(has_discord_bot) WHERE has_discord_bot = true AND status = 'published';

-- Note: RLS policies don't need updating - existing public read policy covers new columns
-- Admin write policy uses is_admin() which already grants full write access
