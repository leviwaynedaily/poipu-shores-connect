import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StickyActionBarProps {
  hasChanges: boolean;
  onSave: () => void;
  onDiscard: () => void;
  saving?: boolean;
  className?: string;
}

export function StickyActionBar({
  hasChanges,
  onSave,
  onDiscard,
  saving = false,
  className,
}: StickyActionBarProps) {
  if (!hasChanges) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/80 backdrop-blur-md animate-in slide-in-from-bottom duration-300",
        className
      )}
    >
      <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          You have unsaved changes
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onDiscard}
            disabled={saving}
          >
            Discard Changes
          </Button>
          <Button
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
