import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Maximize2, RefreshCw, Video } from "lucide-react";
import { toast } from "sonner";

interface CameraSettings {
  id: string;
  camera_name: string;
  camera_url: string;
  is_active: boolean;
}

export const LiveCamera = () => {
  const [camera, setCamera] = useState<CameraSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchCameraSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('live_camera_settings')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setCamera(data);
    } catch (error) {
      console.error('Error fetching camera settings:', error);
      toast.error('Failed to load camera settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameraSettings();
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleFullscreen = () => {
    if (camera?.camera_url) {
      window.open(camera.camera_url, '_blank');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Beach Cam</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!camera) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Live Beach Cam</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-2">
            <Video className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Camera feed not configured yet
            </p>
            <p className="text-xs text-muted-foreground">
              Contact your administrator to set up the live camera
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">Live Beach Cam</CardTitle>
          <p className="text-xs text-muted-foreground">{camera.camera_name}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFullscreen}
            className="h-8 w-8 p-0"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
          <iframe
            key={refreshKey}
            src={camera.camera_url}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
            title={camera.camera_name}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
};
