import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, MessageCircle, Hash } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
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

  const ConversationItem = ({ conversation }: { conversation: Conversation }) => {
    const displayName = conversation.channel_type === 'direct' 
      ? conversation.other_member?.full_name || 'Unknown User'
      : conversation.name;

    const avatarUrl = conversation.channel_type === 'direct'
      ? conversation.other_member?.avatar_url
      : null;

    const Icon = conversation.channel_type === 'direct' 
      ? MessageCircle 
      : conversation.channel_type === 'group'
        ? Users
        : Hash;

    return (
      <button
        onClick={() => onSelectChannel(conversation.id)}
        className={cn(
          'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
          selectedChannelId === conversation.id
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-muted'
        )}
      >
        {conversation.channel_type === 'direct' ? (
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
            conversation.channel_type === 'group' ? 'bg-primary/10' : 'bg-muted'
          )}>
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              'font-medium truncate text-sm',
              conversation.unread_count > 0 && 'font-semibold'
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
              'text-xs truncate',
              conversation.unread_count > 0 
                ? 'text-foreground font-medium' 
                : 'text-muted-foreground'
            )}>
              {conversation.last_message?.content || 'No messages yet'}
            </p>
            {conversation.unread_count > 0 && (
              <Badge variant="default" className="h-5 min-w-5 flex items-center justify-center text-xs shrink-0">
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </Badge>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <>
      <div className="flex flex-col h-full bg-card border-r border-border">
        <div className="p-3 border-b border-border space-y-3">
          <Button
            onClick={() => setShowNewDialog(true)}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            New Conversation
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-4">
            {directMessages.length > 0 && (
              <div>
                <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Direct Messages
                </h3>
                <div className="space-y-1">
                  {directMessages.map(conv => (
                    <ConversationItem key={conv.id} conversation={conv} />
                  ))}
                </div>
              </div>
            )}

            {groups.length > 0 && (
              <div>
                <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Groups
                </h3>
                <div className="space-y-1">
                  {groups.map(conv => (
                    <ConversationItem key={conv.id} conversation={conv} />
                  ))}
                </div>
              </div>
            )}

            {channels.length > 0 && (
              <div>
                <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Channels
                </h3>
                <div className="space-y-1">
                  {channels.map(conv => (
                    <ConversationItem key={conv.id} conversation={conv} />
                  ))}
                </div>
              </div>
            )}

            {filteredConversations.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs">Start a new conversation</p>
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
