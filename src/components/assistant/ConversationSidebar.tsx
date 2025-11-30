import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { ConversationList } from "./ConversationList";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface ConversationSidebarProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
  onNewChat: () => void;
}

export const ConversationSidebar = ({
  activeConversationId,
  onSelectConversation,
  onNewChat,
}: ConversationSidebarProps) => {
  const { isGlassTheme, glassIntensity } = useTheme();
  
  // Calculate opacity based on intensity (matching Card component)
  const opacity = isGlassTheme ? 5 + (glassIntensity * 0.95) : 100;
  const borderOpacity = isGlassTheme ? 15 + (glassIntensity * 0.85) : 100;

  return (
    <div 
      className={cn(
        "flex flex-col h-full rounded-lg shadow-sm",
        isGlassTheme ? "backdrop-blur-sm" : "bg-card border border-border"
      )}
      style={isGlassTheme ? {
        backgroundColor: `hsl(var(--card) / ${opacity}%)`,
        borderColor: `hsl(var(--border) / ${borderOpacity}%)`
      } : undefined}
    >
      <div className="p-4 border-b border-border/50 flex-shrink-0">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <ConversationList
          activeConversationId={activeConversationId}
          onSelectConversation={onSelectConversation}
        />
      </ScrollArea>
    </div>
  );
};
