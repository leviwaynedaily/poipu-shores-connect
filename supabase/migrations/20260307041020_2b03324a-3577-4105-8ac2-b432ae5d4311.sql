
-- Update announcements insert policy to include board members
DROP POLICY IF EXISTS "Admins and owners can create announcements" ON public.announcements;
CREATE POLICY "Admins owners and board can create announcements"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'board'::app_role)
);

-- Update announcements update policy to include board members
DROP POLICY IF EXISTS "Admins and owners can update announcements" ON public.announcements;
CREATE POLICY "Admins owners and board can update announcements"
ON public.announcements
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'board'::app_role)
);
