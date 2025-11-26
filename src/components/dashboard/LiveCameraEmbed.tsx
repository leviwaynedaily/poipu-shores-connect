import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface LiveCameraEmbedProps {
  compact?: boolean;
}

export const LiveCameraEmbed = ({ compact = false }: LiveCameraEmbedProps) => {
  const [webcams, setWebcams] = useState<Webcam[]>([]);
  const [selectedWebcam, setSelectedWebcam] = useState<Webcam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWebcams = async () => {
      try {
        const { data, error } = await supabase
          .from('webcams')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setWebcams(data as Webcam[]);
          setSelectedWebcam(data[0] as Webcam);
        }
      } catch (error) {
        console.error('Error fetching webcams:', error);
        toast.error('Failed to load webcams');
      } finally {
        setLoading(false);
      }
    };

    fetchWebcams();
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

  if (!selectedWebcam || webcams.length === 0) {
    if (compact) {
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Live Beach Cam</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-24 text-center">
              <p className="text-sm text-muted-foreground">No webcam configured</p>
            </div>
          </CardContent>
        </Card>
      );
    }
    
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

  // Compact mobile view - thumbnail with button
  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Live Beach Cam</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-24 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted">
              <Video className="h-8 w-8 text-muted-foreground" />
              <Button
                size="sm"
                onClick={() => window.open(selectedWebcam.url, '_blank')}
              >
                Watch Live
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full desktop view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Live Beach Cam</CardTitle>
        </div>
        <div className="mt-2">
          <Select
            value={selectedWebcam.id}
            onValueChange={(value) => {
              const webcam = webcams.find(w => w.id === value);
              if (webcam) setSelectedWebcam(webcam);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedWebcam.name}</span>
                  <span className="text-xs text-muted-foreground">• {selectedWebcam.location}</span>
                  {selectedWebcam.webcam_type === 'external' && (
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {webcams.map((webcam) => (
                <SelectItem key={webcam.id} value={webcam.id}>
                  <div className="flex items-center gap-2">
                    <span>{webcam.name}</span>
                    <span className="text-xs text-muted-foreground">• {webcam.location}</span>
                    {webcam.webcam_type === 'external' && (
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {selectedWebcam.webcam_type === 'youtube' ? (
          <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
            <iframe
              src={selectedWebcam.url}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={selectedWebcam.name}
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
                onClick={() => window.open(selectedWebcam.url, '_blank')}
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