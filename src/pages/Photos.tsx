import { useState } from "react";
import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { PhotoUpload } from "@/components/photos/PhotoUpload";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera } from "lucide-react";

export default function Photos() {
  const [showUpload, setShowUpload] = useState(false);

  const handleUploadComplete = () => {
    setShowUpload(false);
    // Trigger gallery refresh by re-mounting
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-6">
          <div className="space-y-1 sm:space-y-1.5">
            <CardTitle className="text-xl sm:text-2xl md:text-3xl">Community Photos</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Share and discover beautiful moments from Poipu Shores
            </CardDescription>
          </div>
          <Button onClick={() => setShowUpload(!showUpload)} className="gap-2 shrink-0" size="sm">
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">{showUpload ? "View Gallery" : "Upload Photo"}</span>
            <span className="sm:hidden">{showUpload ? "View" : "Upload"}</span>
          </Button>
        </CardHeader>
      </Card>

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
