-- Add storage policies for community_photos bucket to allow authenticated users to upload
-- Policy to allow authenticated users to upload to community_photos bucket
CREATE POLICY "Authenticated users can upload to community_photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community_photos'
);

-- Policy to allow users to update their own uploads
CREATE POLICY "Users can update own uploads in community_photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'community_photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to delete their own uploads
CREATE POLICY "Users can delete own uploads in community_photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'community_photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow everyone to view files in community_photos (since bucket is public)
CREATE POLICY "Public access to community_photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'community_photos');