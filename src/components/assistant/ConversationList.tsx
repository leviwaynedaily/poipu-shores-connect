import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Trash2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface ConversationListProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

export const ConversationList = ({
  activeConversationId,
  onSelectConversation,
}: ConversationListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "community_assistant_conversations",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadConversations = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from("community_assistant_conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      setConversations(data || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const { error } = await supabase
        .from("community_assistant_conversations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Conversation deleted",
      });

      if (activeConversationId === id) {
        onSelectConversation(null as any); // Reset to new chat
      }
    } catch (error: any) {
      console.error("Error deleting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  };

  const groupConversations = () => {
    const now = new Date();
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const previous7Days: Conversation[] = [];
    const older: Conversation[] = [];

    conversations.forEach((conv) => {
      const updatedAt = new Date(conv.updated_at);
      const diffInHours = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        today.push(conv);
      } else if (diffInHours < 48) {
        yesterday.push(conv);
      } else if (diffInHours < 168) {
        previous7Days.push(conv);
      } else {
        older.push(conv);
      }
    });

    return { today, yesterday, previous7Days, older };
  };

  const renderConversation = (conv: Conversation) => (
    <Button
      key={conv.id}
      variant={activeConversationId === conv.id ? "secondary" : "ghost"}
      className="w-full justify-start mb-1 h-auto py-3 px-3"
      onClick={() => onSelectConversation(conv.id)}
    >
      <div className="flex items-start justify-between w-full gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium truncate">
              {conv.title || "New Chat"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={(e) => deleteConversation(conv.id, e)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </Button>
  );

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  const { today, yesterday, previous7Days, older } = groupConversations();

  return (
    <div className="p-2">
      {today.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground px-3 mb-2">
            Today
          </h3>
          {today.map(renderConversation)}
        </div>
      )}

      {yesterday.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground px-3 mb-2">
            Yesterday
          </h3>
          {yesterday.map(renderConversation)}
        </div>
      )}

      {previous7Days.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground px-3 mb-2">
            Previous 7 Days
          </h3>
          {previous7Days.map(renderConversation)}
        </div>
      )}

      {older.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground px-3 mb-2">
            Older
          </h3>
          {older.map(renderConversation)}
        </div>
      )}

      {conversations.length === 0 && (
        <div className="text-center py-8 px-4">
          <p className="text-sm text-muted-foreground">
            No conversations yet. Start a new chat!
          </p>
        </div>
      )}
    </div>
  );
};
