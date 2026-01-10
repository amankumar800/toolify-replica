-- Update tools table SELECT policy to only allow public read of published tools
-- Admins can still read all tools via is_admin() check
-- Requirements: P2-2 - Tools table should only expose published tools to public

-- Drop the existing policy
DROP POLICY IF EXISTS "Public read access" ON tools;

-- Create new policy that restricts public read to published tools only
-- Admins can read all tools regardless of status
CREATE POLICY "Public read access" ON tools
    FOR SELECT
    USING (status = 'published' OR public.is_admin());
