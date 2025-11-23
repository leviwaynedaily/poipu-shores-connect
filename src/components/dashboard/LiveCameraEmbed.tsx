import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Video } from "lucide-react";
import { toast } from "sonner";

interface Webcam {
  id: string;
  name: string;
  location: string;
  url: string;
  webcam_type: 'youtube' | 'external';
  display_order: number;
}

export const LiveCameraEmbed = () => {
  const [webcam, setWebcam] = useState<Webcam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWebcam = async () => {
      try {
        const { data, error } = await supabase
          .from('webcams')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .limit(1)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No webcams found
            setWebcam(null);
          } else {
            throw error;
          }
        } else {
          setWebcam(data as Webcam);
        }
      } catch (error) {
        console.error('Error fetching webcam:', error);
        toast.error('Failed to load webcam');
      } finally {
        setLoading(false);
      }
    };

    fetchWebcam();
  }, []);

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

  if (!webcam) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Live Beach Cam</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-2">
            <Video className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No webcam configured yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Live Beach Cam</CardTitle>
        <p className="text-xs text-muted-foreground">{webcam.location}</p>
      </CardHeader>
      <CardContent>
        {webcam.webcam_type === 'youtube' ? (
          <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
            <iframe
              src={webcam.url}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={webcam.name}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg space-y-4">
            <Video className="h-16 w-16 text-muted-foreground" />
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                This camera cannot be embedded
              </p>
              <Button
                onClick={() => window.open(webcam.url, '_blank')}
                variant="default"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Live Stream
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};