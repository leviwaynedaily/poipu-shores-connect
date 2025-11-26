
-- Sync unit numbers between profiles and unit_owners tables

-- Update Levi Daily's profile to include unit 107
UPDATE profiles 
SET unit_number = '107'
WHERE id = '01f1fd40-26be-4a87-b347-461a6bb1cccd'
AND unit_number IS NULL;

-- Add Dan Brutocao to unit_owners
INSERT INTO unit_owners (user_id, unit_number, relationship_type, is_primary_contact)
VALUES ('d97b779a-7a24-4155-beca-ace9586352db', '103C', 'owner', false)
ON CONFLICT DO NOTHING;

-- Add Steve Robinson to unit_owners  
INSERT INTO unit_owners (user_id, unit_number, relationship_type, is_primary_contact)
VALUES ('8097b2ec-67c0-4599-a557-450129624dd5', '107A', 'owner', false)
ON CONFLICT DO NOTHING;
