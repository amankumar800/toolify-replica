-- Create featured_tools table with sponsorship support
-- Requirements: 6.1-6.6

CREATE TABLE featured_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    placement_type TEXT DEFAULT 'homepage' CHECK (placement_type IN ('homepage', 'category', 'search')),
    is_sponsored BOOLEAN DEFAULT false,
    sponsor_name TEXT,
    campaign_id TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    impression_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE featured_tools IS 'Featured and sponsored tool placements with campaign tracking';

-- Create B-tree index on (placement_type, display_order)
CREATE INDEX idx_featured_tools_placement ON featured_tools(placement_type, display_order);

-- Create partial B-tree index on (start_date, end_date) for active sponsored campaigns
CREATE INDEX idx_featured_tools_active ON featured_tools(start_date, end_date) WHERE is_sponsored = true;;
