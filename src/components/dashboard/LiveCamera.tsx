import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export const LiveCamera = () => {
  const [webcams, setWebcams] = useState<Webcam[]>([]);
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

        setWebcams((data || []) as Webcam[]);
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
          <CardTitle>Live Beach Cams</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (webcams.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Live Beach Cams</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-2">
            <Video className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No webcams configured yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Live Beach Cams</CardTitle>
        <p className="text-xs text-muted-foreground">Multiple viewing locations</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={webcams[0]?.id} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${webcams.length}, minmax(0, 1fr))` }}>
            {webcams.map((webcam) => (
              <TabsTrigger key={webcam.id} value={webcam.id} className="text-xs">
                {webcam.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {webcams.map((webcam) => (
            <TabsContent key={webcam.id} value={webcam.id} className="mt-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{webcam.location}</p>
                
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
                        View on {webcam.name}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
