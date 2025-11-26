import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Pin } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

export const AnnouncementDialog = () => {
  const [open, setOpen] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchUnreadAnnouncements = async () => {
      // Fetch all announcements
      const { data: announcements, error: announcementsError } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          content,
          is_pinned,
          created_at,
          author_id
        `)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (announcementsError) {
        console.error('Error fetching announcements:', announcementsError);
        return;
      }

      // Fetch profiles for authors
      const authorIds = announcements?.map(a => a.author_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
      
      const announcementsWithProfiles = announcements?.map(a => ({
        ...a,
        profiles: { full_name: profileMap.get(a.author_id) || 'Unknown' }
      })) || [];

      // Fetch read announcements for this user
      const { data: readAnnouncements, error: readsError } = await supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', user.id);

      if (readsError) {
        console.error('Error fetching read announcements:', readsError);
        return;
      }

      const readIds = new Set(readAnnouncements?.map(r => r.announcement_id) || []);
      const unread = announcementsWithProfiles?.filter(a => !readIds.has(a.id)) || [];

      if (unread.length > 0) {
        setUnreadAnnouncements(unread);
        setCurrentAnnouncement(unread[0]);
        setCurrentIndex(0);
        setOpen(true);
      }
    };

    fetchUnreadAnnouncements();

    // Subscribe to new announcements
    const channel = supabase
      .channel('new-announcements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements'
        },
        async (payload) => {
          // Fetch the full announcement with author info
          const { data: newAnnouncement } = await supabase
            .from('announcements')
            .select('id, title, content, is_pinned, created_at, author_id')
            .eq('id', payload.new.id)
            .single();

          if (newAnnouncement) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', newAnnouncement.author_id)
              .single();

            const formattedAnnouncement: Announcement = {
              ...newAnnouncement,
              profiles: { full_name: profile?.full_name || 'Unknown' }
            };

            setUnreadAnnouncements(prev => [formattedAnnouncement, ...prev]);
            if (!open) {
              setCurrentAnnouncement(formattedAnnouncement);
              setCurrentIndex(0);
              setOpen(true);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, open]);

  const markAsRead = async (announcementId: string) => {
    if (!user) return;

    // Use upsert to avoid duplicate key errors
    const { error } = await supabase
      .from('announcement_reads')
      .upsert(
        {
          user_id: user.id,
          announcement_id: announcementId
        },
        {
          onConflict: 'user_id,announcement_id',
          ignoreDuplicates: true
        }
      );

    if (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  const handleNext = async () => {
    if (!currentAnnouncement) return;

    await markAsRead(currentAnnouncement.id);

    if (currentIndex < unreadAnnouncements.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentAnnouncement(unreadAnnouncements[nextIndex]);
    } else {
      setOpen(false);
      setUnreadAnnouncements([]);
      setCurrentAnnouncement(null);
      setCurrentIndex(0);
    }
  };

  const handleDismissAll = async () => {
    if (!user) return;

    // Mark all as read
    await Promise.all(
      unreadAnnouncements.map(announcement =>
        markAsRead(announcement.id)
      )
    );

    setOpen(false);
    setUnreadAnnouncements([]);
    setCurrentAnnouncement(null);
    setCurrentIndex(0);
  };

  if (!currentAnnouncement) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="text-2xl flex items-center gap-2">
              {currentAnnouncement.is_pinned && (
                <Pin className="h-5 w-5 text-primary" />
              )}
              {currentAnnouncement.title}
            </DialogTitle>
            {unreadAnnouncements.length > 1 && (
              <Badge variant="secondary">
                {currentIndex + 1} of {unreadAnnouncements.length}
              </Badge>
            )}
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Posted by {currentAnnouncement.profiles.full_name} on{' '}
            {format(new Date(currentAnnouncement.created_at), 'MMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-base text-foreground whitespace-pre-wrap">
            {currentAnnouncement.content}
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {unreadAnnouncements.length > 1 && (
            <Button variant="outline" onClick={handleDismissAll} className="sm:mr-auto">
              Dismiss All
            </Button>
          )}
          <Button onClick={handleNext}>
            {currentIndex < unreadAnnouncements.length - 1 ? 'Next' : 'Got it'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
