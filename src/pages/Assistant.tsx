import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TypingIndicator } from "@/components/TypingIndicator";
import { useNavigate } from "react-router-dom";
import { usePageConfig } from "@/hooks/use-page-config";
import { ConversationSidebar } from "@/components/assistant/ConversationSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import defaultChickenIcon from "@/assets/chicken-assistant.jpeg";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const DISPLAY_THRESHOLD = 50;

const Assistant = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pageConfig } = usePageConfig();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [chickenIcon, setChickenIcon] = useState<string>(defaultChickenIcon);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChickenLogo();
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadChatHistory(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const loadChatHistory = async (conversationId: string) => {
    setIsLoadingHistory(true);
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from("community_assistant_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data) {
        setMessages(
          data.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }))
        );
      }
    } catch (error: any) {
      console.error("Error loading chat history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchChickenLogo = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("setting_value")
      .eq("setting_key", "chicken_assistant_logo")
      .single();

    if (data?.setting_value) {
      setChickenIcon(data.setting_value as string);
    }
  };

  const createConversation = async (firstMessage: string): Promise<string | null> => {
    try {
      if (!user) return null;

      const title = firstMessage.length > 50 
        ? firstMessage.substring(0, 47) + "..." 
        : firstMessage;

      const { data, error } = await supabase
        .from("community_assistant_conversations")
        .insert({
          user_id: user.id,
          title,
        })
        .select()
        .single();

      if (error) throw error;

      return data.id;
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      return null;
    }
  };

  const saveMessage = async (
    conversationId: string,
    role: "user" | "assistant",
    content: string
  ) => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from("community_assistant_messages")
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          role,
          content,
        });

      if (error) throw error;
    } catch (error: any) {
      console.error("Error saving message:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setInput("");
    setIsLoading(true);

    // Create new conversation if needed
    let conversationId = activeConversationId;
    if (!conversationId) {
      conversationId = await createConversation(userMessage.content);
      if (!conversationId) {
        toast({
          title: "Error",
          description: "Failed to create conversation",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      setActiveConversationId(conversationId);
    }

    setMessages((prev) => [...prev, userMessage]);
    await saveMessage(conversationId, "user", userMessage.content);

    try {
      const { data, error } = await supabase.functions.invoke("community-assistant", {
        body: {
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      if (error) throw error;

      if (!data.body) throw new Error("No response body");

      const reader = data.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";
      let messageRevealed = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;

        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;

              if (!messageRevealed && assistantContent.length >= DISPLAY_THRESHOLD) {
                messageRevealed = true;
                setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);
              } else if (messageRevealed) {
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return newMessages;
                });
              }
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (!messageRevealed && assistantContent) {
        setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);
      }

      if (assistantContent) {
        await saveMessage(conversationId, "assistant", assistantContent);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setIsSidebarOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setIsSidebarOpen(false);
  };

  const sidebarContent = (
    <ConversationSidebar
      activeConversationId={activeConversationId}
      onSelectConversation={handleSelectConversation}
      onNewChat={handleNewChat}
    />
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-80 flex-shrink-0">
          {sidebarContent}
        </div>
      )}

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col min-w-0">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-80">
                    {sidebarContent}
                  </SheetContent>
                </Sheet>
              )}
              <img
                src={pageConfig?.headerLogoUrl || chickenIcon}
                alt="Community Assistant"
                className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
              />
              <div>
                <CardTitle className="text-2xl">Ask the Chicken</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Your AI assistant for documents, announcements, emergency info, and more!
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4 py-6">
              {messages.length === 0 && !isLoadingHistory && (
                <div className="text-center py-12">
                  <p className="text-xl font-medium mb-3">Aloha! 🌺</p>
                  <p className="text-base text-muted-foreground max-w-md mx-auto">
                    I'm your community assistant. Ask me about documents, announcements,
                    emergency contacts, photos, or anything else about Poipu Shores!
                  </p>
                </div>
              )}
              {isLoadingHistory && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-base whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-6 flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-3"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="text-base h-12"
              />
              <Button type="submit" size="lg" disabled={isLoading} className="h-12 px-6">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Assistant;
