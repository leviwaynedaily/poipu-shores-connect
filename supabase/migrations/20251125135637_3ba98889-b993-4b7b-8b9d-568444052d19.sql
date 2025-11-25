-- Create a function to check if a user has a phone number by email
-- This is a security definer function that doesn't expose the actual phone number
CREATE OR REPLACE FUNCTION public.check_user_has_phone(user_email text)
RETURNS TABLE(has_phone boolean, phone_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id_var uuid;
BEGIN
  -- Get user ID from auth.users by email
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;
  
  -- If user not found, return false
  IF user_id_var IS NULL THEN
    RETURN QUERY SELECT false, NULL::text;
    RETURN;
  END IF;
  
  -- Check if user has a phone number in profiles
  RETURN QUERY
  SELECT 
    CASE WHEN p.phone IS NOT NULL AND p.phone != '' THEN true ELSE false END as has_phone,
    p.phone as phone_number
  FROM profiles p
  WHERE p.id = user_id_var;
  
  -- If no profile found, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::text;
  END IF;
END;
$$;