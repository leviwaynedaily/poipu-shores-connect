-- Create chat channels table
CREATE TABLE public.chat_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add channel_id to chat_messages
ALTER TABLE public.chat_messages 
ADD COLUMN channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE;

-- Create default general channel
INSERT INTO public.chat_channels (name, description, is_private, created_by)
SELECT 'General', 'Community-wide discussions', false, id
FROM auth.users
LIMIT 1;

-- Update existing messages to use the general channel
UPDATE public.chat_messages 
SET channel_id = (SELECT id FROM public.chat_channels WHERE name = 'General' LIMIT 1)
WHERE channel_id IS NULL;

-- Make channel_id required after backfilling
ALTER TABLE public.chat_messages 
ALTER COLUMN channel_id SET NOT NULL;

-- Enable RLS on chat_channels
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_channels
CREATE POLICY "Everyone can view public channels"
ON public.chat_channels
FOR SELECT
USING (NOT is_private OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'board'::app_role));

CREATE POLICY "Admins can create channels"
ON public.chat_channels
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'board'::app_role));

CREATE POLICY "Admins can update channels"
ON public.chat_channels
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'board'::app_role));

CREATE POLICY "Admins can delete channels"
ON public.chat_channels
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update chat_messages RLS to consider channels
DROP POLICY IF EXISTS "Users can view public messages" ON public.chat_messages;

CREATE POLICY "Users can view messages in accessible channels"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels
    WHERE chat_channels.id = chat_messages.channel_id
    AND (NOT chat_channels.is_private OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'board'::app_role))
  )
);

-- Add trigger for updated_at on chat_channels
CREATE TRIGGER update_chat_channels_updated_at
BEFORE UPDATE ON public.chat_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for channels
ALTER TABLE public.chat_channels REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;