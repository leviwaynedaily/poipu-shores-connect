-- Add glass intensity setting to profiles
ALTER TABLE public.profiles 
ADD COLUMN glass_intensity integer DEFAULT 5 CHECK (glass_intensity >= 0 AND glass_intensity <= 10);