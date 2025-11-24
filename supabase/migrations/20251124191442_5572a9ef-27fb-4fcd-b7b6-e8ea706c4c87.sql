-- Create table for community assistant chat messages
CREATE TABLE public.community_assistant_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.community_assistant_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view own assistant messages" 
ON public.community_assistant_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assistant messages" 
ON public.community_assistant_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_community_assistant_messages_user_id_created_at 
ON public.community_assistant_messages(user_id, created_at);

-- Create function to delete old messages (older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_assistant_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.community_assistant_messages
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Create a trigger to automatically clean up old messages daily
-- Note: This requires pg_cron extension which may need to be enabled separately