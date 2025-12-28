-- Create midjourney_prompts table
-- Requirements: 9.1-9.6

CREATE TABLE midjourney_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    sref_code TEXT,
    prompt_text TEXT,
    image_url TEXT,
    type TEXT NOT NULL CHECK (type IN ('sref', 'prompt')),
    tags TEXT[] DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    copy_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE midjourney_prompts IS 'Midjourney SREF codes and prompts for AI art generation inspiration';

-- Create B-tree index on slug
CREATE INDEX idx_midjourney_prompts_slug ON midjourney_prompts(slug);

-- Create B-tree index on type
CREATE INDEX idx_midjourney_prompts_type ON midjourney_prompts(type);

-- Create B-tree index on view_count (descending for sorting)
CREATE INDEX idx_midjourney_prompts_view_count ON midjourney_prompts(view_count DESC);

-- Create B-tree index on copy_count (descending for sorting)
CREATE INDEX idx_midjourney_prompts_copy_count ON midjourney_prompts(copy_count DESC);

-- Create B-tree index on created_at (descending for sorting)
CREATE INDEX idx_midjourney_prompts_created_at ON midjourney_prompts(created_at DESC);

-- Create GIN index on tags for array containment queries
CREATE INDEX idx_midjourney_prompts_tags ON midjourney_prompts USING GIN(tags);;
