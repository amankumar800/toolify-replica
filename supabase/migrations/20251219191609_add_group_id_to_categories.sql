-- Add group_id column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES category_groups(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_group_id ON categories(group_id);

COMMENT ON COLUMN categories.group_id IS 'Reference to the category group this category belongs to';;
