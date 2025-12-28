-- =====================================================
-- COMBINED DATABASE SETUP SCRIPT
-- Run this ENTIRE script in Supabase SQL Editor
-- This creates all tables, indexes, policies, and triggers
-- =====================================================

-- =====================================================
-- PART 1: USER FAVORITES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  tool_id text NOT NULL,
  tool_name text,
  category_id text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_tool UNIQUE(user_email, tool_id)
);

COMMENT ON TABLE user_favorites IS 'Stores user favorite/bookmarked AI tools';

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_email ON user_favorites(user_email);
CREATE INDEX IF NOT EXISTS idx_user_favorites_tool_id ON user_favorites(tool_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_category ON user_favorites(category_id);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 2: TOOLS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  website_url TEXT NOT NULL,
  external_url TEXT,
  pricing TEXT DEFAULT 'Freemium' CHECK (pricing IN ('Free', 'Freemium', 'Paid', 'Free Trial', 'Contact for Pricing')),
  tags TEXT[] DEFAULT '{}',
  saved_count INTEGER DEFAULT 0 CHECK (saved_count >= 0),
  review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
  review_score DECIMAL(2,1) DEFAULT 0 CHECK (review_score >= 0 AND review_score <= 5),
  verified BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  monthly_visits INTEGER,
  change_percentage DECIMAL(5,2),
  free_tier_details TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE tools IS 'AI tools directory with metadata and categorization';

-- =====================================================
-- PART 3: CATEGORY GROUPS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS category_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon_name TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE category_groups IS 'Groups of related categories for navigation';

-- =====================================================
-- PART 4: CATEGORIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  tool_count INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'Tool categories for organization and filtering';

-- =====================================================
-- PART 5: SUBCATEGORIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tool_count INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE subcategories IS 'Subcategories within main categories';

-- =====================================================
-- PART 6: JUNCTION AND SUPPORTING TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS tool_categories (
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tool_id, category_id)
);

COMMENT ON TABLE tool_categories IS 'Junction table for many-to-many tool-category relationships';

CREATE TABLE IF NOT EXISTS featured_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE featured_tools IS 'Featured tools for homepage display';

CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE faqs IS 'Frequently asked questions';

-- =====================================================
-- PART 7: INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug);
CREATE INDEX IF NOT EXISTS idx_tools_pricing ON tools(pricing);
CREATE INDEX IF NOT EXISTS idx_tools_is_featured ON tools(is_featured);
CREATE INDEX IF NOT EXISTS idx_tools_created_at ON tools(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_tool_categories_tool ON tool_categories(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_categories_category ON tool_categories(category_id);

-- =====================================================
-- PART 8: ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 9: PUBLIC READ POLICIES
-- =====================================================

CREATE POLICY "Public read access" ON tools FOR SELECT USING (true);
CREATE POLICY "Public read access" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON category_groups FOR SELECT USING (true);
CREATE POLICY "Public read access" ON subcategories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON tool_categories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON featured_tools FOR SELECT USING (true);
CREATE POLICY "Public read access" ON faqs FOR SELECT USING (true);

-- User favorites RLS
CREATE POLICY "Users can view own favorites" ON user_favorites 
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can insert own favorites" ON user_favorites 
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can update own favorites" ON user_favorites
  FOR UPDATE USING (auth.jwt() ->> 'email' = user_email)
  WITH CHECK (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can delete own favorites" ON user_favorites 
  FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- =====================================================
-- PART 10: UPDATED_AT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tools_updated_at
  BEFORE UPDATE ON tools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_subcategories_updated_at
  BEFORE UPDATE ON subcategories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_category_groups_updated_at
  BEFORE UPDATE ON category_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- PART 11: ADD GROUP_ID TO CATEGORIES
-- =====================================================

ALTER TABLE categories ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES category_groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_categories_group_id ON categories(group_id);

-- =====================================================
-- PART 12: IS_ADMIN FUNCTION (for RBAC)
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE((raw_user_meta_data->>'role') = 'admin', false)
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =====================================================
-- PART 13: ADMIN WRITE POLICIES
-- =====================================================

-- Tools table
CREATE POLICY "Admins can insert tools" ON tools
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update tools" ON tools
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete tools" ON tools
  FOR DELETE USING (public.is_admin());

-- Categories table  
CREATE POLICY "Admins can insert categories" ON categories
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update categories" ON categories
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete categories" ON categories
  FOR DELETE USING (public.is_admin());

-- Category groups table
CREATE POLICY "Admins can insert category_groups" ON category_groups
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update category_groups" ON category_groups
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete category_groups" ON category_groups
  FOR DELETE USING (public.is_admin());

-- Subcategories table
CREATE POLICY "Admins can insert subcategories" ON subcategories
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update subcategories" ON subcategories
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete subcategories" ON subcategories
  FOR DELETE USING (public.is_admin());

-- Tool categories junction table
CREATE POLICY "Admins can insert tool_categories" ON tool_categories
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete tool_categories" ON tool_categories
  FOR DELETE USING (public.is_admin());

-- Featured tools table
CREATE POLICY "Admins can insert featured_tools" ON featured_tools
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update featured_tools" ON featured_tools
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete featured_tools" ON featured_tools
  FOR DELETE USING (public.is_admin());

-- FAQs table
CREATE POLICY "Admins can insert faqs" ON faqs
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update faqs" ON faqs
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete faqs" ON faqs
  FOR DELETE USING (public.is_admin());

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
