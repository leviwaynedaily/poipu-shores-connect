-- Add show_contact_info field to profiles table to allow users to opt-out of showing their contact info in members directory
ALTER TABLE public.profiles 
ADD COLUMN show_contact_info boolean NOT NULL DEFAULT true;