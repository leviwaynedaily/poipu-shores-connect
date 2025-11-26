
-- Update documents RLS policy to use unit_owners instead of profiles.unit_number
-- Then remove unit_number column from profiles

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view shared documents updated" ON documents;

-- Create new policy using unit_owners table
CREATE POLICY "Users can view shared documents updated"
ON documents FOR SELECT
USING (
  unit_number IS NULL 
  OR EXISTS (
    SELECT 1 FROM unit_owners uo
    WHERE uo.user_id = auth.uid()
    AND uo.unit_number = documents.unit_number
  )
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- Now we can safely drop the unit_number column from profiles
ALTER TABLE profiles DROP COLUMN unit_number;
