import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TypingIndicator } from "@/components/TypingIndicator";
import { useNavigate } from "react-router-dom";
import chickenIcon from "@/assets/chicken-assistant.jpeg";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Assistant = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoadingHistory]);

  const loadChatHistory = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from("community_assistant_messages")
        .select("*")
        .eq("user_id", user.id)
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

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from("community_assistant_messages")
        .insert({
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
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    await saveMessage("user", userMessage.content);

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

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

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
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (assistantContent) {
        await saveMessage("assistant", assistantContent);
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

  const clearHistory = async () => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from("community_assistant_messages")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setMessages([]);
      toast({
        title: "Success",
        description: "Chat history cleared",
      });
    } catch (error: any) {
      console.error("Error clearing history:", error);
      toast({
        title: "Error",
        description: "Failed to clear history",
        variant: "destructive",
      });
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="h-[calc(100vh-8rem)] flex flex-col">
      <CardHeader className="border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={chickenIcon}
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
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearHistory}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear History
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 py-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl font-medium mb-3">Aloha! 🌺</p>
                <p className="text-base text-muted-foreground max-w-md mx-auto">
                  I'm your community assistant. Ask me about documents, announcements,
                  emergency contacts, photos, or anything else about Poipu Shores!
                </p>
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
  );
};

export default Assistant;
