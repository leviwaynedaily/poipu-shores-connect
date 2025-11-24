import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, Settings, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ChannelManager } from "@/components/ChannelManager";

interface Message {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  channel_id: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface Channel {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean | null;
}

const Chat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChannelManager, setShowChannelManager] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAdminStatus();
    fetchChannels();
  }, [user]);

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages();
      
      // Set up realtime subscription for messages
      const messagesChannel = supabase
        .channel(`chat-messages-${selectedChannel}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "chat_messages",
            filter: `channel_id=eq.${selectedChannel}`,
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [selectedChannel]);

  useEffect(() => {
    // Set up realtime subscription for channels
    const channelsChannel = supabase
      .channel("chat-channels")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_channels",
        },
        () => {
          fetchChannels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelsChannel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "board"]);
    
    setIsAdmin(!!data && data.length > 0);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const fetchChannels = async () => {
    const { data, error } = await supabase
      .from("chat_channels")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching channels:", error);
      toast({
        title: "Error",
        description: "Failed to load chat channels",
        variant: "destructive",
      });
      return;
    }

    if (data && data.length > 0) {
      console.log("Loaded channels:", data);
      setChannels(data);
      // Always set the first channel if none selected
      if (!selectedChannel) {
        console.log("Setting selected channel to:", data[0].id);
        setSelectedChannel(data[0].id);
      }
    } else {
      console.log("No channels found");
    }
  };

  const fetchMessages = async () => {
    if (!selectedChannel) return;

    // Fetch messages
    const { data: messagesData } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("channel_id", selectedChannel)
      .order("created_at", { ascending: true });

    if (!messagesData || messagesData.length === 0) {
      setMessages([]);
      return;
    }

    // Get unique author IDs
    const authorIds = [...new Set(messagesData.map(m => m.author_id))];

    // Fetch profiles for all authors
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", authorIds);

    // Map profiles to messages
    const messagesWithProfiles = messagesData.map(message => {
      const profile = profilesData?.find(p => p.id === message.author_id);
      return {
        ...message,
        profiles: {
          full_name: profile?.full_name || "Unknown User",
          avatar_url: profile?.avatar_url || null
        }
      };
    });

    setMessages(messagesWithProfiles as any);
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", messageId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to send messages",
        variant: "destructive",
      });
      return;
    }

    if (!newMessage.trim()) {
      return;
    }

    if (!selectedChannel) {
      toast({
        title: "Error",
        description: "Please select a channel first",
        variant: "destructive",
      });
      return;
    }

    console.log("Sending message to channel:", selectedChannel);

    const { error } = await supabase
      .from("chat_messages")
      .insert({
        content: newMessage.trim(),
        author_id: user.id,
        channel_id: selectedChannel,
        is_private: false,
      });

    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNewMessage("");
    }
  };

  const currentChannel = channels.find(c => c.id === selectedChannel);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Community Chat</h2>
          <p className="text-lg text-muted-foreground">
            Connect with your neighbors and community
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowChannelManager(!showChannelManager)}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Channels
          </Button>
        )}
      </div>

      {showChannelManager && isAdmin && (
        <ChannelManager onClose={() => setShowChannelManager(false)} />
      )}

      <Card className="h-[calc(100vh-16rem)]">
        <CardHeader className="border-b space-y-3">
          <CardTitle className="text-xl">
            {currentChannel?.name || "Select a Channel"}
            {currentChannel?.is_private && " 🔒"}
          </CardTitle>
          {currentChannel?.description && (
            <p className="text-base text-muted-foreground">
              {currentChannel.description}
            </p>
          )}
          {channels.length > 1 && (
            <Tabs value={selectedChannel} onValueChange={setSelectedChannel} className="w-full">
              <TabsList className="w-full h-auto grid grid-cols-2 md:grid-cols-4 gap-2">
                {channels.map((channel) => (
                  <TabsTrigger 
                    key={channel.id} 
                    value={channel.id} 
                    className="text-base px-4 py-2"
                  >
                    {channel.name}
                    {channel.is_private && " 🔒"}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </CardHeader>
        <CardContent className="p-0 flex flex-col h-[calc(100%-5rem)]">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-3">
              {messages.map((message) => {
                const isOwnMessage = message.author_id === user?.id;
                const initials = message.profiles.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();

                return (
                  <div
                    key={message.id}
                    className="flex gap-3 group hover:bg-muted/50 p-2 rounded transition-colors"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      {message.profiles.avatar_url ? (
                        <AvatarImage src={message.profiles.avatar_url} alt={message.profiles.full_name} />
                      ) : null}
                      <AvatarFallback className="text-sm">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-base text-foreground">
                          {message.profiles.full_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.created_at), "h:mm a")}
                        </span>
                      </div>
                      <p className="text-base text-foreground whitespace-pre-wrap mt-1">
                        {message.content}
                      </p>
                    </div>
                    {isOwnMessage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-8 w-8"
                        onClick={() => handleDeleteMessage(message.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="text-lg resize-none"
                rows={2}
              />
              <Button type="submit" size="lg" disabled={!newMessage.trim()}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Chat;
