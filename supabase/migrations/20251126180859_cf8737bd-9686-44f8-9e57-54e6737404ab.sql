
-- Add unique constraint to prevent duplicate announcement reads
ALTER TABLE announcement_reads 
ADD CONSTRAINT announcement_reads_user_announcement_unique 
UNIQUE (user_id, announcement_id);
