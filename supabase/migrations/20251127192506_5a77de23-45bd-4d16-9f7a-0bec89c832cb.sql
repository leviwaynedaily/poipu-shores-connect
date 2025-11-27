-- Delete the duplicate empty storage bucket with underscore naming
DELETE FROM storage.buckets WHERE id = 'community_photos';