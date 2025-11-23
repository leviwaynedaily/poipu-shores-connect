import { useState } from "react";
import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { PhotoUpload } from "@/components/photos/PhotoUpload";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

export default function Photos() {
  const [showUpload, setShowUpload] = useState(false);

  const handleUploadComplete = () => {
    setShowUpload(false);
    // Trigger gallery refresh by re-mounting
    window.location.reload();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Community Photos</h1>
          <p className="text-muted-foreground mt-1">
            Share and discover beautiful moments from Poipu Shores
          </p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)} className="gap-2">
          <Camera className="h-4 w-4" />
          {showUpload ? "View Gallery" : "Upload Photo"}
        </Button>
      </div>

      {showUpload ? (
        <div className="max-w-2xl mx-auto">
          <PhotoUpload onUploadComplete={handleUploadComplete} />
        </div>
      ) : (
        <PhotoGallery />
      )}
    </div>
  );
}
