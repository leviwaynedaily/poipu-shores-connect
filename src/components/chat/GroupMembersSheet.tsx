import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserMinus, UserPlus, Loader2, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Member {
  user_id: string;
  is_admin: boolean;
  added_at: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface GroupMembersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
}

export function GroupMembersSheet({
  open,
  onOpenChange,
  channelId
}: GroupMembersSheetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);

  useEffect(() => {
    if (open && channelId) {
      fetchMembers();
    }
  }, [open, channelId]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_channel_members')
        .select(`
          user_id,
          is_admin,
          added_at,
          profiles:user_id(id, full_name, avatar_url)
        `)
        .eq('channel_id', channelId)
        .order('is_admin', { ascending: false })
        .order('added_at', { ascending: true });

      if (error) throw error;

      const processedMembers = (data || []).map(m => ({
        ...m,
        profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      })) as Member[];

      setMembers(processedMembers);

      // Check if current user is admin
      const currentMember = processedMembers.find(m => m.user_id === user?.id);
      setCurrentUserIsAdmin(currentMember?.is_admin || false);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load members',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentUserIsAdmin && memberId !== user?.id) return;

    try {
      const { error } = await supabase.functions.invoke('start-conversation', {
        body: {
          action: 'remove_member',
          channel_id: channelId,
          member_id: memberId
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: memberId === user?.id ? 'You left the group' : 'Member removed'
      });

      if (memberId === user?.id) {
        onOpenChange(false);
        // Optionally redirect or refresh
      } else {
        fetchMembers();
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive'
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Group Members ({members.length})</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2 pr-4">
              {members.map(member => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.profiles.avatar_url || undefined} />
                    <AvatarFallback>
                      {getInitials(member.profiles.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {member.profiles.full_name}
                      </span>
                      {member.is_admin && (
                        <Badge variant="secondary" className="shrink-0">
                          <Crown className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {member.user_id === user?.id && (
                        <Badge variant="outline" className="shrink-0">You</Badge>
                      )}
                    </div>
                  </div>

                  {(currentUserIsAdmin || member.user_id === user?.id) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveMember(member.user_id)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
