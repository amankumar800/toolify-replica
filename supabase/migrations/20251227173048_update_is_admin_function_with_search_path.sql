-- Update is_admin() function to include SET search_path = public
-- Requirements: 11.5, 11.6
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT COALESCE((raw_user_meta_data->>'role') = 'admin', false)
        FROM auth.users
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;;
