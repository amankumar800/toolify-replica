-- Create user_favorites table for bookmarking AI tools
CREATE TABLE user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  tool_id text NOT NULL,
  tool_name text,
  category_id text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_tool UNIQUE(user_email, tool_id)
);

-- Add comments for documentation
COMMENT ON TABLE user_favorites IS 'Stores user favorite/bookmarked AI tools';
COMMENT ON COLUMN user_favorites.user_email IS 'User email from Supabase Auth JWT';
COMMENT ON COLUMN user_favorites.tool_id IS 'Tool ID matching the JSON data files';
COMMENT ON COLUMN user_favorites.tool_name IS 'Denormalized tool name for quick display';
COMMENT ON COLUMN user_favorites.category_id IS 'Category ID for filtering';

-- Create indexes for fast lookups
CREATE INDEX idx_user_favorites_user_email ON user_favorites(user_email);
CREATE INDEX idx_user_favorites_tool_id ON user_favorites(tool_id);
CREATE INDEX idx_user_favorites_category ON user_favorites(category_id);

-- Enable Row Level Security
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Initial permissive policy (will be replaced by proper RLS policies in later migration)
-- This policy is superseded by 20251225172911_update_user_favorites_rls_for_supabase_auth.sql
CREATE POLICY "Service role has full access" ON user_favorites
  FOR ALL USING (true) WITH CHECK (true);;
