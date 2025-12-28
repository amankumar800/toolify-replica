-- Create enforce_shortcut_limit() function and trigger
-- Requirements: 8.8 - Maximum 20 shortcuts per user

-- Create the function
CREATE OR REPLACE FUNCTION public.enforce_shortcut_limit()
RETURNS TRIGGER AS $$
DECLARE
    shortcut_count INTEGER;
BEGIN
    -- Only check if is_shortcut is being set to true
    IF NEW.is_shortcut = true THEN
        -- Count existing shortcuts for this user, excluding the current record (for updates)
        SELECT COUNT(*) INTO shortcut_count
        FROM user_favorites
        WHERE user_email = NEW.user_email
          AND is_shortcut = true
          AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
        
        -- Raise exception if limit exceeded
        IF shortcut_count >= 20 THEN
            RAISE EXCEPTION 'Maximum of 20 shortcuts allowed per user';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS enforce_user_shortcut_limit ON user_favorites;

-- Create the trigger
CREATE TRIGGER enforce_user_shortcut_limit
    BEFORE INSERT OR UPDATE ON user_favorites
    FOR EACH ROW
    EXECUTE FUNCTION enforce_shortcut_limit();;
