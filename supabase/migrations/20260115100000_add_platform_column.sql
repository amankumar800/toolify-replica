-- Migration: Add platform column to tools table
-- Purpose: Enable filtering tools by platform type (web, browser-extension, app, discord, api)
-- Date: 2026-01-15

-- Add platform column with CHECK constraint
ALTER TABLE tools ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'web'
  CHECK (platform IN ('web', 'browser-extension', 'app', 'discord', 'api'));

-- Create partial index for efficient platform filtering on published tools only
CREATE INDEX IF NOT EXISTS idx_tools_platform 
ON tools(platform) 
WHERE status = 'published';

-- Comment for documentation
COMMENT ON COLUMN tools.platform IS 'Platform type: web (default), browser-extension, app, discord, api';

-- ROLLBACK SQL (if needed):
-- DROP INDEX IF EXISTS idx_tools_platform;
-- ALTER TABLE tools DROP COLUMN IF EXISTS platform;
