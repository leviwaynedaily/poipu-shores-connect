-- Phase 1: Database Changes for Teams-like Chat System

-- 1. Add channel_type to chat_channels
ALTER TABLE public.chat_channels 
ADD COLUMN IF NOT EXISTS channel_type text NOT NULL DEFAULT 'public' 
CHECK (channel_type IN ('public', 'private', 'direct', 'group'));

-- 2. Create chat_channel_members table
CREATE TABLE IF NOT EXISTS public.chat_channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  added_by uuid REFERENCES public.profiles(id),
  is_admin boolean NOT NULL DEFAULT false,
  UNIQUE(channel_id, user_id)
);

-- 3. Create chat_typing_indicators table
CREATE TABLE IF NOT EXISTS public.chat_typing_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- 4. Create chat_read_receipts table
CREATE TABLE IF NOT EXISTS public.chat_read_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- 5. Add soft delete columns to chat_messages
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.profiles(id);

-- 6. Enable RLS on new tables
ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_read_receipts ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for chat_channel_members

-- Users can view members of channels they belong to
CREATE POLICY "Users can view channel members"
ON public.chat_channel_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_channel_members cm
    WHERE cm.channel_id = chat_channel_members.channel_id
    AND cm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.chat_channels c
    WHERE c.id = chat_channel_members.channel_id
    AND c.channel_type = 'public'
  )
);

-- Users can add members to channels they admin or are creating
CREATE POLICY "Users can add channel members"
ON public.chat_channel_members
FOR INSERT
WITH CHECK (
  auth.uid() = added_by
  OR EXISTS (
    SELECT 1 FROM public.chat_channel_members cm
    WHERE cm.channel_id = chat_channel_members.channel_id
    AND cm.user_id = auth.uid()
    AND cm.is_admin = true
  )
  OR auth.uid() = user_id -- Can add self
);

-- Channel admins can remove members
CREATE POLICY "Admins can remove channel members"
ON public.chat_channel_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_channel_members cm
    WHERE cm.channel_id = chat_channel_members.channel_id
    AND cm.user_id = auth.uid()
    AND cm.is_admin = true
  )
  OR auth.uid() = user_id -- Can remove self
);

-- 8. RLS Policies for chat_typing_indicators

-- Users can view typing in channels they belong to
CREATE POLICY "Users can view typing indicators"
ON public.chat_typing_indicators
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_channel_members cm
    WHERE cm.channel_id = chat_typing_indicators.channel_id
    AND cm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.chat_channels c
    WHERE c.id = chat_typing_indicators.channel_id
    AND c.channel_type = 'public'
  )
);

-- Users can set their own typing status
CREATE POLICY "Users can set typing status"
ON public.chat_typing_indicators
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update typing status"
ON public.chat_typing_indicators
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete typing status"
ON public.chat_typing_indicators
FOR DELETE
USING (auth.uid() = user_id);

-- 9. RLS Policies for chat_read_receipts

-- Users can view read receipts in their channels
CREATE POLICY "Users can view read receipts"
ON public.chat_read_receipts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_messages m
    JOIN public.chat_channel_members cm ON cm.channel_id = m.channel_id
    WHERE m.id = chat_read_receipts.message_id
    AND cm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.chat_messages m
    JOIN public.chat_channels c ON c.id = m.channel_id
    WHERE m.id = chat_read_receipts.message_id
    AND c.channel_type = 'public'
  )
);

-- Users can mark messages as read
CREATE POLICY "Users can mark messages read"
ON public.chat_read_receipts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 10. Update chat_channels policies for new channel types

-- Drop existing select policy and create new one
DROP POLICY IF EXISTS "Everyone can view public channels updated" ON public.chat_channels;

CREATE POLICY "Users can view accessible channels"
ON public.chat_channels
FOR SELECT
USING (
  channel_type = 'public'
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.chat_channel_members cm
    WHERE cm.channel_id = chat_channels.id
    AND cm.user_id = auth.uid()
  )
);

-- Allow authenticated users to create direct/group channels
DROP POLICY IF EXISTS "Admins and owners can create channels" ON public.chat_channels;

CREATE POLICY "Users can create channels"
ON public.chat_channels
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND (
    channel_type IN ('direct', 'group')
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role)
  )
);

-- 11. Update chat_messages policies for channel membership

DROP POLICY IF EXISTS "Users can view messages in accessible channels" ON public.chat_messages;

CREATE POLICY "Users can view messages in accessible channels"
ON public.chat_messages
FOR SELECT
USING (
  deleted_at IS NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = chat_messages.channel_id
      AND c.channel_type = 'public'
    )
    OR EXISTS (
      SELECT 1 FROM public.chat_channel_members cm
      WHERE cm.channel_id = chat_messages.channel_id
      AND cm.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role)
  )
);

-- Allow users to soft-delete their own messages
CREATE POLICY "Users can soft delete own messages"
ON public.chat_messages
FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- 12. Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channel_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_read_receipts;

-- 13. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_channel_members_channel_id ON public.chat_channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_channel_members_user_id ON public.chat_channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_typing_indicators_channel_id ON public.chat_typing_indicators(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_read_receipts_message_id ON public.chat_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_read_receipts_user_id ON public.chat_read_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_deleted_at ON public.chat_messages(deleted_at);
CREATE INDEX IF NOT EXISTS idx_chat_channels_channel_type ON public.chat_channels(channel_type);