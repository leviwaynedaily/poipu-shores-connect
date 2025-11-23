import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";

interface Photo {
  id: string;
  title: string;
  caption: string | null;
  file_path: string;
  uploaded_by: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

export function PhotoCarousel() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentPhotos();
  }, []);

  const fetchRecentPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from("community_photos")
        .select(`
          *,
          profiles!community_photos_uploaded_by_fkey (
            full_name
          )
        `)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setPhotos((data as any) || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from("community-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="w-full h-64" />
        </CardContent>
      </Card>
    );
  }

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No photos yet. Be the first to share!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Community Photos</h3>
          <button
            onClick={() => navigate("/photos")}
            className="text-sm text-primary hover:underline"
          >
            View Gallery
          </button>
        </div>
        <Carousel
          plugins={[
            Autoplay({
              delay: 4000,
            }),
          ]}
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent>
            {photos.map((photo) => (
              <CarouselItem key={photo.id}>
                <div
                  className="relative cursor-pointer group"
                  onClick={() => navigate("/photos")}
                >
                  <img
                    src={getPhotoUrl(photo.file_path)}
                    alt={photo.title}
                    className="w-full h-64 object-cover rounded-md"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h4 className="font-semibold text-lg">{photo.title}</h4>
                      {photo.caption && (
                        <p className="text-sm opacity-90">{photo.caption}</p>
                      )}
                      <p className="text-xs opacity-75 mt-1">
                        By {photo.profiles.full_name}
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
      </CardContent>
    </Card>
  );
}
