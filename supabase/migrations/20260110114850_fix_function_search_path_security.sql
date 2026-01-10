-- Fix security warning: Mutable search_path in functions
-- Adding SET search_path = public to all affected functions

-- 1. Fix enforce_shortcut_limit function
CREATE OR REPLACE FUNCTION public.enforce_shortcut_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
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
$function$;

-- 2. Fix immutable_to_tsvector function
CREATE OR REPLACE FUNCTION public.immutable_to_tsvector(text)
 RETURNS tsvector
 LANGUAGE sql
 IMMUTABLE
 SET search_path = public
AS $function$
    SELECT to_tsvector('english', $1);
$function$;

-- 3. Fix immutable_weighted_tsvector function
CREATE OR REPLACE FUNCTION public.immutable_weighted_tsvector(text_value text, weight "char")
 RETURNS tsvector
 LANGUAGE sql
 IMMUTABLE
 SET search_path = public
AS $function$
    SELECT setweight(to_tsvector('english', text_value), weight);
$function$;

-- 4. Fix tools_search_vector function
CREATE OR REPLACE FUNCTION public.tools_search_vector(p_name text, p_short_description text, p_description text, p_tags text[])
 RETURNS tsvector
 LANGUAGE sql
 IMMUTABLE
 SET search_path = public
AS $function$
    SELECT
        setweight(to_tsvector('english', coalesce(p_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(p_short_description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(p_description, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(array_to_string(p_tags, ' '), '')), 'D');
$function$;

-- 5. Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;;
