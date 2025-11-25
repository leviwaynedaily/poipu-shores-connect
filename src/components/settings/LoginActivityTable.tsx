import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

type LoginRecord = {
  id: string;
  user_id: string;
  logged_in_at: string;
  ip_address: string | null;
  user_agent: string | null;
  browser: string | null;
  device_type: string | null;
  location_city: string | null;
  location_country: string | null;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
};

export function LoginActivityTable() {
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayLogins: 0,
    weekLogins: 0,
    activeNow: 0,
  });

  useEffect(() => {
    fetchLoginHistory();
    
    // Set up realtime subscription for new logins
    const channel = supabase
      .channel('login-history-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'login_history'
        },
        () => {
          fetchLoginHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLoginHistory = async () => {
    try {
      // Fetch recent login history with user profiles
      const { data: historyData, error: historyError } = await supabase
        .from('login_history')
        .select(`
          id,
          user_id,
          logged_in_at,
          ip_address,
          user_agent,
          browser,
          device_type,
          location_city,
          location_country
        `)
        .order('logged_in_at', { ascending: false })
        .limit(50);

      if (historyError) throw historyError;

      // Fetch profiles separately to avoid foreign key issues
      const userIds = [...new Set((historyData || []).map(record => record.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      // Merge profiles with login history
      const enrichedData: LoginRecord[] = (historyData || []).map(record => ({
        ...record,
        profile: profilesData?.find(p => p.id === record.user_id) || {
          full_name: 'Unknown User',
          avatar_url: null
        }
      }));

      setLoginHistory(enrichedData);

      // Calculate stats
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const todayCount = enrichedData.filter(
        record => new Date(record.logged_in_at) >= todayStart
      ).length;

      const weekCount = enrichedData.filter(
        record => new Date(record.logged_in_at) >= weekStart
      ).length;

      const activeCount = enrichedData.filter(
        record => new Date(record.logged_in_at) >= fiveMinutesAgo
      ).length;

      setStats({
        todayLogins: todayCount,
        weekLogins: weekCount,
        activeNow: activeCount,
      });
    } catch (error) {
      console.error('Error fetching login history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    if (!deviceType) return '💻';
    if (deviceType.toLowerCase().includes('mobile')) return '📱';
    if (deviceType.toLowerCase().includes('tablet')) return '📱';
    return '💻';
  };

  const isRecentLogin = (loginTime: string) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(loginTime) >= fiveMinutesAgo;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading login activity...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Currently Online</CardDescription>
            <CardTitle className="text-3xl">
              {stats.activeNow}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Logins Today</CardDescription>
            <CardTitle className="text-3xl">
              {stats.todayLogins}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Week</CardDescription>
            <CardTitle className="text-3xl">
              {stats.weekLogins}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Login History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Login Activity</CardTitle>
          <CardDescription>
            Track user authentication events and session data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No login history available
                    </TableCell>
                  </TableRow>
                ) : (
                  loginHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isRecentLogin(record.logged_in_at) && (
                            <span className="flex h-2 w-2 rounded-full bg-green-500" />
                          )}
                          <span className="font-medium">
                            {record.profile?.full_name || 'Unknown User'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(record.logged_in_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{getDeviceIcon(record.device_type)}</span>
                          <span className="text-sm">{record.device_type || 'Desktop'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.browser || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.location_city && record.location_country
                          ? `${record.location_city}, ${record.location_country}`
                          : record.location_country || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {record.ip_address || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}