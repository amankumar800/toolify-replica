-- Update tools table RLS policy to only allow public read of published tools
-- Admins can still read all tools via is_admin() function

-- Drop the existing public read policy
DROP POLICY IF EXISTS "Public read access" ON public.tools;

-- Create new policy that restricts public read to published tools only
-- Admins (via is_admin()) can read all tools
CREATE POLICY "Public read access" ON public.tools
    FOR SELECT
    USING (status = 'published' OR is_admin());

-- Add comment explaining the policy
COMMENT ON POLICY "Public read access" ON public.tools IS 'Public users can only read published tools. Admins can read all tools.';;
