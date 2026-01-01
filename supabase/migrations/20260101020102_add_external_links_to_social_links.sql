-- Add external link platforms to social_links table
-- Requirements: 5.4 (Company Pages Management)

-- Insert community and help_center platform rows
INSERT INTO social_links (platform, url) VALUES
    ('community', ''),
    ('help_center', '')
ON CONFLICT (platform) DO NOTHING;;
