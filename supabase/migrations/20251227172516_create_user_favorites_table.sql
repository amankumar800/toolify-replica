-- Create user_favorites table with shortcuts support
-- Requirements: 8.1-8.6

CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    tool_id TEXT NOT NULL,
    tool_name TEXT,
    category_id TEXT,
    is_shortcut BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    custom_icon_color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_tool UNIQUE(user_email, tool_id)
);

-- Add comment for documentation
COMMENT ON TABLE user_favorites IS 'User-specific tool favorites and shortcuts with customization options';

-- Create B-tree index on user_email
CREATE INDEX idx_user_favorites_user_email ON user_favorites(user_email);

-- Create B-tree index on tool_id
CREATE INDEX idx_user_favorites_tool_id ON user_favorites(tool_id);

-- Create partial B-tree index on (user_email, is_shortcut) for shortcuts
CREATE INDEX idx_user_favorites_shortcuts ON user_favorites(user_email, is_shortcut) WHERE is_shortcut = true;;
