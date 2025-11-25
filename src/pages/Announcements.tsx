import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Pin, Plus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  author_id: string;
  author_name?: string;
}

const Announcements = () => {
  const { user, isAdmin, isOwner } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const canPost = isAdmin || isOwner;

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("id, title, content, is_pinned, created_at, author_id")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch author names separately
      const announcementsWithAuthors = await Promise.all(
        data.map(async (announcement) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", announcement.author_id)
            .single();
          
          return {
            ...announcement,
            author_name: profile?.full_name || "Unknown",
          };
        })
      );
      setAnnouncements(announcementsWithAuthors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const { error } = await supabase
      .from("announcements")
      .insert({
        title,
        content,
        is_pinned: isPinned,
        author_id: user.id,
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Announcement posted successfully",
      });
      setIsDialogOpen(false);
      setTitle("");
      setContent("");
      setIsPinned(false);
      fetchAnnouncements();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-3xl">Announcements</CardTitle>
            <CardDescription className="text-lg">
              Important updates and notifications
            </CardDescription>
          </div>
          
          {canPost && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  New Announcement
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl">Create Announcement</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm sm:text-base md:text-lg">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="text-sm sm:text-base md:text-lg p-3 sm:p-4 md:p-6"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-sm sm:text-base md:text-lg">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    rows={6}
                    className="text-sm sm:text-base md:text-lg p-3 sm:p-4"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="pinned"
                    checked={isPinned}
                    onCheckedChange={setIsPinned}
                  />
                  <Label htmlFor="pinned" className="text-sm sm:text-base md:text-lg">Pin this announcement</Label>
                </div>
                <Button type="submit" className="w-full text-sm sm:text-base md:text-lg py-4 sm:py-5 md:py-6">
                  Post Announcement
                </Button>
              </form>
            </DialogContent>
            </Dialog>
          )}
        </CardHeader>
      </Card>

      <div className="space-y-3 sm:space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <p className="text-base sm:text-lg text-muted-foreground">No announcements yet.</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className="border-2">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.is_pinned && (
                        <Badge variant="secondary" className="text-xs sm:text-sm md:text-base">
                          <Pin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Pinned
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg sm:text-xl md:text-2xl break-words">{announcement.title}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm md:text-base mt-1">
                      Posted by {announcement.author_name} on{" "}
                      {format(new Date(announcement.created_at), "MMM dd, yyyy 'at' h:mm a")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-sm sm:text-base md:text-lg whitespace-pre-wrap break-words">{announcement.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Announcements;