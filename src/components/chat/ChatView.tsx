import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Settings, ArrowLeft, MessageCircle } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { ChatMessage, Conversation, TypingUser } from '@/hooks/use-chat';
import { MessageBubble } from './MessageBubble';
import { ChatTypingIndicator } from './ChatTypingIndicator';
import { ChatMessageInput } from './ChatMessageInput';
import { GroupMembersSheet } from './GroupMembersSheet';
import { cn } from '@/lib/utils';

interface ChatViewProps {
  conversation: Conversation | null;
  messages: ChatMessage[];
  typingUsers: TypingUser[];
  onSendMessage: (content: string, imageUrl?: string, replyToId?: string) => Promise<any>;
  onDeleteMessage: (messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onTyping: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function ChatView({
  conversation,
  messages,
  typingUsers,
  onSendMessage,
  onDeleteMessage,
  onReaction,
  onTyping,
  onBack,
  showBackButton
}: ChatViewProps) {
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Group messages by sender and time
  const shouldGroupWithPrevious = (current: ChatMessage, previous?: ChatMessage) => {
    if (!previous) return false;
    if (current.author_id !== previous.author_id) return false;
    const timeDiff = new Date(current.created_at).getTime() - new Date(previous.created_at).getTime();
    return timeDiff < 60000; // Group if within 1 minute
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <MessageCircle className="h-16 w-16 mb-4 opacity-30" />
        <h3 className="text-lg font-medium">Select a conversation</h3>
        <p className="text-sm">Choose a chat from the sidebar to start messaging</p>
      </div>
    );
  }

  const displayName = conversation.channel_type === 'direct'
    ? conversation.other_member?.full_name || 'Unknown User'
    : conversation.name;

  const avatarUrl = conversation.channel_type === 'direct'
    ? conversation.other_member?.avatar_url
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        {showBackButton && (
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        {conversation.channel_type === 'direct' ? (
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{displayName}</h2>
          {conversation.channel_type !== 'direct' && (
            <p className="text-xs text-muted-foreground">
              {conversation.member_count} members
            </p>
          )}
        </div>

        {conversation.channel_type === 'group' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMembers(true)}
          >
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 px-4">
        <div className="py-4 space-y-1">
          {messages.map((message, index) => {
            const previousMessage = messages[index - 1];
            const isGrouped = shouldGroupWithPrevious(message, previousMessage);
            
            // Show date separator
            const showDateSeparator = !previousMessage || 
              !isSameDay(new Date(message.created_at), new Date(previousMessage.created_at));

            return (
              <div key={message.id}>
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-4">
                    <div className="px-3 py-1 text-xs text-muted-foreground bg-muted rounded-full">
                      {format(new Date(message.created_at), 'MMMM d, yyyy')}
                    </div>
                  </div>
                )}
                <MessageBubble
                  message={message}
                  onReply={setReplyingTo}
                  onReaction={onReaction}
                  onDelete={onDeleteMessage}
                  isGrouped={isGrouped && !showDateSeparator}
                />
              </div>
            );
          })}

          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Typing indicator */}
      <ChatTypingIndicator typingUsers={typingUsers} />

      {/* Message input */}
      <ChatMessageInput
        onSendMessage={onSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onTyping={onTyping}
      />

      {/* Members sheet for groups */}
      {conversation.channel_type === 'group' && (
        <GroupMembersSheet
          open={showMembers}
          onOpenChange={setShowMembers}
          channelId={conversation.id}
        />
      )}
    </div>
  );
}
