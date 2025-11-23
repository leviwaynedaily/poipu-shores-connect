import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Video, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Webcam {
  id: string;
  name: string;
  location: string;
  url: string;
  webcam_type: 'youtube' | 'external';
  display_order: number;
}

export const LiveCameraDropdown = () => {
  const [webcams, setWebcams] = useState<Webcam[]>([]);
  const [selectedWebcam, setSelectedWebcam] = useState<Webcam | null>(null);
  const [isOpen, setIsOpen] = useState(false);
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

  const handleWebcamSelect = (webcam: Webcam) => {
    if (webcam.webcam_type === 'external') {
      window.open(webcam.url, '_blank');
    } else {
      setSelectedWebcam(webcam);
      setIsOpen(true);
    }
  };

  if (loading || webcams.length === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Video className="h-4 w-4" />
            Live Beach Cams
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 bg-background z-50">
          <div className="px-2 py-1.5 text-sm font-semibold">Select a Camera</div>
          <DropdownMenuSeparator />
          {webcams.map((webcam) => (
            <DropdownMenuItem
              key={webcam.id}
              onClick={() => handleWebcamSelect(webcam)}
              className="cursor-pointer"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium">{webcam.name}</span>
                <span className="text-xs text-muted-foreground">{webcam.location}</span>
              </div>
              {webcam.webcam_type === 'external' && (
                <ExternalLink className="ml-auto h-3 w-3" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl bg-background">
          <DialogHeader>
            <DialogTitle>{selectedWebcam?.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">{selectedWebcam?.location}</p>
          </DialogHeader>
          {selectedWebcam && selectedWebcam.webcam_type === 'youtube' && (
            <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
              <iframe
                src={selectedWebcam.url}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={selectedWebcam.name}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
