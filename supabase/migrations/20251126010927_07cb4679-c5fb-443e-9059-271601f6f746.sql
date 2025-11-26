-- Remove placeholder ban/unban functions as they're not needed
DROP FUNCTION IF EXISTS public.ban_user(uuid);
DROP FUNCTION IF EXISTS public.unban_user(uuid);