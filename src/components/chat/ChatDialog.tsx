import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { MessageBubble } from "./MessageBubble";
import { Send, Loader2, Trash2, AlertCircle, Info } from "lucide-react";
import type { ChatHistoryMessage } from "@/types";

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  contextType?: "lesson" | "course" | "general";
  contextId?: string;
  contextTitle?: string;
}

export function ChatDialog({
  open,
  onOpenChange,
  sessionId,
  contextType = "general",
  contextId,
  contextTitle,
}: ChatDialogProps) {
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remaining: number; limit: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history when dialog opens
  useEffect(() => {
    if (open) {
      loadChatHistory();
      textareaRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sessionId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat?sessionId=${sessionId}&limit=50`);
      const result = await response.json();

      if (result.success && result.data) {
        setMessages(
          result.data.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            created_at: msg.created_at,
          }))
        );
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setError(null);

    // Add user message to UI immediately
    const newMessages = [
      ...messages,
      { role: "user" as const, content: userMessage, created_at: new Date().toISOString() },
    ];
    setMessages(newMessages);

    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
          contextType,
          contextId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        if (response.status === 429) {
          // Rate limit exceeded
          setError(`Przekroczono limit wiadomości (${result.limit}/dzień). Spróbuj ponownie jutro.`);
        } else {
          setError(result.error || "Wystąpił błąd podczas wysyłania wiadomości");
        }
        // Remove the user message that failed
        setMessages(messages);
        return;
      }

      // Add assistant response to messages
      setMessages([
        ...newMessages,
        {
          role: "assistant" as const,
          content: result.data.reply,
          created_at: new Date().toISOString(),
        },
      ]);

      // Update rate limit info
      if (result.data.rateLimitRemaining !== undefined) {
        setRateLimitInfo({
          remaining: result.data.rateLimitRemaining,
          limit: 50, // Default limit for users
        });
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Wystąpił błąd podczas komunikacji z serwerem");
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm("Czy na pewno chcesz wyczyścić historię rozmowy?")) return;

    try {
      const response = await fetch("/api/chat", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      const result = await response.json();

      if (result.success) {
        setMessages([]);
        setError(null);
      } else {
        setError("Nie udało się wyczyścić historii");
      }
    } catch (err) {
      console.error("Error clearing history:", err);
      setError("Wystąpił błąd podczas czyszczenia historii");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getContextLabel = () => {
    if (!contextType || contextType === "general") return "Czat ogólny";
    if (contextType === "lesson") return `Lekcja: ${contextTitle || ""}`;
    if (contextType === "course") return `Kurs: ${contextTitle || ""}`;
    return "Czat";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-white/10 max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-white text-xl">AI Asystent</DialogTitle>
              <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                <Info className="w-4 h-4" />
                {getContextLabel()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              disabled={messages.length === 0}
              className="text-gray-400 hover:text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Wyczyść
            </Button>
          </div>
          {rateLimitInfo && (
            <div className="mt-2 text-xs text-gray-500">Pozostało wiadomości dzisiaj: {rateLimitInfo.remaining}</div>
          )}
        </DialogHeader>

        {/* Messages area */}
        <div className="flex-1 overflow-hidden px-6">
          <ScrollArea className="h-full pr-4">
            <div ref={scrollRef} className="space-y-4 py-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center mb-4">
                    <Info className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Witaj! Jestem Twoim asystentem AI</h3>
                  <p className="text-gray-400 max-w-md">
                    Mogę pomóc Ci zrozumieć materiały, odpowiedzieć na pytania i wyjaśnić trudne koncepcje. Po prostu
                    zapytaj!
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <MessageBubble
                  key={index}
                  role={message.role}
                  content={message.content}
                  timestamp={message.created_at ? new Date(message.created_at) : undefined}
                />
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-slate-700 rounded-2xl rounded-tl-sm px-4 py-2">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mb-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Input area */}
        <div className="px-6 pb-6 pt-4 border-t border-white/10">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Wpisz swoją wiadomość... (Enter = wyślij, Shift+Enter = nowa linia)"
              className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-500 resize-none min-h-[60px] max-h-[120px]"
              disabled={loading}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 h-[60px] px-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Możesz używać Markdown: **pogrubienie**, *kursywa*, `kod`, ```blok kodu```
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
