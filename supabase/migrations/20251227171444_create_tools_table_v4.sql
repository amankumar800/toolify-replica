CREATE TABLE IF NOT EXISTS tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    image_url TEXT,
    website_url TEXT NOT NULL,
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
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'pending', 'published', 'rejected')),
    submitter_email TEXT,
    submitter_name TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    search_vector tsvector GENERATED ALWAYS AS (
        tools_search_vector(name, short_description, description, tags)
    ) STORED
);

COMMENT ON TABLE tools IS 'AI tools directory with metadata, categorization, and submission workflow';;
