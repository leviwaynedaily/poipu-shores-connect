-- Drop the old live_camera_settings table
DROP TABLE IF EXISTS public.live_camera_settings;

-- Create new webcams table to support multiple cameras
CREATE TABLE public.webcams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  url TEXT NOT NULL,
  webcam_type TEXT NOT NULL CHECK (webcam_type IN ('youtube', 'external')),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webcams ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Everyone can view active webcams"
  ON public.webcams
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins and board can manage webcams"
  ON public.webcams
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'board'::app_role));

-- Seed webcam data
INSERT INTO public.webcams (name, location, url, webcam_type, display_order) VALUES
  ('Poipu Bay Golf Course', 'Poipu Bay', 'https://www.youtube.com/embed/kP3JW-K59-c', 'youtube', 1),
  ('Lawai Beach Resort', 'Lawai Beach', 'https://www.youtube.com/embed/3ATYHKN2hIg', 'youtube', 2),
  ('Poipu Beach Cam', 'Poipu Beach', 'https://www.parrishkauai.com/kauai-webcam/', 'external', 3),
  ('Brennecke''s Beach', 'Brennecke''s Beach', 'https://www.brenneckes.com/beach-webcam', 'external', 4);