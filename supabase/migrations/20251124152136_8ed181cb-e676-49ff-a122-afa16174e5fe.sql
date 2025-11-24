-- Add columns to store photo metadata
ALTER TABLE public.community_photos
ADD COLUMN IF NOT EXISTS date_taken timestamp with time zone,
ADD COLUMN IF NOT EXISTS camera_make text,
ADD COLUMN IF NOT EXISTS camera_model text,
ADD COLUMN IF NOT EXISTS gps_latitude double precision,
ADD COLUMN IF NOT EXISTS gps_longitude double precision,
ADD COLUMN IF NOT EXISTS exif_data jsonb;