-- Fix glass_intensity constraint to allow 0-100 range
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_glass_intensity_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_glass_intensity_check 
CHECK (glass_intensity >= 0 AND glass_intensity <= 100);