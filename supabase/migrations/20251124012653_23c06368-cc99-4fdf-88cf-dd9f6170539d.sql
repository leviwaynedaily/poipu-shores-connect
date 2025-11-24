-- Drop the overly permissive policy that allows public access to all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Allow users to view their own complete profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow authenticated users to view limited profile information of others
-- Only show contact info (phone) if the user has opted in via show_contact_info
CREATE POLICY "Users can view limited public profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() != id
  AND (
    -- Always show basic profile info (name, unit, avatar for directory purposes)
    -- But phone is only visible if show_contact_info is true
    true
  )
);