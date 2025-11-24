import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, X, Minimize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import chickenIcon from "@/assets/chicken-assistant.jpeg";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function FloatingChatAssistant() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

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

  return (
    <>
      {isOpen && (
        <Card className="fixed bottom-16 sm:bottom-24 right-2 sm:right-4 w-[calc(100vw-1rem)] sm:w-96 max-w-[400px] h-[70vh] sm:h-[500px] flex flex-col shadow-lg z-50">
          <CardHeader className="flex flex-row items-center justify-between pb-3 px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Community Assistant</CardTitle>
            <div className="flex gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 sm:h-8 sm:w-8"
                onClick={() => setIsOpen(false)}
              >
                <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 sm:h-8 sm:w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 px-3 sm:px-4" ref={scrollRef}>
              <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-6 sm:py-8">
                    <p className="font-medium mb-2 text-sm sm:text-base">Aloha! 🌺</p>
                    <p className="text-xs sm:text-sm px-2">
                      Ask me about documents, announcements, community info, or anything else!
                    </p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t p-3 sm:p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the chicken..."
                  disabled={isLoading}
                  className="text-sm sm:text-base"
                />
                <Button type="submit" size="icon" disabled={isLoading} className="shrink-0">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-3 sm:bottom-4 right-3 sm:right-4 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg z-40 p-0 overflow-hidden opacity-90 hover:opacity-100 transition-opacity"
        size="icon"
      >
        <img
          src={chickenIcon}
          alt="Community Assistant"
          className="h-full w-full object-cover"
        />
      </Button>
    </>
  );
}
