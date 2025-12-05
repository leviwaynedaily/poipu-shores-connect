import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Settings, ArrowLeft, MessageCircle, MessageSquarePlus } from 'lucide-react';
import { format, isSameDay, differenceInMinutes } from 'date-fns';
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
  onStartConversation?: () => void;
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
  showBackButton,
  onStartConversation
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

  // Check if user was active in last 5 minutes
  const isUserOnline = (lastSignIn?: string) => {
    if (!lastSignIn) return false;
    return differenceInMinutes(new Date(), new Date(lastSignIn)) < 5;
  };

  const getOnlineStatus = () => {
    if (conversation?.channel_type !== 'direct' || !conversation.other_member) return null;
    
    const lastSignIn = conversation.other_member.last_sign_in_at;
    if (isUserOnline(lastSignIn)) {
      return 'Online';
    }
    if (lastSignIn) {
      const diff = differenceInMinutes(new Date(), new Date(lastSignIn));
      if (diff < 60) return `Active ${diff}m ago`;
      if (diff < 1440) return `Active ${Math.floor(diff / 60)}h ago`;
      return 'Offline';
    }
    return null;
  };

  // Group messages by sender and time
  const shouldGroupWithPrevious = (current: ChatMessage, previous?: ChatMessage) => {
    if (!previous) return false;
    if (current.author_id !== previous.author_id) return false;
    const timeDiff = new Date(current.created_at).getTime() - new Date(previous.created_at).getTime();
    return timeDiff < 60000; // Group if within 1 minute
  };

  // Check if message should connect with next message (for bubble styling)
  const shouldConnectWithNext = (current: ChatMessage, next?: ChatMessage) => {
    if (!next) return false;
    if (current.author_id !== next.author_id) return false;
    const timeDiff = new Date(next.created_at).getTime() - new Date(current.created_at).getTime();
    return timeDiff < 60000;
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <MessageCircle className="h-10 w-10 text-primary/60" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Welcome to Community Chat</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Select a conversation from the sidebar or start a new one to connect with your neighbors
        </p>
        {onStartConversation && (
          <Button onClick={onStartConversation} className="gap-2">
            <MessageSquarePlus className="h-4 w-4" />
            Start a conversation
          </Button>
        )}
      </div>
    );
  }

  const displayName = conversation.channel_type === 'direct'
    ? conversation.other_member?.full_name || 'Unknown User'
    : conversation.name;

  const avatarUrl = conversation.channel_type === 'direct'
    ? conversation.other_member?.avatar_url
    : null;

  const onlineStatus = getOnlineStatus();
  const isOnline = onlineStatus === 'Online';

  // Check if someone is typing
  const isTyping = typingUsers.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shadow-sm">
        {showBackButton && (
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        {conversation.channel_type === 'direct' ? (
          <div className="relative shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            {isOnline && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
            )}
          </div>
        ) : (
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold truncate">{displayName}</h2>
            {/* Inline typing indicator */}
            {isTyping && (
              <span className="text-xs text-primary animate-pulse">typing...</span>
            )}
          </div>
          {conversation.channel_type === 'direct' ? (
            <p className={cn(
              'text-xs',
              isOnline ? 'text-green-600' : 'text-muted-foreground'
            )}>
              {onlineStatus || 'Offline'}
            </p>
          ) : (
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
            className="hover:bg-muted"
          >
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 px-4">
        <div className="py-4 space-y-0.5">
          {messages.map((message, index) => {
            const previousMessage = messages[index - 1];
            const nextMessage = messages[index + 1];
            const isGrouped = shouldGroupWithPrevious(message, previousMessage);
            const connectsWithNext = shouldConnectWithNext(message, nextMessage);
            
            // Show date separator
            const showDateSeparator = !previousMessage || 
              !isSameDay(new Date(message.created_at), new Date(previousMessage.created_at));

            return (
              <div key={message.id} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-6">
                    <div className="px-4 py-1.5 text-xs font-medium text-muted-foreground bg-muted/80 rounded-full shadow-sm">
                      {format(new Date(message.created_at), 'EEEE, MMMM d, yyyy')}
                    </div>
                  </div>
                )}
                <MessageBubble
                  message={message}
                  onReply={setReplyingTo}
                  onReaction={onReaction}
                  onDelete={onDeleteMessage}
                  isGrouped={isGrouped && !showDateSeparator}
                  connectsWithNext={connectsWithNext && !showDateSeparator}
                />
              </div>
            );
          })}

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-16">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageCircle className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground mb-1">No messages yet</p>
              <p className="text-sm text-muted-foreground">
                Send a message to start the conversation!
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Typing indicator (shown below messages area) */}
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