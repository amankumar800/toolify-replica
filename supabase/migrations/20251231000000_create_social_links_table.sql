-- Create social_links table for managing social media URLs
-- Requirements: 1.1, 1.3 (Social Links Management)

-- Create the social_links table
CREATE TABLE social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL UNIQUE,
    url TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE social_links IS 'Social media links for website footer. Platform names are fixed (twitter, linkedin, facebook, instagram).';

-- Seed with the 4 fixed platforms
INSERT INTO social_links (platform, url) VALUES
    ('twitter', ''),
    ('linkedin', ''),
    ('facebook', ''),
    ('instagram', '');

-- Enable RLS
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

-- Create public read policy
CREATE POLICY "Public read access" ON social_links
    FOR SELECT
    USING (true);

-- Create admin write policies
CREATE POLICY "Admins can insert social_links" ON social_links
    FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update social_links" ON social_links
    FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete social_links" ON social_links
    FOR DELETE
    USING (public.is_admin());

-- Create updated_at trigger
CREATE TRIGGER update_social_links_updated_at
    BEFORE UPDATE ON social_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
