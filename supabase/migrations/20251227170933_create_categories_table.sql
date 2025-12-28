-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    tool_count INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    group_id UUID REFERENCES category_groups(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'Tool categories for organization and filtering';

-- Create B-tree indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_group_id ON categories(group_id);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);;
