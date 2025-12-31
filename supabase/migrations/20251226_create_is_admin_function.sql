-- =====================================================
-- IS_ADMIN() FUNCTION
-- Checks if the current authenticated user is an admin
-- by looking at their user_metadata.role field
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE((raw_user_meta_data->>'role') = 'admin', false)
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

COMMENT ON FUNCTION public.is_admin() IS 'Returns true if the current user has admin role in their metadata';
