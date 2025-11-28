import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, Settings, Trash2, X, Smile, Reply, Plus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChannelManager } from "@/components/ChannelManager";
import { PageHeader } from "@/components/PageHeader";
import { usePageConfig } from "@/hooks/use-page-config";

interface Message {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  channel_id: string;
  image_url: string | null;
  reply_to: string | null;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
  reply_message?: Message;
  reactions?: MessageReaction[];
}

interface MessageReaction {
  emoji: string;
  count: number;
  user_ids: string[];
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
  const { pageConfig } = usePageConfig();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChannelManager, setShowChannelManager] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

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
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "chat_message_reactions",
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

    // Fetch reactions for all messages
    const { data: reactionsData } = await supabase
      .from("chat_message_reactions")
      .select("*")
      .in("message_id", messagesData.map(m => m.id));

    // Map profiles and reactions to messages
    const messagesWithProfiles = messagesData.map(message => {
      const profile = profilesData?.find(p => p.id === message.author_id);
      const messageReactions = reactionsData?.filter(r => r.message_id === message.id) || [];
      
      // Group reactions by emoji
      const reactionsMap = new Map<string, MessageReaction>();
      messageReactions.forEach(r => {
        const existing = reactionsMap.get(r.emoji);
        if (existing) {
          existing.count++;
          existing.user_ids.push(r.user_id);
        } else {
          reactionsMap.set(r.emoji, {
            emoji: r.emoji,
            count: 1,
            user_ids: [r.user_id]
          });
        }
      });

      // Find reply message if exists
      const replyMessage = message.reply_to 
        ? messagesData.find(m => m.id === message.reply_to)
        : null;

      return {
        ...message,
        profiles: {
          full_name: profile?.full_name || "Unknown User",
          avatar_url: profile?.avatar_url || null
        },
        reactions: Array.from(reactionsMap.values()),
        reply_message: replyMessage ? {
          ...replyMessage,
          profiles: {
            full_name: profilesData?.find(p => p.id === replyMessage.author_id)?.full_name || "Unknown User",
            avatar_url: profilesData?.find(p => p.id === replyMessage.author_id)?.avatar_url || null
          }
        } : undefined
      };
    });

    setMessages(messagesWithProfiles as any);
    
    // Clear replyingTo if the message no longer exists
    if (replyingTo && !messagesData.find(m => m.id === replyingTo.id)) {
      setReplyingTo(null);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    // Clear reply state if deleting the message being replied to
    if (replyingTo?.id === messageId) {
      setReplyingTo(null);
    }

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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;

    setUploadingImage(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-images")
      .upload(filePath, file);

    setUploadingImage(false);

    if (uploadError) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return null;
    }

    const { data } = supabase.storage
      .from("chat-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const message = messages.find(m => m.id === messageId);
    const existingReaction = message?.reactions?.find(r => 
      r.emoji === emoji && r.user_ids.includes(user.id)
    );

    if (existingReaction) {
      // Remove reaction
      await supabase
        .from("chat_message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("emoji", emoji);
    } else {
      // Add reaction
      await supabase
        .from("chat_message_reactions")
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji
        });
    }

    fetchMessages();
    setShowEmojiPicker(null);
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

    if (!newMessage.trim() && !imagePreview) {
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

    let imageUrl = null;
    if (imagePreview && fileInputRef.current?.files?.[0]) {
      imageUrl = await uploadImage(fileInputRef.current.files[0]);
      if (!imageUrl) return;
    }

    const { error } = await supabase
      .from("chat_messages")
      .insert({
        content: newMessage.trim() || "",
        author_id: user.id,
        channel_id: selectedChannel,
        is_private: false,
        image_url: imageUrl,
        reply_to: replyingTo?.id || null
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
      setImagePreview(null);
      setReplyingTo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const currentChannel = channels.find(c => c.id === selectedChannel);

  return (
    <div className="space-y-3 md:space-y-6">
      <PageHeader
        title={pageConfig?.title || "Community Chat"}
        description={pageConfig?.subtitle || "Connect with your neighbors and community"}
        logoUrl={pageConfig?.headerLogoUrl}
        actions={
          isAdmin ? (
            <Button 
              onClick={() => setShowChannelManager(!showChannelManager)} 
              className="shrink-0 w-full sm:w-auto"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Channels
            </Button>
          ) : undefined
        }
      />

      {showChannelManager && isAdmin && (
        <ChannelManager onClose={() => setShowChannelManager(false)} />
      )}

      <Card className="h-[calc(100dvh-18rem)] sm:h-[calc(100dvh-14rem)] md:h-[calc(100vh-16rem)] flex flex-col">
        <CardHeader className="border-b space-y-2 sm:space-y-3 flex-shrink-0 p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">
            {currentChannel?.name || "Select a Channel"}
            {currentChannel?.is_private && " 🔒"}
          </CardTitle>
          {currentChannel?.description && (
            <p className="text-sm sm:text-base text-muted-foreground">
              {currentChannel.description}
            </p>
          )}
          {channels.length > 1 && (
            <Tabs value={selectedChannel} onValueChange={setSelectedChannel} className="w-full">
              <ScrollArea className="w-full">
                <TabsList className="w-full h-auto inline-flex min-w-full gap-2 p-1">
                  {channels.map((channel) => (
                    <TabsTrigger 
                      key={channel.id} 
                      value={channel.id} 
                      className="text-sm sm:text-base px-3 sm:px-4 py-2 whitespace-nowrap min-h-[44px]"
                    >
                      {channel.name}
                      {channel.is_private && " 🔒"}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>
            </Tabs>
          )}
        </CardHeader>
        <CardContent className="p-0 flex flex-col flex-1 min-h-0">
          <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollRef}>
            <div className="space-y-3 sm:space-y-4">
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
                    className="flex gap-2 sm:gap-3 group hover:bg-muted/50 p-2 rounded transition-colors"
                  >
                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                      {message.profiles.avatar_url ? (
                        <AvatarImage src={message.profiles.avatar_url} alt={message.profiles.full_name} />
                      ) : null}
                      <AvatarFallback className="text-sm">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1 sm:gap-2">
                        <span className="font-semibold text-sm sm:text-base text-foreground">
                          {message.profiles.full_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.created_at), "h:mm a")}
                        </span>
                      </div>
                      
                      {message.reply_message && (
                        <div className="mt-1 pl-3 border-l-2 border-muted-foreground/30 text-sm text-muted-foreground">
                          <span className="font-medium">{message.reply_message.profiles?.full_name}</span>
                          <p className="truncate">{message.reply_message.content}</p>
                        </div>
                      )}
                      
                      {message.content && (
                        <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap mt-1">
                          {message.content}
                        </p>
                      )}
                      
                      {message.image_url && (
                        <img 
                          src={message.image_url} 
                          alt="Shared image"
                          className="mt-2 rounded-lg w-full max-w-xs sm:max-w-sm max-h-80 sm:max-h-96 object-cover"
                        />
                      )}
                      
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {message.reactions.map((reaction) => {
                            const userReacted = reaction.user_ids.includes(user?.id || "");
                            return (
                              <button
                                key={reaction.emoji}
                                onClick={() => handleReaction(message.id, reaction.emoji)}
                                className={`px-2 py-1 rounded-full text-sm transition-colors ${
                                  userReacted 
                                    ? "bg-primary/20 border border-primary" 
                                    : "bg-muted border border-border hover:bg-muted/80"
                                }`}
                              >
                                {reaction.emoji} {reaction.count}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 sm:h-8 sm:w-8"
                        onClick={() => setReplyingTo(message)}
                      >
                        <Reply className="h-4 w-4" />
                      </Button>
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 sm:h-8 sm:w-8"
                          onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                        >
                          <Smile className="h-4 w-4" />
                        </Button>
                        {showEmojiPicker === message.id && (
                          <div className="absolute right-0 top-10 bg-popover border rounded-lg p-2 shadow-lg z-10 flex gap-1">
                            {["👍", "❤️", "😂", "🎉", "🤔", "👏"].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(message.id, emoji)}
                                className="text-2xl hover:scale-125 transition-transform p-1"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {isOwnMessage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 sm:h-8 sm:w-8"
                          onClick={() => handleDeleteMessage(message.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          
          <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t space-y-2">
            {replyingTo && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                <Reply className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 text-sm">
                  <span className="font-medium">Replying to {replyingTo.profiles.full_name}</span>
                  <p className="text-muted-foreground truncate">{replyingTo.content}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setReplyingTo(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {imagePreview && (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="h-20 rounded-lg" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => {
                    setImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <input
                ref={documentInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={handleImageSelect}
              />
              <Popover open={showAttachMenu} onOpenChange={setShowAttachMenu}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-12 sm:h-11 sm:w-11"
                    disabled={uploadingImage}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowAttachMenu(false);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Photo
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        documentInputRef.current?.click();
                        setShowAttachMenu(false);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      File
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="text-base h-12 sm:h-11"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button 
                type="submit" 
                className="h-12 w-12 sm:h-11 sm:w-11"
                disabled={(!newMessage.trim() && !imagePreview) || uploadingImage}
              >
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
