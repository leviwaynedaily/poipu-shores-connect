-- Add auth_page_opacity field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN auth_page_opacity integer DEFAULT 90;