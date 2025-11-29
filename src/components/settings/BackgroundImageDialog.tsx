import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";

interface BackgroundImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: Array<{ name: string; url: string }>;
  activeUrl: string | null;
  onSelect: (url: string) => void;
}

export function BackgroundImageDialog({
  open,
  onOpenChange,
  images,
  activeUrl,
  onSelect,
}: BackgroundImageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Select Background Image
          </DialogTitle>
          <DialogDescription>
            Choose from previously uploaded background images
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 pr-2">
          {images.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No background images available</p>
              <p className="text-sm mt-1">Upload or generate a background to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((image) => {
                const isActive = activeUrl === image.url;
                return (
                  <button
                    key={image.name}
                    onClick={() => {
                      onSelect(image.url);
                      onOpenChange(false);
                    }}
                    className={`group relative rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02] bg-muted ${
                      isActive
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="aspect-video bg-background">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="text-xs font-semibold text-primary-foreground bg-primary px-3 py-1.5 rounded-full shadow-lg">
                          Active
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate">{image.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
