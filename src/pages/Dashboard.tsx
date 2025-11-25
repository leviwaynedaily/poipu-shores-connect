import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pin, MessageSquare, FileText, Users, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { WeatherAndBeachConditions } from "@/components/dashboard/WeatherAndBeachConditions";
import { EmergencyContacts } from "@/components/dashboard/EmergencyContacts";
import { LiveCameraEmbed } from "@/components/dashboard/LiveCameraEmbed";
import { PhotoCarousel } from "@/components/photos/PhotoCarousel";
import { AnnouncementDialog } from "@/components/AnnouncementDialog";
import { CommunityAssistantDialog } from "@/components/CommunityAssistantDialog";
import chickenIcon from "@/assets/chicken-assistant.jpeg";

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

const Dashboard = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalDocuments: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    fetchAnnouncements();
    fetchStats();
  }, [user]);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select(`
        *,
        profiles!announcements_author_id_fkey (full_name)
      `)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) setAnnouncements(data as any);
  };

  const fetchStats = async () => {
    const [messagesResult, documentsResult, usersResult] = await Promise.all([
      supabase.from("chat_messages").select("id", { count: "exact", head: true }),
      supabase.from("documents").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    setStats({
      totalMessages: messagesResult.count || 0,
      totalDocuments: documentsResult.count || 0,
      totalUsers: usersResult.count || 0,
    });
  };

  return (
    <div className="space-y-6">
      <AnnouncementDialog />

      <Card 
        className="cursor-pointer hover:border-primary transition-colors"
        onClick={() => setIsAssistantOpen(true)}
      >
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
            <img
              src={chickenIcon}
              alt="Community Assistant"
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover ring-2 ring-primary/20 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl sm:text-2xl md:text-3xl mb-1 md:mb-2">Ask the Chicken</CardTitle>
              <CardDescription className="text-sm sm:text-base md:text-lg">
                Your AI assistant for documents, announcements, emergency info, and more!
              </CardDescription>
            </div>
            <Button size="lg" className="h-10 sm:h-12 px-4 sm:px-6 w-full sm:w-auto shrink-0">
              <MessageCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Start Chat
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Link to="/chat">
          <Card className="cursor-pointer hover:border-primary transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community Activity</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMessages}</div>
              <p className="text-xs text-muted-foreground">Total chat messages</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/documents">
          <Card className="cursor-pointer hover:border-primary transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">Shared documents</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/members">
          <Card className="cursor-pointer hover:border-primary transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        <LiveCameraEmbed />
        <WeatherAndBeachConditions />
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 p-4 sm:p-6">
          <div>
            <CardTitle className="text-xl sm:text-2xl">Community Photos</CardTitle>
            <CardDescription className="text-sm sm:text-base md:text-lg">Recent photos from Poipu Shores</CardDescription>
          </div>
          <Link to="/photos">
            <button className="text-sm text-primary hover:underline font-medium whitespace-nowrap">
              View All Photos →
            </button>
          </Link>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <PhotoCarousel />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        <EmergencyContacts />

        <Link to="/announcements">
          <Card className="cursor-pointer hover:border-primary transition-colors h-full">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl">Recent Announcements</CardTitle>
              <CardDescription className="text-sm sm:text-base md:text-lg">
                Important updates from the board and administration
              </CardDescription>
            </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            {announcements.length === 0 ? (
              <p className="text-sm sm:text-base text-muted-foreground">No announcements yet.</p>
            ) : (
              announcements.map((announcement) => (
                <Card key={announcement.id} className="border-2">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {announcement.is_pinned && (
                            <Badge variant="secondary" className="text-xs sm:text-sm">
                              <Pin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              Pinned
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base sm:text-lg md:text-xl break-words">{announcement.title}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm md:text-base mt-1">
                          Posted by {announcement.profiles.full_name} on{" "}
                          {format(new Date(announcement.created_at), "MMM dd, yyyy")}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <p className="text-sm sm:text-base whitespace-pre-wrap break-words">{announcement.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
          </Card>
        </Link>
      </div>

      <CommunityAssistantDialog open={isAssistantOpen} onOpenChange={setIsAssistantOpen} />
    </div>
  );
};

export default Dashboard;