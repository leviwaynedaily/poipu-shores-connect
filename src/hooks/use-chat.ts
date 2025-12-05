import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  channel_id: string;
  image_url: string | null;
  reply_to: string | null;
  deleted_at: string | null;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  reply_message?: ChatMessage;
  reactions?: MessageReaction[];
  read_by?: ReadReceipt[];
}

export interface MessageReaction {
  emoji: string;
  count: number;
  user_ids: string[];
}

export interface ReadReceipt {
  user_id: string;
  read_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface Conversation {
  id: string;
  name: string;
  channel_type: 'public' | 'private' | 'direct' | 'group';
  is_private: boolean;
  created_at: string;
  last_message?: {
    id: string;
    content: string;
    created_at: string;
    author_id: string;
  };
  unread_count: number;
  other_member?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    last_sign_in_at?: string;
  };
  member_count: number;
}

export interface TypingUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

export function useChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingRef = useRef<number>(0);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('start-conversation', {
        body: { action: 'get_conversations' }
      });

      if (error) throw error;
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, [user]);

  // Fetch messages for selected channel
  const fetchMessages = useCallback(async () => {
    if (!selectedChannelId || !user) return;

    setIsLoading(true);
    try {
      // Fetch messages
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel_id', selectedChannelId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        setIsLoading(false);
        return;
      }

      // Get unique author IDs
      const authorIds = [...new Set(messagesData.map(m => m.author_id))];

      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', authorIds);

      // Fetch reactions
      const { data: reactionsData } = await supabase
        .from('chat_message_reactions')
        .select('*')
        .in('message_id', messagesData.map(m => m.id));

      // Fetch read receipts for last few messages
      const recentMessageIds = messagesData.slice(-20).map(m => m.id);
      const { data: readReceiptsData } = await supabase
        .from('chat_read_receipts')
        .select('message_id, user_id, read_at')
        .in('message_id', recentMessageIds);

      // Map data to messages
      const messagesWithData = messagesData.map(message => {
        const profile = profilesData?.find(p => p.id === message.author_id);
        const messageReactions = reactionsData?.filter(r => r.message_id === message.id) || [];
        
        // Group reactions
        const reactionsMap = new Map<string, MessageReaction>();
        messageReactions.forEach(r => {
          const existing = reactionsMap.get(r.emoji);
          if (existing) {
            existing.count++;
            existing.user_ids.push(r.user_id);
          } else {
            reactionsMap.set(r.emoji, {
              emoji: r.emoji,
              count: 1,
              user_ids: [r.user_id]
            });
          }
        });

        // Get read receipts
        const messageReadReceipts = readReceiptsData?.filter(r => r.message_id === message.id) || [];
        const readBy = messageReadReceipts.map(r => ({
          user_id: r.user_id,
          read_at: r.read_at,
          profiles: {
            full_name: profilesData?.find(p => p.id === r.user_id)?.full_name || 'Unknown',
            avatar_url: profilesData?.find(p => p.id === r.user_id)?.avatar_url || null
          }
        }));

        // Find reply message
        const replyMessage = message.reply_to 
          ? messagesData.find(m => m.id === message.reply_to)
          : null;

        return {
          ...message,
          profiles: {
            id: profile?.id || message.author_id,
            full_name: profile?.full_name || 'Unknown User',
            avatar_url: profile?.avatar_url || null
          },
          reactions: Array.from(reactionsMap.values()),
          read_by: readBy,
          reply_message: replyMessage ? {
            ...replyMessage,
            profiles: {
              id: profilesData?.find(p => p.id === replyMessage.author_id)?.id || replyMessage.author_id,
              full_name: profilesData?.find(p => p.id === replyMessage.author_id)?.full_name || 'Unknown User',
              avatar_url: profilesData?.find(p => p.id === replyMessage.author_id)?.avatar_url || null
            }
          } : undefined
        };
      });

      setMessages(messagesWithData as ChatMessage[]);

      // Mark messages as read
      markMessagesAsRead(messagesData.map(m => m.id));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedChannelId, user, toast]);

  // Mark messages as read
  const markMessagesAsRead = async (messageIds: string[]) => {
    if (!user || messageIds.length === 0) return;

    try {
      // Get messages not authored by current user
      const { data: messagesToMark } = await supabase
        .from('chat_messages')
        .select('id')
        .in('id', messageIds)
        .neq('author_id', user.id);

      if (!messagesToMark || messagesToMark.length === 0) return;

      // Upsert read receipts
      const receipts = messagesToMark.map(m => ({
        message_id: m.id,
        user_id: user.id,
        read_at: new Date().toISOString()
      }));

      await supabase
        .from('chat_read_receipts')
        .upsert(receipts, { onConflict: 'message_id,user_id' });

      // Refresh conversations to update unread counts
      fetchConversations();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Send message
  const sendMessage = async (content: string, imageUrl?: string, replyToId?: string) => {
    if (!user || !selectedChannelId) return null;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          content: content.trim(),
          author_id: user.id,
          channel_id: selectedChannelId,
          image_url: imageUrl || null,
          reply_to: replyToId || null,
          is_private: false
        })
        .select()
        .single();

      if (error) throw error;

      // Stop typing indicator
      stopTyping();

      // Send push notification to other members
      sendPushNotification(data.id, content);

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
      return null;
    }
  };

  // Send push notification for new message
  const sendPushNotification = async (messageId: string, content: string) => {
    if (!user || !selectedChannelId) return;

    try {
      // Get channel members except current user
      const { data: members } = await supabase
        .from('chat_channel_members')
        .select('user_id')
        .eq('channel_id', selectedChannelId)
        .neq('user_id', user.id);

      if (!members || members.length === 0) return;

      // Get current user's name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Get channel info
      const channel = conversations.find(c => c.id === selectedChannelId);
      const channelName = channel?.channel_type === 'direct' 
        ? profile?.full_name || 'Someone'
        : channel?.name || 'Chat';

      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_ids: members.map(m => m.user_id),
          title: channelName,
          body: `${profile?.full_name || 'Someone'}: ${content.slice(0, 100)}`,
          notification_type: 'chat',
          data: {
            type: 'chat_message',
            channel_id: selectedChannelId,
            message_id: messageId
          }
        }
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  };

  // Delete message (soft delete)
  const deleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id
        })
        .eq('id', messageId)
        .eq('author_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive'
      });
    }
  };

  // Add reaction
  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      const message = messages.find(m => m.id === messageId);
      const existingReaction = message?.reactions?.find(
        r => r.emoji === emoji && r.user_ids.includes(user.id)
      );

      if (existingReaction) {
        await supabase
          .from('chat_message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id)
          .eq('emoji', emoji);
      } else {
        await supabase
          .from('chat_message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji
          });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  // Start DM
  const startDirectMessage = async (targetUserId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('start-conversation', {
        body: { action: 'start_direct', target_user_id: targetUserId }
      });

      if (error) throw error;

      await fetchConversations();
      setSelectedChannelId(data.channel_id);
      return data.channel_id;
    } catch (error) {
      console.error('Error starting DM:', error);
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive'
      });
      return null;
    }
  };

  // Create group
  const createGroup = async (name: string, memberIds: string[]) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('start-conversation', {
        body: { action: 'create_group', name, member_ids: memberIds }
      });

      if (error) throw error;

      await fetchConversations();
      setSelectedChannelId(data.channel_id);
      return data.channel_id;
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Error',
        description: 'Failed to create group',
        variant: 'destructive'
      });
      return null;
    }
  };

  // Typing indicator
  const startTyping = useCallback(async () => {
    if (!user || !selectedChannelId) return;
    
    const now = Date.now();
    if (now - lastTypingRef.current < 3000) return; // Throttle to every 3 seconds
    lastTypingRef.current = now;

    try {
      await supabase.functions.invoke('typing-indicator', {
        body: { action: 'start', channel_id: selectedChannelId }
      });

      // Clear after 5 seconds if no new typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 5000);
    } catch (error) {
      console.error('Error setting typing indicator:', error);
    }
  }, [user, selectedChannelId]);

  const stopTyping = useCallback(async () => {
    if (!user || !selectedChannelId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      await supabase.functions.invoke('typing-indicator', {
        body: { action: 'stop', channel_id: selectedChannelId }
      });
    } catch (error) {
      console.error('Error removing typing indicator:', error);
    }
  }, [user, selectedChannelId]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!selectedChannelId || !user) return;

    const channelSubscription = supabase
      .channel(`chat-${selectedChannelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${selectedChannelId}`
        },
        () => fetchMessages()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_message_reactions'
        },
        () => fetchMessages()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_read_receipts'
        },
        () => fetchMessages()
      )
      .subscribe();

    // Typing indicators subscription
    const typingSubscription = supabase
      .channel(`typing-${selectedChannelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_typing_indicators',
          filter: `channel_id=eq.${selectedChannelId}`
        },
        async () => {
          // Fetch current typing users
          const { data } = await supabase
            .from('chat_typing_indicators')
            .select('user_id')
            .eq('channel_id', selectedChannelId)
            .neq('user_id', user.id)
            .gt('started_at', new Date(Date.now() - 10000).toISOString());

          if (data && data.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', data.map(d => d.user_id));

            setTypingUsers(profiles?.map(p => ({
              user_id: p.id,
              full_name: p.full_name,
              avatar_url: p.avatar_url
            })) || []);
          } else {
            setTypingUsers([]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelSubscription);
      supabase.removeChannel(typingSubscription);
    };
  }, [selectedChannelId, user, fetchMessages]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Fetch messages when channel changes
  useEffect(() => {
    if (selectedChannelId) {
      fetchMessages();
    }
  }, [selectedChannelId, fetchMessages]);

  return {
    conversations,
    selectedChannelId,
    setSelectedChannelId,
    messages,
    typingUsers,
    isLoading,
    sendMessage,
    deleteMessage,
    addReaction,
    startDirectMessage,
    createGroup,
    startTyping,
    stopTyping,
    fetchConversations,
    fetchMessages
  };
}
