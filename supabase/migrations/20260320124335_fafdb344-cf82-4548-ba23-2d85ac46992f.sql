CREATE POLICY "Authors can delete own announcements"
ON public.announcements
FOR DELETE
TO authenticated
USING (auth.uid() = author_id);