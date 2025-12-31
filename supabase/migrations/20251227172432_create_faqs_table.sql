-- Create faqs table with category support
-- Requirements: 7.1-7.3

CREATE TABLE faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE faqs IS 'Frequently asked questions with page-specific targeting via category';

-- Create B-tree index on (category, display_order)
CREATE INDEX idx_faqs_category_order ON faqs(category, display_order);;
