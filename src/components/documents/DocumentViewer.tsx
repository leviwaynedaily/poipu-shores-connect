import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface DocumentViewerProps {
  documentId: string | null;
  documentTitle: string;
  filePath: string;
  fileType: string | null;
  onClose: () => void;
}

export function DocumentViewer({
  documentId,
  documentTitle,
  filePath,
  fileType,
  onClose,
}: DocumentViewerProps) {
  const { toast } = useToast();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!documentId) return;

    const loadDocument = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.storage
          .from("documents")
          .download(filePath);

        if (error) throw error;

        const url = URL.createObjectURL(data);
        setFileUrl(url);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();

    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [documentId, filePath]);

  const handleDownload = () => {
    if (!fileUrl) return;

    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = documentTitle;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isPDF = fileType === "application/pdf" || documentTitle.toLowerCase().endsWith(".pdf");
  const isImage = fileType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(documentTitle);

  return (
    <Dialog open={!!documentId} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{documentTitle}</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!fileUrl}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden rounded-lg border bg-background">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading document...</p>
            </div>
          ) : fileUrl ? (
            <>
              {isPDF ? (
                <iframe
                  src={fileUrl}
                  className="w-full h-full"
                  title={documentTitle}
                />
              ) : isImage ? (
                <div className="flex items-center justify-center h-full p-4">
                  <img
                    src={fileUrl}
                    alt={documentTitle}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                  <p className="text-muted-foreground text-center">
                    Preview not available for this file type.
                  </p>
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download to view
                  </Button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
