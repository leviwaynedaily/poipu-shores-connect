-- Add glass theme preference to profiles table
ALTER TABLE public.profiles
ADD COLUMN glass_theme_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.glass_theme_enabled IS 'User preference for glass/transparent theme UI';