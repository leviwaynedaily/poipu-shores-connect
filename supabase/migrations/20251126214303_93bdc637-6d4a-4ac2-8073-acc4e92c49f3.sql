-- Fix double-encoded URL strings in app_settings
UPDATE app_settings
SET setting_value = to_jsonb(
  trim(both '"' from (setting_value #>> '{}'))
)
WHERE setting_key IN ('auth_logo', 'favicon_url')
AND (setting_value #>> '{}') LIKE '"%"';