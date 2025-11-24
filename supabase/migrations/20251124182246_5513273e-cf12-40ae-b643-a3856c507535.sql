-- Update display orders to make Lawai Beach the default (first)
UPDATE webcams 
SET display_order = CASE 
  WHEN name = 'Lawai Beach Resort' THEN 1
  WHEN name = 'Poipu Bay Golf Course' THEN 2
  ELSE display_order
END
WHERE is_active = true;