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
import chickenIcon from "@/assets/chicken-assistant.jpeg";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalDocuments: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    fetchAnnouncements();
    fetchStats();

    // Set up real-time subscription for announcements
    const channel = supabase
      .channel('dashboard-announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements'
        },
        () => {
          // Refetch announcements when any change occurs
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchAnnouncements = async () => {
    // Calculate date 90 days ago
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data } = await supabase
      .from("announcements")
      .select("*")
      .gte("created_at", ninetyDaysAgo.toISOString())
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

      {/* Quick Stats - Mobile Compact / Desktop Cards */}
      {isMobile ? (
        <Card>
          <CardContent className="flex items-center justify-around py-3 px-2">
            <Link to="/announcements" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Pin className="h-4 w-4" />
              <span className="font-semibold">{announcements.length}</span>
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link to="/chat" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <MessageSquare className="h-4 w-4" />
              <span className="font-semibold">{stats.totalMessages}</span>
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link to="/documents" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <FileText className="h-4 w-4" />
              <span className="font-semibold">{stats.totalDocuments}</span>
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link to="/members" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Users className="h-4 w-4" />
              <span className="font-semibold">{stats.totalUsers}</span>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Link to="/announcements">
            <Card className="cursor-pointer hover:border-primary transition-colors h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Announcements</CardTitle>
                <Pin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{announcements.length}</div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {announcements.length > 0 ? announcements[0].title : "No announcements"}
                </p>
              </CardContent>
            </Card>
          </Link>

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
                <CardTitle className="text-sm font-medium">Poipu Shores Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Ask the Chicken - Compact on Mobile */}
      <Link to="/assistant">
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardHeader className={isMobile ? "p-3" : "p-4 sm:p-6"}>
            <div className={isMobile ? "flex items-center gap-3" : "flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"}>
              <img
                src={chickenIcon}
                alt="Community Assistant"
                className={isMobile ? "h-10 w-10 rounded-full object-cover ring-2 ring-primary/20 flex-shrink-0" : "h-12 w-12 sm:h-16 sm:w-16 rounded-full object-cover ring-2 ring-primary/20 flex-shrink-0"}
              />
              <div className="flex-1 min-w-0">
                <CardTitle className={isMobile ? "text-base" : "text-lg sm:text-xl md:text-2xl"}>Ask the Chicken</CardTitle>
                {!isMobile && (
                  <CardDescription className="text-sm sm:text-base">
                    Your AI assistant for documents, announcements, emergency info, and more!
                  </CardDescription>
                )}
              </div>
              <Button size={isMobile ? "sm" : "default"} className={isMobile ? "shrink-0" : "w-full sm:w-auto shrink-0"}>
                <MessageCircle className="mr-2 h-4 w-4" />
                {isMobile ? "Chat" : "Start Chat"}
              </Button>
            </div>
          </CardHeader>
        </Card>
      </Link>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        <LiveCameraEmbed compact={isMobile} />
        <WeatherAndBeachConditions compact={isMobile} />
      </div>

      {/* Community Photos - Simplified on Mobile */}
      {isMobile ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Community Photos</CardTitle>
              <Link to="/photos" className="text-sm text-primary hover:underline font-medium">
                View All →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <PhotoCarousel compact={isMobile} />
          </CardContent>
        </Card>
      ) : (
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
            <PhotoCarousel compact={false} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        <EmergencyContacts compact={isMobile} />
        
        {/* Announcements - Compact on Mobile */}
        {isMobile ? (
          <Card>
            <CardHeader className="pb-3">
              <Link to="/announcements" className="flex items-center justify-between group">
                <CardTitle className="text-base">Announcements</CardTitle>
                <span className="text-sm text-primary group-hover:underline font-medium">View All →</span>
              </Link>
            </CardHeader>
            <CardContent className="space-y-1.5 pt-0">
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No announcements yet.</p>
              ) : (
                announcements.slice(0, 3).map((announcement) => (
                  <Link key={announcement.id} to="/announcements" className="block hover:bg-accent/50 rounded px-2 py-1.5 transition-colors">
                    <div className="flex items-center gap-2">
                      {announcement.is_pinned && <Pin className="h-3 w-3 text-muted-foreground shrink-0" />}
                      <p className="text-sm line-clamp-1">{announcement.title}</p>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        ) : (
          <Link to="/announcements">
            <Card className="cursor-pointer hover:border-primary transition-colors h-full">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl">All Announcements</CardTitle>
                <CardDescription className="text-sm sm:text-base md:text-lg">
                  View all community announcements and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                {announcements.length === 0 ? (
                  <p className="text-sm sm:text-base text-muted-foreground">No announcements yet.</p>
                ) : (
                  announcements.slice(0, 3).map((announcement) => (
                    <div key={announcement.id} className="border-l-2 border-primary pl-3">
                      <div className="flex items-center gap-2 mb-1">
                        {announcement.is_pinned && (
                          <Pin className="h-3 w-3 text-muted-foreground" />
                        )}
                        <p className="text-sm font-medium line-clamp-1">{announcement.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(announcement.created_at), "MMM dd, yyyy")}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Dashboard;