-- Drop the duplicate policy we just created
DROP POLICY IF EXISTS "Admins can upload to avatars bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update avatars bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete from avatars bucket" ON storage.objects;

-- Ensure the existing admin policy is correct and allows any file upload
-- First drop and recreate to ensure it's correct
DROP POLICY IF EXISTS "Admins and owners can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admins and owners can update avatars" ON storage.objects;

-- Create comprehensive admin/owner policies for avatars bucket
CREATE POLICY "Admins and owners can upload to avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
);

CREATE POLICY "Admins and owners can update in avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
);

CREATE POLICY "Admins and owners can delete from avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
);