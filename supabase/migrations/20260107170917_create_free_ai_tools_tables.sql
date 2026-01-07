-- Create free_ai_tools_categories table
CREATE TABLE IF NOT EXISTS free_ai_tools_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '',
  tool_count INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  previous_category_slug TEXT,
  previous_category_name TEXT,
  next_category_slug TEXT,
  next_category_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create free_ai_tools_subcategories table
CREATE TABLE IF NOT EXISTS free_ai_tools_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES free_ai_tools_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tool_count INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create free_ai_tools_tools table
CREATE TABLE IF NOT EXISTS free_ai_tools_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID NOT NULL REFERENCES free_ai_tools_subcategories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  external_url TEXT,
  description TEXT NOT NULL DEFAULT '',
  free_tier_details TEXT,
  pricing TEXT,
  category_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create free_ai_tools_featured table
CREATE TABLE IF NOT EXISTS free_ai_tools_featured (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  badge TEXT CHECK (badge IN ('Free', 'New', 'Popular') OR badge IS NULL),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create free_ai_tools_faqs table
CREATE TABLE IF NOT EXISTS free_ai_tools_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_free_ai_tools_categories_slug ON free_ai_tools_categories(slug);
CREATE INDEX IF NOT EXISTS idx_free_ai_tools_categories_display_order ON free_ai_tools_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_free_ai_tools_subcategories_category_id ON free_ai_tools_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_free_ai_tools_tools_subcategory_id ON free_ai_tools_tools(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_free_ai_tools_tools_slug ON free_ai_tools_tools(slug);
CREATE INDEX IF NOT EXISTS idx_free_ai_tools_featured_display_order ON free_ai_tools_featured(display_order);
CREATE INDEX IF NOT EXISTS idx_free_ai_tools_faqs_display_order ON free_ai_tools_faqs(display_order);

-- Enable RLS on all tables
ALTER TABLE free_ai_tools_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_ai_tools_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_ai_tools_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_ai_tools_featured ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_ai_tools_faqs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Allow public read access" ON free_ai_tools_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON free_ai_tools_subcategories FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON free_ai_tools_tools FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON free_ai_tools_featured FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON free_ai_tools_faqs FOR SELECT USING (true);

-- Add comments to tables
COMMENT ON TABLE free_ai_tools_categories IS 'Categories for the Free AI Tools directory';
COMMENT ON TABLE free_ai_tools_subcategories IS 'Subcategories within Free AI Tools categories';
COMMENT ON TABLE free_ai_tools_tools IS 'Individual tools in the Free AI Tools directory';
COMMENT ON TABLE free_ai_tools_featured IS 'Featured tools displayed on the Free AI Tools main page';
COMMENT ON TABLE free_ai_tools_faqs IS 'FAQ items for the Free AI Tools page';;
