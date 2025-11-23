import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Photo {
  id: string;
  title: string;
  caption: string | null;
  file_path: string;
  category: string;
  location: string | null;
  uploaded_by: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

export function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  useEffect(() => {
    filterPhotos();
  }, [photos, searchTerm, categoryFilter]);

  const fetchPhotos = async () => {
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
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPhotos((data as any) || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterPhotos = () => {
    let filtered = photos;

    if (categoryFilter !== "all") {
      filtered = filtered.filter((photo) => photo.category === categoryFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (photo) =>
          photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          photo.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          photo.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPhotos(filtered);
  };

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from("community-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-0">
              <Skeleton className="w-full h-64" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search photos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="beach">Beach</SelectItem>
              <SelectItem value="wildlife">Wildlife</SelectItem>
              <SelectItem value="sunset">Sunset</SelectItem>
              <SelectItem value="events">Events</SelectItem>
              <SelectItem value="property">Property</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredPhotos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No photos found. Try adjusting your filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPhotos.map((photo) => (
              <Card
                key={photo.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedPhoto(photo)}
              >
                <CardContent className="p-0">
                  <img
                    src={getPhotoUrl(photo.file_path)}
                    alt={photo.title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{photo.title}</h3>
                    {photo.caption && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {photo.caption}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>By {photo.profiles.full_name}</span>
                      <span>{formatDistanceToNow(new Date(photo.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          {selectedPhoto && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPhoto.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <img
                  src={getPhotoUrl(selectedPhoto.file_path)}
                  alt={selectedPhoto.title}
                  className="w-full max-h-[60vh] object-contain rounded-lg"
                />
                {selectedPhoto.caption && (
                  <p className="text-muted-foreground">{selectedPhoto.caption}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Category:</span>{" "}
                    <span className="text-muted-foreground capitalize">{selectedPhoto.category}</span>
                  </div>
                  {selectedPhoto.location && (
                    <div>
                      <span className="font-semibold">Location:</span>{" "}
                      <span className="text-muted-foreground">{selectedPhoto.location}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Uploaded by:</span>{" "}
                    <span className="text-muted-foreground">{selectedPhoto.profiles.full_name}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Date:</span>{" "}
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(selectedPhoto.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
