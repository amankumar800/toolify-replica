-- Create an immutable wrapper function for to_tsvector
CREATE OR REPLACE FUNCTION immutable_to_tsvector(text) RETURNS tsvector AS $$
    SELECT to_tsvector('english', $1);
$$ LANGUAGE sql IMMUTABLE;;
