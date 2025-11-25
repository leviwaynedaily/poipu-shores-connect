-- Add sidebar opacity column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN sidebar_opacity integer DEFAULT 50;