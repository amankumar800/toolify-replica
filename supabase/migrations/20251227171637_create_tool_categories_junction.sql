-- Create tool_categories junction table with composite primary key
CREATE TABLE IF NOT EXISTS tool_categories (
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tool_id, category_id)
);

COMMENT ON TABLE tool_categories IS 'Junction table for many-to-many tool-category relationships';

-- Create B-tree indexes on both columns
CREATE INDEX IF NOT EXISTS idx_tool_categories_tool ON tool_categories(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_categories_category ON tool_categories(category_id);;
