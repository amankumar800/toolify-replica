-- Create company_pages table for managing company information pages
-- Requirements: 1.1, 2.5, 3.1, 3.2, 3.3, 3.4 (Company Pages Management)

-- Create the company_pages table
CREATE TABLE company_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE company_pages IS 'Company information pages with fixed slugs (about, contact, privacy, terms). Admins can edit title and content.';

-- Seed with the 4 fixed pages
INSERT INTO company_pages (slug, title, content) VALUES
    ('about', 'About Us', ''),
    ('contact', 'Contact', ''),
    ('privacy', 'Privacy Policy', ''),
    ('terms', 'Terms of Service', '');

-- Enable RLS
ALTER TABLE company_pages ENABLE ROW LEVEL SECURITY;

-- Create public read policy
CREATE POLICY "Public read access" ON company_pages
    FOR SELECT
    USING (true);

-- Create admin write policies
CREATE POLICY "Admins can insert company_pages" ON company_pages
    FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update company_pages" ON company_pages
    FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete company_pages" ON company_pages
    FOR DELETE
    USING (public.is_admin());

-- Create updated_at trigger
CREATE TRIGGER update_company_pages_updated_at
    BEFORE UPDATE ON company_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();;
