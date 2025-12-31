-- =====================================================
-- ADMIN WRITE POLICIES FOR ALL CONTENT TABLES
-- These policies ensure only admins can create, update, 
-- and delete content. Public read access remains unchanged.
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
