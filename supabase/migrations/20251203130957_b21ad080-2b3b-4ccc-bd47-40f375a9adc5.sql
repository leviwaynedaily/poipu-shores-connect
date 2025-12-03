-- Create function to lookup user by phone number
CREATE OR REPLACE FUNCTION public.check_user_by_phone(user_phone text)
RETURNS TABLE(user_exists boolean, user_email text, e164_phone text)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  cleaned_phone text;
  found_user_id uuid;
  found_email text;
BEGIN
  -- Clean the phone number (remove non-digits)
  cleaned_phone := regexp_replace(user_phone, '\D', '', 'g');
  
  -- Add +1 prefix if needed for lookup
  IF length(cleaned_phone) = 10 THEN
    cleaned_phone := '+1' || cleaned_phone;
  ELSIF length(cleaned_phone) = 11 AND substring(cleaned_phone, 1, 1) = '1' THEN
    cleaned_phone := '+' || cleaned_phone;
  END IF;
  
  -- Look up user by phone in auth.users
  SELECT id, email INTO found_user_id, found_email 
  FROM auth.users 
  WHERE phone = cleaned_phone
  LIMIT 1;
  
  IF found_user_id IS NOT NULL THEN
    RETURN QUERY SELECT true, found_email, cleaned_phone;
  ELSE
    RETURN QUERY SELECT false, NULL::text, NULL::text;
  END IF;
END;
$$;