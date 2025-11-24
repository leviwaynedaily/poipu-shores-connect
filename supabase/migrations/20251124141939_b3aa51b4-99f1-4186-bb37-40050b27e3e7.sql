-- Create the community_photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('community_photos', 'community_photos', true)
ON CONFLICT (id) DO NOTHING;