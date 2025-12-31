-- Create user_favorites RLS policies for owner-only access
-- Requirements: 8.7, 11.4

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites" ON user_favorites
    FOR SELECT
    USING (auth.jwt() ->> 'email' = user_email);

-- Users can insert their own favorites
CREATE POLICY "Users can insert own favorites" ON user_favorites
    FOR INSERT
    WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Users can update their own favorites
CREATE POLICY "Users can update own favorites" ON user_favorites
    FOR UPDATE
    USING (auth.jwt() ->> 'email' = user_email)
    WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites" ON user_favorites
    FOR DELETE
    USING (auth.jwt() ->> 'email' = user_email);;
