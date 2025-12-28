-- Apply updated_at triggers to all tables with updated_at column
-- Requirements: 12.4

-- Drop existing triggers if they exist (to make migration idempotent)
DROP TRIGGER IF EXISTS update_tools_updated_at ON tools;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_category_groups_updated_at ON category_groups;
DROP TRIGGER IF EXISTS update_subcategories_updated_at ON subcategories;
DROP TRIGGER IF EXISTS update_midjourney_prompts_updated_at ON midjourney_prompts;
DROP TRIGGER IF EXISTS update_ai_news_updated_at ON ai_news;

-- Create triggers for each table
CREATE TRIGGER update_tools_updated_at
    BEFORE UPDATE ON tools
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_groups_updated_at
    BEFORE UPDATE ON category_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcategories_updated_at
    BEFORE UPDATE ON subcategories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_midjourney_prompts_updated_at
    BEFORE UPDATE ON midjourney_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_news_updated_at
    BEFORE UPDATE ON ai_news
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();;
