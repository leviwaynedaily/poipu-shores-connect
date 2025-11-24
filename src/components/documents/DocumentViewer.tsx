import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);

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

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const isPDF = fileType === "application/pdf" || documentTitle.toLowerCase().endsWith(".pdf");
  const isImage = fileType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(documentTitle);

  return (
    <Dialog open={!!documentId} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col" hideClose>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate pr-4">{documentTitle}</DialogTitle>
            <div className="flex gap-2 flex-shrink-0">
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

        <div className="flex-1 overflow-auto rounded-lg border bg-muted/20">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading document...</p>
            </div>
          ) : fileUrl ? (
            <>
              {isPDF ? (
                <div className="flex flex-col items-center gap-4 p-4">
                  <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(error) => {
                      console.error("Error loading PDF:", error);
                      toast({
                        title: "Error",
                        description: "Failed to load PDF document",
                        variant: "destructive",
                      });
                    }}
                    loading={
                      <div className="flex items-center justify-center py-8">
                        <p className="text-muted-foreground">Loading PDF...</p>
                      </div>
                    }
                  >
                    <Page
                      pageNumber={pageNumber}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="shadow-lg"
                      width={Math.min(window.innerWidth * 0.7, 900)}
                    />
                  </Document>
                  
                  {numPages > 1 && (
                    <div className="flex items-center gap-4 bg-background rounded-lg p-2 shadow-md">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageNumber(page => Math.max(1, page - 1))}
                        disabled={pageNumber <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium">
                        Page {pageNumber} of {numPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageNumber(page => Math.min(numPages, page + 1))}
                        disabled={pageNumber >= numPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
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
