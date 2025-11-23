import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pin, MessageSquare, FileText, Users } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { WeatherAndBeachConditions } from "@/components/dashboard/WeatherAndBeachConditions";
import { EmergencyContacts } from "@/components/dashboard/EmergencyContacts";
import { LiveCameraEmbed } from "@/components/dashboard/LiveCameraEmbed";
import { PhotoCarousel } from "@/components/photos/PhotoCarousel";

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
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalDocuments: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    fetchProfile();
    fetchAnnouncements();
    fetchStats();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (data) setProfile(data);
  };

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
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {profile?.full_name || "Owner"}!
        </h2>
        <p className="text-xl text-muted-foreground">
          {profile?.unit_number && `Unit ${profile.unit_number}`}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/chat">
          <Card className="cursor-pointer hover:border-primary transition-colors">
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
          <Card className="cursor-pointer hover:border-primary transition-colors">
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
          <Card className="cursor-pointer hover:border-primary transition-colors">
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

      <div className="grid gap-4 md:grid-cols-2">
        <WeatherAndBeachConditions />
        <LiveCameraEmbed />
      </div>

      <PhotoCarousel />

      <div className="grid gap-4 md:grid-cols-2">
        <EmergencyContacts />

        <Link to="/announcements">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="text-2xl">Recent Announcements</CardTitle>
              <CardDescription className="text-lg">
                Important updates from the board and administration
              </CardDescription>
            </CardHeader>
          <CardContent className="space-y-4">
            {announcements.length === 0 ? (
              <p className="text-lg text-muted-foreground">No announcements yet.</p>
            ) : (
              announcements.map((announcement) => (
                <Card key={announcement.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {announcement.is_pinned && (
                            <Badge variant="secondary" className="text-base">
                              <Pin className="h-4 w-4 mr-1" />
                              Pinned
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl">{announcement.title}</CardTitle>
                        <CardDescription className="text-base mt-1">
                          Posted by {announcement.profiles.full_name} on{" "}
                          {format(new Date(announcement.created_at), "MMM dd, yyyy")}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base whitespace-pre-wrap">{announcement.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;