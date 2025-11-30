import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { ConversationList } from "./ConversationList";

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
  return (
    <div className="flex flex-col h-full border-r bg-muted/30">
      <div className="p-4 border-b flex-shrink-0">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2"
          variant="default"
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
