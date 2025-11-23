-- Update glass_intensity column to support 0-100 range
-- Set default to 50 (medium opacity) for better readability
ALTER TABLE public.profiles 
ALTER COLUMN glass_intensity SET DEFAULT 50;

-- Update existing users who have intensity of 5 to 50 (converting from old 0-10 scale)
UPDATE public.profiles 
SET glass_intensity = 50 
WHERE glass_intensity = 5;