-- Create category_groups table
CREATE TABLE IF NOT EXISTS category_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    icon_name TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE category_groups IS 'Groups of related categories for navigation hierarchy';

-- Create B-tree index on display_order for ordering queries
CREATE INDEX IF NOT EXISTS idx_category_groups_display_order ON category_groups(display_order);;
