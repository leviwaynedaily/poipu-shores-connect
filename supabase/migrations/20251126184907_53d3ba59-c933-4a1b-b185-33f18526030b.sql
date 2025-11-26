-- Update avatar URLs in profiles table to use custom domain
UPDATE profiles 
SET avatar_url = REPLACE(avatar_url, 'rvqqnfsgovlxocjjugww.supabase.co', 'api.poipu-shores.com')
WHERE avatar_url LIKE '%rvqqnfsgovlxocjjugww.supabase.co%';

-- Update app_settings URLs (stored as JSONB) to use custom domain
UPDATE app_settings 
SET setting_value = to_jsonb(REPLACE(setting_value::text, 'rvqqnfsgovlxocjjugww.supabase.co', 'api.poipu-shores.com'))
WHERE setting_value::text LIKE '%rvqqnfsgovlxocjjugww.supabase.co%';