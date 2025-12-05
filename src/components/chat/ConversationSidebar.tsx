import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, MessageCircle, Hash, MessageSquarePlus } from 'lucide-react';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Conversation } from '@/hooks/use-chat';
import { NewConversationDialog } from './NewConversationDialog';

interface ConversationSidebarProps {
  conversations: Conversation[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  onStartDM: (userId: string) => Promise<string | null>;
  onCreateGroup: (name: string, memberIds: string[]) => Promise<string | null>;
}

export function ConversationSidebar({
  conversations,
  selectedChannelId,
  onSelectChannel,
  onStartDM,
  onCreateGroup
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.other_member?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const directMessages = filteredConversations.filter(c => c.channel_type === 'direct');
  const groups = filteredConversations.filter(c => c.channel_type === 'group');
  const channels = filteredConversations.filter(c => c.channel_type === 'public' || c.channel_type === 'private');

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'MMM d');
  };

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

  const ConversationItem = ({ conversation }: { conversation: Conversation }) => {
    const displayName = conversation.channel_type === 'direct' 
      ? conversation.other_member?.full_name || 'Unknown User'
      : conversation.name;

    const avatarUrl = conversation.channel_type === 'direct'
      ? conversation.other_member?.avatar_url
      : null;

    const isOnline = conversation.channel_type === 'direct' && 
      isUserOnline(conversation.other_member?.last_sign_in_at);

    const Icon = conversation.channel_type === 'direct' 
      ? MessageCircle 
      : conversation.channel_type === 'group'
        ? Users
        : Hash;

    const isSelected = selectedChannelId === conversation.id;

    return (
      <button
        onClick={() => onSelectChannel(conversation.id)}
        className={cn(
          'w-full flex items-center gap-3 p-3 rounded-lg text-left',
          'transition-all duration-150 ease-out',
          isSelected
            ? 'bg-primary/10 text-primary border-l-2 border-primary shadow-sm'
            : 'hover:bg-muted/70 border-l-2 border-transparent'
        )}
      >
        {conversation.channel_type === 'direct' ? (
          <div className="relative shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-xs bg-muted">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            <span className={cn(
              'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card',
              'transition-colors duration-200',
              isOnline ? 'bg-green-500' : 'bg-muted-foreground/30'
            )} />
          </div>
        ) : (
          <div className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
            'transition-colors duration-150',
            conversation.channel_type === 'group' 
              ? 'bg-primary/10' 
              : 'bg-muted'
          )}>
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              'font-medium truncate text-sm transition-colors',
              conversation.unread_count > 0 && 'font-semibold text-foreground'
            )}>
              {displayName}
            </span>
            {conversation.last_message && (
              <span className="text-xs text-muted-foreground shrink-0">
                {formatTime(conversation.last_message.created_at)}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <p className={cn(
              'text-xs truncate transition-colors',
              conversation.unread_count > 0 
                ? 'text-foreground font-medium' 
                : 'text-muted-foreground'
            )}>
              {conversation.last_message?.content || 'No messages yet'}
            </p>
            {conversation.unread_count > 0 && (
              <Badge 
                variant="default" 
                className={cn(
                  'h-5 min-w-5 flex items-center justify-center text-xs shrink-0',
                  'animate-in fade-in zoom-in-95 duration-200'
                )}
              >
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </Badge>
            )}
          </div>
        </div>
      </button>
    );
  };

  const SectionHeader = ({ children }: { children: React.ReactNode }) => (
    <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
      <span className="flex-1">{children}</span>
      <span className="h-px flex-1 bg-border" />
    </h3>
  );

  return (
    <>
      <div className="flex flex-col h-full bg-card">
        <div className="p-3 border-b border-border space-y-3">
          <Button
            onClick={() => setShowNewDialog(true)}
            className={cn(
              'w-full justify-center gap-2 font-medium',
              'bg-primary hover:bg-primary/90 text-primary-foreground',
              'shadow-sm hover:shadow-md transition-all duration-200'
            )}
          >
            <MessageSquarePlus className="h-4 w-4" />
            New Conversation
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-transparent focus:border-border focus:bg-background transition-colors"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {directMessages.length > 0 && (
              <div>
                <SectionHeader>Direct Messages</SectionHeader>
                <div className="space-y-0.5">
                  {directMessages.map(conv => (
                    <ConversationItem key={conv.id} conversation={conv} />
                  ))}
                </div>
              </div>
            )}

            {groups.length > 0 && (
              <div>
                <SectionHeader>Groups</SectionHeader>
                <div className="space-y-0.5">
                  {groups.map(conv => (
                    <ConversationItem key={conv.id} conversation={conv} />
                  ))}
                </div>
              </div>
            )}

            {channels.length > 0 && (
              <div>
                <SectionHeader>Channels</SectionHeader>
                <div className="space-y-0.5">
                  {channels.map(conv => (
                    <ConversationItem key={conv.id} conversation={conv} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredConversations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MessageCircle className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <h3 className="font-medium text-foreground mb-1">No conversations yet</h3>
                <p className="text-sm text-muted-foreground">
                  Use the button above to start chatting
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <NewConversationDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onStartDM={onStartDM}
        onCreateGroup={onCreateGroup}
      />
    </>
  );
}