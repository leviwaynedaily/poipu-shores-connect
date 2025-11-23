-- Create emergency_contacts table
CREATE TABLE public.emergency_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on emergency_contacts
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for emergency_contacts
CREATE POLICY "Everyone can view active emergency contacts"
  ON public.emergency_contacts
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins and board can manage emergency contacts"
  ON public.emergency_contacts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'board'::app_role));

-- Create live_camera_settings table
CREATE TABLE public.live_camera_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  camera_name TEXT NOT NULL,
  camera_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on live_camera_settings
ALTER TABLE public.live_camera_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for live_camera_settings
CREATE POLICY "Everyone can view active camera settings"
  ON public.live_camera_settings
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins and board can manage camera settings"
  ON public.live_camera_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'board'::app_role));

-- Seed initial emergency contacts
INSERT INTO public.emergency_contacts (category, name, phone, description, display_order) VALUES
  ('Emergency', '911 Emergency Services', '911', 'For immediate life-threatening emergencies', 1),
  ('Police', 'Kauai Police Department', '(808) 241-1711', 'Non-emergency police contact', 2),
  ('Medical', 'Wilcox Medical Center', '(808) 245-1100', 'Main hospital emergency room', 3),
  ('Property', 'Property Manager', 'TBD', 'Contact property management', 4),
  ('Maintenance', 'Maintenance Emergency', 'TBD', '24/7 maintenance support', 5);