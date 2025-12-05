import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TypingUser } from '@/hooks/use-chat';
import { cn } from '@/lib/utils';

interface ChatTypingIndicatorProps {
  typingUsers: TypingUser[];
  className?: string;
}

export function ChatTypingIndicator({ typingUsers, className }: ChatTypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].full_name} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].full_name} and ${typingUsers[1].full_name} are typing`;
    } else {
      return `${typingUsers[0].full_name} and ${typingUsers.length - 1} others are typing`;
    }
  };

  return (
    <div className={cn('flex items-center gap-2 px-4 py-2', className)}>
      <div className="flex -space-x-2">
        {typingUsers.slice(0, 3).map(user => (
          <Avatar key={user.user_id} className="h-6 w-6 border-2 border-background">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="text-[10px]">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">{getTypingText()}</span>
        <div className="flex gap-0.5">
          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}
