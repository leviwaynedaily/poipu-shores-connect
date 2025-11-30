-- Create conversations table
CREATE TABLE public.community_assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.community_assistant_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policy for conversations
CREATE POLICY "Users can manage own conversations"
  ON public.community_assistant_conversations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add conversation_id to existing messages table
ALTER TABLE public.community_assistant_messages 
ADD COLUMN conversation_id UUID REFERENCES public.community_assistant_conversations(id) ON DELETE CASCADE;

-- Create a legacy conversation for each user with existing messages
INSERT INTO public.community_assistant_conversations (user_id, title, created_at)
SELECT DISTINCT 
  user_id,
  'Previous Chat' as title,
  MIN(created_at) as created_at
FROM public.community_assistant_messages
WHERE user_id IS NOT NULL
GROUP BY user_id;

-- Link existing messages to their user's legacy conversation
UPDATE public.community_assistant_messages m
SET conversation_id = (
  SELECT c.id 
  FROM public.community_assistant_conversations c 
  WHERE c.user_id = m.user_id 
  LIMIT 1
)
WHERE conversation_id IS NULL;

-- Now make conversation_id NOT NULL
ALTER TABLE public.community_assistant_messages 
ALTER COLUMN conversation_id SET NOT NULL;

-- Add indexes for performance
CREATE INDEX idx_messages_conversation_id ON public.community_assistant_messages(conversation_id);
CREATE INDEX idx_conversations_user_id ON public.community_assistant_conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON public.community_assistant_conversations(updated_at DESC);

-- Update RLS policies for messages to include conversation access
DROP POLICY IF EXISTS "Users can view own assistant messages" ON public.community_assistant_messages;
DROP POLICY IF EXISTS "Users can insert own assistant messages" ON public.community_assistant_messages;

CREATE POLICY "Users can view messages in own conversations"
  ON public.community_assistant_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.community_assistant_conversations
      WHERE id = community_assistant_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own conversations"
  ON public.community_assistant_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.community_assistant_conversations
      WHERE id = community_assistant_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Trigger to update conversation updated_at when messages are added
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.community_assistant_conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.community_assistant_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();