-- Create community_photos table
CREATE TABLE public.community_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  caption TEXT,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  category TEXT NOT NULL DEFAULT 'general',
  location TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_approved BOOLEAN NOT NULL DEFAULT true,
  likes_count INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.community_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view approved photos"
ON public.community_photos
FOR SELECT
USING (is_approved = true);

CREATE POLICY "Users can upload photos"
ON public.community_photos
FOR INSERT
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update own photos"
ON public.community_photos
FOR UPDATE
USING (auth.uid() = uploaded_by);

CREATE POLICY "Admins can manage all photos"
ON public.community_photos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'board'::app_role));

-- Create storage bucket for community photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-photos', 'community-photos', true);

-- Storage policies
CREATE POLICY "Anyone can view photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'community-photos');

CREATE POLICY "Authenticated users can upload photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'community-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'community-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'community-photos' AND auth.uid()::text = (storage.foldername(name))[1]);