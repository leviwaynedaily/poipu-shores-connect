import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Smile, Reply, Trash2, MoreHorizontal, Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ChatMessage, MessageReaction, ReadReceipt } from '@/hooks/use-chat';
import { useAuth } from '@/contexts/AuthContext';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface MessageBubbleProps {
  message: ChatMessage;
  onReply: (message: ChatMessage) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string) => void;
  showAvatar?: boolean;
  isGrouped?: boolean;
}

export function MessageBubble({
  message,
  onReply,
  onReaction,
  onDelete,
  showAvatar = true,
  isGrouped = false
}: MessageBubbleProps) {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const isOwnMessage = message.author_id === user?.id;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const hasBeenRead = message.read_by && message.read_by.length > 0;
  const readByOthers = message.read_by?.filter(r => r.user_id !== user?.id) || [];

  return (
    <div
      className={cn(
        'group flex gap-2',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row',
        isGrouped ? 'mt-0.5' : 'mt-3'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {showAvatar && !isGrouped ? (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={message.profiles.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(message.profiles.full_name)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8 shrink-0" />
      )}

      {/* Message Content */}
      <div className={cn(
        'flex flex-col max-w-[75%]',
        isOwnMessage ? 'items-end' : 'items-start'
      )}>
        {/* Name & Time (only for first message in group) */}
        {!isGrouped && (
          <div className={cn(
            'flex items-center gap-2 mb-1 text-xs text-muted-foreground',
            isOwnMessage ? 'flex-row-reverse' : 'flex-row'
          )}>
            <span className="font-medium">
              {isOwnMessage ? 'You' : message.profiles.full_name}
            </span>
            <span>{format(new Date(message.created_at), 'h:mm a')}</span>
          </div>
        )}

        {/* Reply Preview */}
        {message.reply_message && (
          <div className={cn(
            'px-3 py-1.5 mb-1 text-xs rounded-lg border-l-2 border-primary/50',
            isOwnMessage ? 'bg-primary/5' : 'bg-muted/50'
          )}>
            <span className="font-medium text-primary">
              {message.reply_message.profiles.full_name}
            </span>
            <p className="text-muted-foreground truncate max-w-[200px]">
              {message.reply_message.content}
            </p>
          </div>
        )}

        {/* Bubble */}
        <div className={cn(
          'relative px-3 py-2 rounded-2xl',
          isOwnMessage
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md'
        )}>
          {/* Image */}
          {message.image_url && (
            <img
              src={message.image_url}
              alt="Shared image"
              className="rounded-lg max-w-[250px] max-h-[300px] object-cover mb-2"
            />
          )}

          {/* Text */}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Actions overlay */}
          <div className={cn(
            'absolute top-0 flex items-center gap-1 transition-opacity',
            isOwnMessage ? '-left-20' : '-right-20',
            showActions ? 'opacity-100' : 'opacity-0'
          )}>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" side="top">
                <div className="flex gap-1">
                  {EMOJI_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => onReaction(message.id, emoji)}
                      className="text-lg hover:scale-125 transition-transform p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onReply(message)}
            >
              <Reply className="h-4 w-4" />
            </Button>

            {isOwnMessage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'}>
                  <DropdownMenuItem
                    onClick={() => onDelete(message.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={cn(
            'flex flex-wrap gap-1 mt-1',
            isOwnMessage ? 'justify-end' : 'justify-start'
          )}>
            {message.reactions.map(reaction => (
              <button
                key={reaction.emoji}
                onClick={() => onReaction(message.id, reaction.emoji)}
                className={cn(
                  'flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors',
                  reaction.user_ids.includes(user?.id || '')
                    ? 'bg-primary/20 border border-primary/30'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                <span>{reaction.emoji}</span>
                <span className="font-medium">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Read receipts (only for own messages) */}
        {isOwnMessage && (
          <div className="flex items-center gap-1 mt-0.5">
            {readByOthers.length > 0 ? (
              <div className="flex items-center gap-1">
                <CheckCheck className="h-3 w-3 text-primary" />
                <div className="flex -space-x-1">
                  {readByOthers.slice(0, 3).map(receipt => (
                    <Avatar key={receipt.user_id} className="h-4 w-4 border border-background">
                      <AvatarImage src={receipt.profiles.avatar_url || undefined} />
                      <AvatarFallback className="text-[8px]">
                        {getInitials(receipt.profiles.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {readByOthers.length > 3 && (
                    <span className="text-[10px] text-muted-foreground ml-1">
                      +{readByOthers.length - 3}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <Check className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
