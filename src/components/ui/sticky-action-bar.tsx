import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Check, X } from "lucide-react";
import { useEffect, useState } from "react";

type SaveState = "idle" | "saving" | "success" | "error";

interface StickyActionBarProps {
  hasChanges: boolean;
  onSave: () => Promise<void> | void;
  onDiscard: () => void;
  saving?: boolean;
  className?: string;
  message?: string;
  saveText?: string;
  discardText?: string;
  successText?: string;
  errorText?: string;
  autoDismissOnSuccess?: boolean;
  autoDismissDelay?: number;
}

export function StickyActionBar({
  hasChanges,
  onSave,
  onDiscard,
  saving = false,
  className,
  message = "You have unsaved changes",
  saveText = "Save Changes",
  discardText = "Discard",
  successText = "Saved!",
  errorText = "Failed to save",
  autoDismissOnSuccess = false,
  autoDismissDelay = 1500,
}: StickyActionBarProps) {
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // Reset state when hasChanges changes
  useEffect(() => {
    if (hasChanges) {
      setSaveState("idle");
    }
  }, [hasChanges]);

  const handleSave = async () => {
    setSaveState("saving");
    try {
      await onSave();
      setSaveState("success");
      if (autoDismissOnSuccess) {
        setTimeout(() => {
          setSaveState("idle");
        }, autoDismissDelay);
      }
    } catch (error) {
      setSaveState("error");
      setTimeout(() => {
        setSaveState("idle");
      }, 2000);
    }
  };

  if (!hasChanges && saveState !== "success") return null;

  const isProcessing = saveState === "saving" || saving;

  const getButtonContent = () => {
    switch (saveState) {
      case "saving":
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        );
      case "success":
        return (
          <>
            <Check className="mr-2 h-4 w-4" />
            {successText}
          </>
        );
      case "error":
        return (
          <>
            <X className="mr-2 h-4 w-4" />
            {errorText}
          </>
        );
      default:
        return saveText;
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/80 backdrop-blur-md animate-in slide-in-from-bottom duration-300",
        className
      )}
    >
      <div className="container max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {saveState === "success" ? successText : message}
        </p>
        <div className="flex gap-2">
          {saveState !== "success" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDiscard}
              disabled={isProcessing}
            >
              {discardText}
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isProcessing || saveState === "success"}
            className={cn(
              saveState === "success" && "bg-green-600 hover:bg-green-600",
              saveState === "error" && "bg-destructive hover:bg-destructive"
            )}
          >
            {getButtonContent()}
          </Button>
        </div>
      </div>
    </div>
  );
}
