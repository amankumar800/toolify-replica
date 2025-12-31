-- Create an immutable function to generate the search vector for tools
CREATE OR REPLACE FUNCTION tools_search_vector(
    p_name text,
    p_short_description text,
    p_description text,
    p_tags text[]
) RETURNS tsvector AS $$
    SELECT
        setweight(to_tsvector('english', coalesce(p_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(p_short_description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(p_description, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(array_to_string(p_tags, ' '), '')), 'D');
$$ LANGUAGE sql IMMUTABLE;;
