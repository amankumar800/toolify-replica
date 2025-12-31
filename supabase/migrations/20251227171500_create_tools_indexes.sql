-- Create B-tree indexes for tools table
CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug);
CREATE INDEX IF NOT EXISTS idx_tools_pricing ON tools(pricing);
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);
CREATE INDEX IF NOT EXISTS idx_tools_is_featured ON tools(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_tools_created_at ON tools(created_at DESC);

-- Create GIN indexes for full-text search and tags
CREATE INDEX IF NOT EXISTS idx_tools_search_vector ON tools USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_tools_tags ON tools USING GIN(tags);;
