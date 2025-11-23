-- Add foreign key constraint to community_photos
ALTER TABLE public.community_photos
ADD CONSTRAINT community_photos_uploaded_by_fkey
FOREIGN KEY (uploaded_by)
REFERENCES auth.users(id)
ON DELETE CASCADE;