-- Drop the restrictive admin-only upload policy for avatars
DROP POLICY IF EXISTS "Admins and owners can upload to avatars" ON storage.objects;

-- Create a new policy that allows admins/owners to upload anything
CREATE POLICY "Admins and owners can upload to avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'owner'::app_role)
  )
);

-- Create a specific policy for background images that any authenticated admin can upload
CREATE POLICY "Admins can upload background images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (
    name LIKE '%background%'
    OR name LIKE 'mobile-%'
    OR name LIKE 'web-%'
    OR name LIKE 'auth-logo%'
    OR name LIKE 'favicon%'
    OR name LIKE 'chicken-assistant%'
  )
  AND has_role(auth.uid(), 'admin'::app_role)
);