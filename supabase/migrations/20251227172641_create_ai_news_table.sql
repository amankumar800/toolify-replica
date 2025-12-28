-- Create ai_news table
-- Requirements: 10.1-10.8

CREATE TABLE ai_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    summary TEXT,
    content TEXT,
    author_name TEXT,
    author_avatar TEXT,
    source_name TEXT,
    source_url TEXT,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    priority_score INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE ai_news IS 'AI news articles and blog posts with publication workflow';

-- Create B-tree index on slug
CREATE INDEX idx_ai_news_slug ON ai_news(slug);

-- Create B-tree index on category
CREATE INDEX idx_ai_news_category ON ai_news(category);

-- Create composite B-tree index on (is_published, published_at DESC)
CREATE INDEX idx_ai_news_published ON ai_news(is_published, published_at DESC);

-- Create composite B-tree index on (priority_score DESC, published_at DESC)
CREATE INDEX idx_ai_news_priority ON ai_news(priority_score DESC, published_at DESC);

-- Create GIN index on tags for array containment queries
CREATE INDEX idx_ai_news_tags ON ai_news USING GIN(tags);;
