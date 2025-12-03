-- Mark all existing phone numbers as confirmed since they were added by admins during invite
UPDATE auth.users 
SET phone_confirmed_at = created_at
WHERE phone IS NOT NULL AND phone_confirmed_at IS NULL;