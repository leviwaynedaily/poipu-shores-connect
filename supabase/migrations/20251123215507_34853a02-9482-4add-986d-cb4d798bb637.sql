-- Create table to track which announcements users have read
CREATE TABLE public.announcement_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

-- Enable Row Level Security
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- Users can view their own read status
CREATE POLICY "Users can view own read status" 
ON public.announcement_reads 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can mark announcements as read
CREATE POLICY "Users can mark announcements as read" 
ON public.announcement_reads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_announcement_reads_user_id ON public.announcement_reads(user_id);
CREATE INDEX idx_announcement_reads_announcement_id ON public.announcement_reads(announcement_id);