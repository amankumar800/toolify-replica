-- Add 'archived' status to tools table for soft delete functionality
-- Requirements: 19.1

-- Drop the existing constraint
ALTER TABLE tools DROP CONSTRAINT IF EXISTS tools_status_check;

-- Add new constraint with 'archived' status
ALTER TABLE tools ADD CONSTRAINT tools_status_check 
    CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'archived'));

COMMENT ON COLUMN tools.status IS 'Tool publication status: draft, pending, published, rejected, or archived (soft delete)';
