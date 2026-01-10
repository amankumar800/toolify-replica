-- Performance indexes for common queries

-- Index on tools status for filtering by status
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);

-- Partial index on tools for featured tools (only indexes rows where is_featured = true)
CREATE INDEX IF NOT EXISTS idx_tools_is_featured ON tools(is_featured) WHERE is_featured = true;

-- Index on featured_tools placement_type for filtering by placement
CREATE INDEX IF NOT EXISTS idx_featured_tools_placement ON featured_tools(placement_type);

-- Composite index on ai_news for published articles sorted by date
CREATE INDEX IF NOT EXISTS idx_ai_news_published ON ai_news(is_published, published_at DESC);

-- Index on tool_categories for category lookups (since tools uses junction table)
CREATE INDEX IF NOT EXISTS idx_tool_categories_category ON tool_categories(category_id);

-- Index on user_favorites for user lookups (using user_email as per schema)
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_email ON user_favorites(user_email);;
