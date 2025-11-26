-- Drop the existing policy that allows both admins and owners
DROP POLICY IF EXISTS "Admins and owners can view all login history" ON public.login_history;

-- Create new policy that only allows admins to view login history
CREATE POLICY "Admins can view all login history" 
ON public.login_history 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));