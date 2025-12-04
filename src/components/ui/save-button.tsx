import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SaveState = "idle" | "saving" | "success" | "error";

interface SaveButtonProps extends Omit<ButtonProps, "onClick" | "onError"> {
  onClick: () => Promise<void> | void;
  idleText?: string;
  savingText?: string;
  successText?: string;
  errorText?: string;
  resetDelay?: number;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

const SaveButton = React.forwardRef<HTMLButtonElement, SaveButtonProps>(
  (
    {
      onClick,
      idleText = "Save",
      savingText = "Saving...",
      successText = "Saved",
      errorText = "Error",
      resetDelay = 2000,
      onSaveSuccess,
      onSaveError,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [state, setState] = React.useState<SaveState>("idle");

    const handleClick = async () => {
      if (state !== "idle") return;

      setState("saving");
      try {
        await onClick();
        setState("success");
        onSaveSuccess?.();
        setTimeout(() => setState("idle"), resetDelay);
      } catch (error) {
        setState("error");
        onSaveError?.(error as Error);
        setTimeout(() => setState("idle"), resetDelay);
      }
    };

    const getIcon = () => {
      switch (state) {
        case "saving":
          return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
        case "success":
          return <Check className="mr-2 h-4 w-4" />;
        case "error":
          return <X className="mr-2 h-4 w-4" />;
        default:
          return null;
      }
    };

    const getText = () => {
      switch (state) {
        case "saving":
          return savingText;
        case "success":
          return successText;
        case "error":
          return errorText;
        default:
          return children || idleText;
      }
    };

    const getVariant = (): ButtonProps["variant"] => {
      if (state === "success") return "default";
      if (state === "error") return "destructive";
      return props.variant;
    };

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        disabled={disabled || state === "saving"}
        className={cn(
          state === "success" && "bg-green-600 hover:bg-green-600",
          className
        )}
        {...props}
        variant={getVariant()}
      >
        {getIcon()}
        {getText()}
      </Button>
    );
  }
);

SaveButton.displayName = "SaveButton";

export { SaveButton };
export type { SaveButtonProps, SaveState };
