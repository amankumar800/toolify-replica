-- Performance indexes for common queries
-- These indexes optimize read performance without affecting existing functionality

-- Index for filtering tools by status (draft, pending, published, rejected)
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);

-- Partial index for featured tools (only indexes rows where is_featured = true)
CREATE INDEX IF NOT EXISTS idx_tools_is_featured ON tools(is_featured) WHERE is_featured = true;

-- Index for featured_tools placement type queries
CREATE INDEX IF NOT EXISTS idx_featured_tools_placement ON featured_tools(placement_type);

-- Composite index for published news queries ordered by date
CREATE INDEX IF NOT EXISTS idx_ai_news_published ON ai_news(is_published, published_at DESC);

-- Index for user favorites lookup by email
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_email);

-- Index for tool_categories junction table for category-based tool lookups
CREATE INDEX IF NOT EXISTS idx_tool_categories_category ON tool_categories(category_id);;
