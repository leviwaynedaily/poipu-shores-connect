-- Create function to sync phone from profiles to auth.users
CREATE OR REPLACE FUNCTION sync_phone_to_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update auth.users phone when profile phone changes
  IF NEW.phone IS DISTINCT FROM OLD.phone THEN
    UPDATE auth.users
    SET phone = CASE 
      WHEN NEW.phone IS NOT NULL AND NEW.phone != '' 
      THEN '+1' || regexp_replace(NEW.phone, '\D', '', 'g')
      ELSE NULL
    END
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table to sync phone changes
CREATE TRIGGER sync_profile_phone_to_auth
  AFTER UPDATE OF phone ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_phone_to_auth();

-- Backfill existing users' phone numbers from profiles to auth.users (one-time)
UPDATE auth.users u
SET phone = '+1' || regexp_replace(p.phone, '\D', '', 'g')
FROM profiles p
WHERE u.id = p.id
  AND p.phone IS NOT NULL
  AND p.phone != ''
  AND u.phone IS NULL;

-- Clean up the orphaned "New User" account created by phone OTP
DELETE FROM profiles WHERE id = 'b8a6f956-ec13-40fd-b744-7223b700837d';
DELETE FROM auth.users WHERE id = 'b8a6f956-ec13-40fd-b744-7223b700837d';