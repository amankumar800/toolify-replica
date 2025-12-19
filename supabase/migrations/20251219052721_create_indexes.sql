-- Create indexes for tools table
CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug);
CREATE INDEX IF NOT EXISTS idx_tools_pricing ON tools(pricing);
CREATE INDEX IF NOT EXISTS idx_tools_is_featured ON tools(is_featured);
CREATE INDEX IF NOT EXISTS idx_tools_created_at ON tools(created_at DESC);

-- Create indexes for categories table
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Create index for subcategories table
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);

-- Create indexes for tool_categories junction table
CREATE INDEX IF NOT EXISTS idx_tool_categories_tool ON tool_categories(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_categories_category ON tool_categories(category_id);;
