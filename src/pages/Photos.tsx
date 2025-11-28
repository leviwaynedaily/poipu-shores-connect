import { useState } from "react";
import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { PhotoUpload } from "@/components/photos/PhotoUpload";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { usePageConfig } from "@/hooks/use-page-config";

export default function Photos() {
  const [showUpload, setShowUpload] = useState(false);
  const { pageConfig } = usePageConfig();

  const handleUploadComplete = () => {
    setShowUpload(false);
    // Trigger gallery refresh by re-mounting
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageConfig?.title || "Community Photos"}
        description={pageConfig?.subtitle || "Share and discover beautiful moments from Poipu Shores"}
        logoUrl={pageConfig?.headerLogoUrl}
        actions={
          <Button onClick={() => setShowUpload(!showUpload)} className="gap-2 shrink-0" size="sm">
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">{showUpload ? "View Gallery" : "Upload Photo"}</span>
            <span className="sm:hidden">{showUpload ? "View" : "Upload"}</span>
          </Button>
        }
      />

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
