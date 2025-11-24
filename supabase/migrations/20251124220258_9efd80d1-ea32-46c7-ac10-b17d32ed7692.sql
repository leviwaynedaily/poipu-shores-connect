-- Add last_sign_in_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN last_sign_in_at timestamp with time zone;

-- Create index for better query performance on last_sign_in_at
CREATE INDEX idx_profiles_last_sign_in_at ON public.profiles(last_sign_in_at DESC);