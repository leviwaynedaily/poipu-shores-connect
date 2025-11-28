-- Drop the existing incomplete UPDATE policy
DROP POLICY IF EXISTS "Admins can update app settings" ON app_settings;

-- Recreate with both USING and WITH CHECK clauses
CREATE POLICY "Admins can update app settings"
ON app_settings
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));