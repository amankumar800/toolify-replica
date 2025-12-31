-- Create public read policies
-- Requirements: 11.2, 11.3

-- Public read access for tools
CREATE POLICY "Public read access" ON tools
    FOR SELECT
    USING (true);

-- Public read access for categories
CREATE POLICY "Public read access" ON categories
    FOR SELECT
    USING (true);

-- Public read access for category_groups
CREATE POLICY "Public read access" ON category_groups
    FOR SELECT
    USING (true);

-- Public read access for subcategories
CREATE POLICY "Public read access" ON subcategories
    FOR SELECT
    USING (true);

-- Public read access for tool_categories
CREATE POLICY "Public read access" ON tool_categories
    FOR SELECT
    USING (true);

-- Public read access for featured_tools
CREATE POLICY "Public read access" ON featured_tools
    FOR SELECT
    USING (true);

-- Public read access for faqs
CREATE POLICY "Public read access" ON faqs
    FOR SELECT
    USING (true);

-- Public read access for midjourney_prompts
CREATE POLICY "Public read access" ON midjourney_prompts
    FOR SELECT
    USING (true);

-- Filtered read access for ai_news (only published articles)
CREATE POLICY "Public read access" ON ai_news
    FOR SELECT
    USING (is_published = true);;
