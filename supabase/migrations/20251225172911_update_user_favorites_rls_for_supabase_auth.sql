-- Drop the overly permissive "Service role has full access" policy
-- This policy was a placeholder during next-auth usage and is now a security risk
DROP POLICY IF EXISTS "Service role has full access" ON user_favorites;

-- Add UPDATE policy (was missing)
-- Users can only update their own favorites
CREATE POLICY "Users can update own favorites" ON user_favorites
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = user_email)
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Update the column comment to reflect Supabase Auth instead of next-auth
COMMENT ON COLUMN user_favorites.user_email IS 'User email from Supabase Auth JWT';;
