
-- Update handle_new_user trigger to create unit_owners record instead of setting unit_number on profiles

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  unit_num text;
BEGIN
  -- Extract unit number from metadata
  unit_num := NEW.raw_user_meta_data->>'unit_number';
  
  -- Insert profile (without unit_number since that column was removed)
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User')
  );
  
  -- If unit number was provided, create unit_owners record
  IF unit_num IS NOT NULL AND unit_num != '' THEN
    INSERT INTO public.unit_owners (user_id, unit_number, relationship_type, is_primary_contact)
    VALUES (NEW.id, unit_num, 'primary', true)
    ON CONFLICT (user_id, unit_number) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;
