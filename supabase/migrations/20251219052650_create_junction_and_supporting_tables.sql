-- Create tool_categories junction table
CREATE TABLE IF NOT EXISTS tool_categories (
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tool_id, category_id)
);

COMMENT ON TABLE tool_categories IS 'Junction table for many-to-many tool-category relationships';

-- Create featured_tools table
CREATE TABLE IF NOT EXISTS featured_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE featured_tools IS 'Featured tools for homepage display';

-- Create faqs table
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE faqs IS 'Frequently asked questions';

-- Update user_favorites to use UUID foreign key to tools
-- Note: user_favorites already exists, we need to update it to reference tools table
ALTER TABLE user_favorites 
  ALTER COLUMN tool_id TYPE UUID USING tool_id::uuid,
  ADD CONSTRAINT fk_user_favorites_tool FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE;;
