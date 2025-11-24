-- Drop the existing foreign key if it exists
ALTER TABLE public.community_photos
DROP CONSTRAINT IF EXISTS community_photos_uploaded_by_fkey;

-- Add the correct foreign key constraint to profiles table
ALTER TABLE public.community_photos
ADD CONSTRAINT community_photos_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;