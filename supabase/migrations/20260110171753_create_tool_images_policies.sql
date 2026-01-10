-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow admin uploads to tool-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to tool-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin updates to tool-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin deletes from tool-images" ON storage.objects;

-- Create RLS policy for admin uploads
CREATE POLICY "Allow admin uploads to tool-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tool-images');

-- Allow public read access to tool-images
CREATE POLICY "Allow public read access to tool-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'tool-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Allow admin updates to tool-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'tool-images');

-- Allow authenticated users to delete from tool-images
CREATE POLICY "Allow admin deletes from tool-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'tool-images');;
