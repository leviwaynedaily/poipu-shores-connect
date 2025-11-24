import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

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
        .limit(4);

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
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="w-full h-48" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No photos yet. Be the first to share!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="relative cursor-pointer group overflow-hidden rounded-lg"
          onClick={() => navigate("/photos")}
        >
          <img
            src={getPhotoUrl(photo.file_path)}
            alt={photo.title}
            className="w-full h-48 object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
              <h4 className="font-semibold text-sm line-clamp-1">{photo.title}</h4>
              <p className="text-xs opacity-90 mt-0.5">
                by {photo.profiles.full_name}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
