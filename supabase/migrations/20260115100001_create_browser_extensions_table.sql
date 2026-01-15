-- Migration: Create browser_extensions metadata table
-- Purpose: Store browser extension specific data (store URLs, ratings, install counts)
-- Date: 2026-01-15

-- Create browser_extensions table
CREATE TABLE IF NOT EXISTS browser_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  chrome_store_url TEXT,
  firefox_store_url TEXT,
  edge_store_url TEXT,
  safari_store_url TEXT,
  install_count INTEGER DEFAULT 0,
  rating NUMERIC(3,2) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_browser_extension_tool UNIQUE (tool_id)
);

-- Enable Row Level Security
ALTER TABLE browser_extensions ENABLE ROW LEVEL SECURITY;

-- Public read access (anonymous can read)
CREATE POLICY "browser_extensions_select_all" ON browser_extensions
  FOR SELECT USING (true);

-- Authenticated users can insert
CREATE POLICY "browser_extensions_insert_auth" ON browser_extensions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update
CREATE POLICY "browser_extensions_update_auth" ON browser_extensions
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Admin delete (using existing is_admin function pattern)
CREATE POLICY "browser_extensions_delete_admin" ON browser_extensions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE supabase_user_id = auth.uid()
    )
  );

-- Add updated_at trigger using existing trigger function
CREATE TRIGGER update_browser_extensions_updated_at
  BEFORE UPDATE ON browser_extensions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment for documentation
COMMENT ON TABLE browser_extensions IS 'Metadata for browser extension tools (Chrome/Firefox/Edge store URLs, ratings)';

-- ROLLBACK SQL (if needed):
-- DROP TABLE IF EXISTS browser_extensions;
