-- Add RLS policy to allow users to delete their own photos
CREATE POLICY "Users can delete own photos"
ON public.community_photos
FOR DELETE
USING (auth.uid() = uploaded_by);