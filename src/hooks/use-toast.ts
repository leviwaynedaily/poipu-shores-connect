import { toast as sonnerToast } from "sonner";

// Proxy to Sonner toast - maintains backward compatibility with old toast API
type ToastProps = {
  title?: string;
  description?: string | React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
};

function toast(props: ToastProps) {
  const { title, description, variant, duration } = props;
  
  if (variant === "destructive") {
    return sonnerToast.error(title, { 
      description: description as string,
      duration 
    });
  }
  
  return sonnerToast.success(title, { 
    description: description as string,
    duration 
  });
}

// For components that use the hook pattern
function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    toasts: [] as any[], // Legacy compatibility
  };
}

export { useToast, toast };
