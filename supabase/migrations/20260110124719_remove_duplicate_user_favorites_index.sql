-- Remove duplicate index on user_favorites
-- idx_user_favorites_user and idx_user_favorites_user_email are identical
DROP INDEX IF EXISTS idx_user_favorites_user_email;;
