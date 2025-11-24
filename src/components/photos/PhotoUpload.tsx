import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import exifr from "exifr";

interface PhotoUploadProps {
  onUploadComplete?: () => void;
}

interface PhotoPreview {
  file: File;
  preview: string;
  title: string;
  tags: string;
  generatingTitle: boolean;
}

export function PhotoUpload({ onUploadComplete }: PhotoUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    for (const file of selectedFiles) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        continue;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const preview = reader.result as string;
        const defaultTitle = file.name.replace(/\.[^/.]+$/, "");
        
        setPhotos(prev => [...prev, {
          file,
          preview,
          title: defaultTitle,
          tags: "",
          generatingTitle: false
        }]);
      };
      reader.readAsDataURL(file);
    }
    
    // Reset input
    e.target.value = "";
  };

  const generateTitle = async (index: number) => {
    const photo = photos[index];
    setPhotos(prev => prev.map((p, i) => 
      i === index ? { ...p, generatingTitle: true } : p
    ));

    try {
      const { data, error } = await supabase.functions.invoke("generate-photo-title", {
        body: { imageBase64: photo.preview }
      });

      if (error) throw error;

      setPhotos(prev => prev.map((p, i) => 
        i === index ? { ...p, title: data.title, generatingTitle: false } : p
      ));
      
      toast.success("Title generated!");
    } catch (error) {
      console.error("Error generating title:", error);
      toast.error("Failed to generate title");
      setPhotos(prev => prev.map((p, i) => 
        i === index ? { ...p, generatingTitle: false } : p
      ));
    }
  };

  const updatePhoto = (index: number, field: 'title' | 'tags', value: string) => {
    setPhotos(prev => prev.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    ));
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (!user || photos.length === 0) {
      toast.error("Please select photos to upload");
      return;
    }

    setUploading(true);
    let successCount = 0;

    try {
      for (const photo of photos) {
        const fileExt = photo.file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        // Extract EXIF data
        let exifData: any = {};
        let dateTaken = null;
        let cameraMake = null;
        let cameraModel = null;
        let gpsLatitude = null;
        let gpsLongitude = null;

        try {
          exifData = await exifr.parse(photo.file, {
            tiff: true,
            exif: true,
            gps: true,
            iptc: true,
            icc: true
          });

          if (exifData) {
            dateTaken = exifData.DateTimeOriginal || exifData.CreateDate || null;
            cameraMake = exifData.Make || null;
            cameraModel = exifData.Model || null;
            gpsLatitude = exifData.latitude || null;
            gpsLongitude = exifData.longitude || null;
          }
        } catch (exifError) {
          console.log("No EXIF data found:", exifError);
        }

        const { error: uploadError } = await supabase.storage
          .from("community-photos")
          .upload(fileName, photo.file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error(`Failed to upload ${photo.title}`);
          continue;
        }

        const { error: dbError } = await supabase.from("community_photos").insert({
          title: photo.title,
          caption: photo.tags || null,
          file_path: fileName,
          file_size: photo.file.size,
          category: photo.tags || "general",
          location: null,
          uploaded_by: user.id,
          date_taken: dateTaken,
          camera_make: cameraMake,
          camera_model: cameraModel,
          gps_latitude: gpsLatitude,
          gps_longitude: gpsLongitude,
          exif_data: exifData || null,
        });

        if (dbError) {
          console.error("DB error:", dbError);
          toast.error(`Failed to save ${photo.title}`);
          continue;
        }

        successCount++;
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} photo${successCount > 1 ? 's' : ''}!`);
        setPhotos([]);
        if (onUploadComplete) {
          onUploadComplete();
        }
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error("Failed to upload photos");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Photos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="photo-upload">Select Photos</Label>
          <div className="mt-2">
            <label
              htmlFor="photo-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (MAX. 10MB each)</p>
              </div>
              <input
                id="photo-upload"
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

        {photos.length > 0 && (
          <div className="space-y-4">
            {photos.map((photo, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative flex-shrink-0">
                      <img 
                        src={photo.preview} 
                        alt="Preview" 
                        className="w-24 h-24 object-cover rounded-lg" 
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label htmlFor={`title-${index}`}>Title</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`title-${index}`}
                            value={photo.title}
                            onChange={(e) => updatePhoto(index, 'title', e.target.value)}
                            placeholder="Photo title"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => generateTitle(index)}
                            disabled={photo.generatingTitle}
                            title="Generate AI title"
                          >
                            <Sparkles className={`h-4 w-4 ${photo.generatingTitle ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor={`tags-${index}`}>Tags (Optional)</Label>
                        <Input
                          id={`tags-${index}`}
                          value={photo.tags}
                          onChange={(e) => updatePhoto(index, 'tags', e.target.value)}
                          placeholder="beach, sunset, wildlife"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              onClick={handleUploadAll}
              disabled={uploading}
              className="w-full"
              size="lg"
            >
              {uploading ? "Uploading..." : `Upload ${photos.length} Photo${photos.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
