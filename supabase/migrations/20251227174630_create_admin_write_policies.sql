-- Create admin write policies
-- Requirements: 11.5, 11.7

-- Tools: Admin can insert, update, delete. Public can insert with status='pending'
CREATE POLICY "Admins can insert tools" ON tools
    FOR INSERT
    WITH CHECK (public.is_admin() OR status = 'pending');

CREATE POLICY "Admins can update tools" ON tools
    FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete tools" ON tools
    FOR DELETE
    USING (public.is_admin());

-- Categories: Admin only write access
CREATE POLICY "Admins can insert categories" ON categories
    FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update categories" ON categories
    FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete categories" ON categories
    FOR DELETE
    USING (public.is_admin());

-- Category Groups: Admin only write access
CREATE POLICY "Admins can insert category_groups" ON category_groups
    FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update category_groups" ON category_groups
    FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete category_groups" ON category_groups
    FOR DELETE
    USING (public.is_admin());

-- Subcategories: Admin only write access
CREATE POLICY "Admins can insert subcategories" ON subcategories
    FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update subcategories" ON subcategories
    FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete subcategories" ON subcategories
    FOR DELETE
    USING (public.is_admin());

-- Tool Categories: Admin only write access
CREATE POLICY "Admins can insert tool_categories" ON tool_categories
    FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update tool_categories" ON tool_categories
    FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete tool_categories" ON tool_categories
    FOR DELETE
    USING (public.is_admin());

-- Featured Tools: Admin only write access
CREATE POLICY "Admins can insert featured_tools" ON featured_tools
    FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update featured_tools" ON featured_tools
    FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete featured_tools" ON featured_tools
    FOR DELETE
    USING (public.is_admin());

-- FAQs: Admin only write access
CREATE POLICY "Admins can insert faqs" ON faqs
    FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update faqs" ON faqs
    FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete faqs" ON faqs
    FOR DELETE
    USING (public.is_admin());

-- Midjourney Prompts: Admin only write access
CREATE POLICY "Admins can insert midjourney_prompts" ON midjourney_prompts
    FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update midjourney_prompts" ON midjourney_prompts
    FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete midjourney_prompts" ON midjourney_prompts
    FOR DELETE
    USING (public.is_admin());

-- AI News: Admin only write access
CREATE POLICY "Admins can insert ai_news" ON ai_news
    FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update ai_news" ON ai_news
    FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete ai_news" ON ai_news
    FOR DELETE
    USING (public.is_admin());;
