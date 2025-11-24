-- Add UPDATE policy for documents table to allow moving files
CREATE POLICY "Board and admins can update documents"
ON public.documents
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'board'::app_role)
);