-- Fix search_path for the prevent_photo_column_tampering function
CREATE OR REPLACE FUNCTION prevent_photo_column_tampering()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow updates to specific columns
  IF (OLD.likes_count != NEW.likes_count AND OLD.uploaded_by = NEW.uploaded_by) THEN
    RAISE EXCEPTION 'Cannot modify likes_count directly';
  END IF;
  
  IF (OLD.is_approved != NEW.is_approved AND NOT has_role(NEW.uploaded_by, 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Cannot modify approval status';
  END IF;
  
  -- Prevent changing ownership
  IF (OLD.uploaded_by != NEW.uploaded_by) THEN
    RAISE EXCEPTION 'Cannot change photo ownership';
  END IF;
  
  RETURN NEW;
END;
$$;