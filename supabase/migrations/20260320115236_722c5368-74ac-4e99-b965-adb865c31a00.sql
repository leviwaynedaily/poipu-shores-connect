-- Update Property Manager with Kahea Kanoho's info
UPDATE emergency_contacts
SET name = 'Kahea Kanoho - Property Manager',
    phone = '(808) 742-7700',
    email = 'kkanoho@castleresorts.com',
    description = 'Contact property management'
WHERE id = 'ba34ea85-03c3-4e80-9980-90f01f2dea74';

-- Update Maintenance contact
UPDATE emergency_contacts
SET name = 'Maintenance',
    phone = '(808) 742-7700',
    description = 'For AOAO property maintenance, contact Kahea Kanoho. For in-unit maintenance issues, contact your Rental Agent.'
WHERE id = '82bfb369-4a17-415b-a85f-f42393378a88';