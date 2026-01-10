-- Create Custom Access Token Hook for admin authentication
-- This hook adds admin claims to the JWT when an admin user logs in

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  admin_record RECORD;
  user_id uuid;
BEGIN
  -- Get the user_id from the event
  user_id := (event->>'user_id')::uuid;
  
  -- Get claims from event
  claims := event->'claims';
  
  -- Check if this user is an admin
  SELECT id, email, is_active, locked_until
  INTO admin_record
  FROM public.admins
  WHERE supabase_user_id = user_id;
  
  IF admin_record.id IS NOT NULL THEN
    -- User is an admin, add admin claims to app_metadata
    -- Check if app_metadata exists
    IF jsonb_typeof(claims->'app_metadata') IS NULL THEN
      claims := jsonb_set(claims, '{app_metadata}', '{}');
    END IF;
    
    -- Set admin claims
    claims := jsonb_set(claims, '{app_metadata, is_admin}', 'true');
    claims := jsonb_set(claims, '{app_metadata, admin_id}', to_jsonb(admin_record.id::text));
    claims := jsonb_set(claims, '{app_metadata, admin_active}', to_jsonb(COALESCE(admin_record.is_active, true)));
    
    -- Check if account is locked
    IF admin_record.locked_until IS NOT NULL AND admin_record.locked_until > NOW() THEN
      claims := jsonb_set(claims, '{app_metadata, admin_locked}', 'true');
    ELSE
      claims := jsonb_set(claims, '{app_metadata, admin_locked}', 'false');
    END IF;
  ELSE
    -- Not an admin, ensure is_admin is false
    IF jsonb_typeof(claims->'app_metadata') IS NULL THEN
      claims := jsonb_set(claims, '{app_metadata}', '{}');
    END IF;
    claims := jsonb_set(claims, '{app_metadata, is_admin}', 'false');
  END IF;
  
  -- Update the claims in the event
  event := jsonb_set(event, '{claims}', claims);
  
  RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- Grant read access to admins table for the hook
GRANT SELECT ON TABLE public.admins TO supabase_auth_admin;

-- Create policy for auth admin to read admins table
DROP POLICY IF EXISTS "Allow auth admin to read admins" ON public.admins;
CREATE POLICY "Allow auth admin to read admins" ON public.admins
  AS PERMISSIVE FOR SELECT
  TO supabase_auth_admin
  USING (true);;
