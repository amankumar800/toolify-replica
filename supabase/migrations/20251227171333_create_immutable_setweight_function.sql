-- Create an immutable wrapper function for setweight with to_tsvector
CREATE OR REPLACE FUNCTION immutable_weighted_tsvector(text_value text, weight "char") RETURNS tsvector AS $$
    SELECT setweight(to_tsvector('english', text_value), weight);
$$ LANGUAGE sql IMMUTABLE;;
