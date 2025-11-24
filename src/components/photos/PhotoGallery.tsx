import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Calendar, User, Trash2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  const { user, isAdmin, isBoard } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const canDeletePhoto = (photo: Photo) => {
    return user && (photo.uploaded_by === user.id || isAdmin || isBoard);
  };

  const handleDeletePhoto = async () => {
    if (!deletePhotoId) return;

    setDeleting(true);
    try {
      const photoToDelete = photos.find(p => p.id === deletePhotoId);
      if (!photoToDelete) throw new Error("Photo not found");

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("community-photos")
        .remove([photoToDelete.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("community_photos")
        .delete()
        .eq("id", deletePhotoId);

      if (dbError) throw dbError;

      toast.success("Photo deleted successfully");
      setPhotos(photos.filter(p => p.id !== deletePhotoId));
      setDeletePhotoId(null);
      if (selectedPhoto?.id === deletePhotoId) {
        setSelectedPhoto(null);
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Failed to delete photo");
    } finally {
      setDeleting(false);
    }
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
                  <div className="relative group">
                    <img
                      src={getPhotoUrl(photo.file_path)}
                      alt={photo.title}
                      className="w-full h-64 object-cover"
                    />
                    {canDeletePhoto(photo) && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletePhotoId(photo.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-lg">{photo.title}</h3>
                    
                    {photo.caption && (
                      <div className="flex flex-wrap gap-1">
                        {photo.caption.split(',').map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3" />
                        <span>{photo.profiles.full_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>Uploaded {formatDistanceToNow(new Date(photo.created_at), { addSuffix: true })}</span>
                      </div>
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
                <div className="flex items-center justify-between">
                  <DialogTitle>{selectedPhoto.title}</DialogTitle>
                  {canDeletePhoto(selectedPhoto) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDeletePhotoId(selectedPhoto.id);
                        setSelectedPhoto(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Photo
                    </Button>
                  )}
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <img
                  src={getPhotoUrl(selectedPhoto.file_path)}
                  alt={selectedPhoto.title}
                  className="w-full max-h-[60vh] object-contain rounded-lg"
                />
                
                {selectedPhoto.caption && (
                  <div>
                    <span className="font-semibold text-sm">Tags:</span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedPhoto.caption.split(',').map((tag, idx) => (
                        <Badge key={idx} variant="secondary">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="font-semibold">Uploaded by:</span>{" "}
                      <span className="text-muted-foreground">{selectedPhoto.profiles.full_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="font-semibold">Upload date:</span>{" "}
                      <span className="text-muted-foreground">
                        {format(new Date(selectedPhoto.created_at), 'PPP')} ({formatDistanceToNow(new Date(selectedPhoto.created_at), { addSuffix: true })})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletePhotoId} onOpenChange={() => setDeletePhotoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePhoto}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
