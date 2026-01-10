-- Create helper function to check if current user is an admin
-- This can be used in RLS policies

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt()->'app_metadata'->>'is_admin')::boolean,
    false
  );
$$;

-- Create helper function to get admin_id from JWT
CREATE OR REPLACE FUNCTION public.get_admin_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.jwt()->'app_metadata'->>'admin_id')::uuid;
$$;

-- Create helper function to check if admin is active and not locked
CREATE OR REPLACE FUNCTION public.is_admin_active()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE((auth.jwt()->'app_metadata'->>'is_admin')::boolean, false)
    AND COALESCE((auth.jwt()->'app_metadata'->>'admin_active')::boolean, false)
    AND NOT COALESCE((auth.jwt()->'app_metadata'->>'admin_locked')::boolean, false);
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_active() TO authenticated;;
