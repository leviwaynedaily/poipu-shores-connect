-- Fix login_history INSERT policy to be more restrictive
DROP POLICY IF EXISTS "System can insert login history" ON public.login_history;

CREATE POLICY "Users can insert own login history"
ON public.login_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- For community_photos, we'll use a trigger to prevent column manipulation
CREATE OR REPLACE FUNCTION prevent_photo_column_tampering()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_photo_column_restrictions
BEFORE UPDATE ON public.community_photos
FOR EACH ROW
EXECUTE FUNCTION prevent_photo_column_tampering();