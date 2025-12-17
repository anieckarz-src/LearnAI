import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatDialog } from "./ChatDialog";
import { MessageCircle, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface ChatWidgetProps {
  contextType?: "lesson" | "course" | "general";
  contextId?: string;
  contextTitle?: string;
}

const SESSION_STORAGE_KEY = "ai_chat_session_id";

export function ChatWidget({ contextType = "general", contextId, contextTitle }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize session ID from localStorage or create new one
  useEffect(() => {
    const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = uuidv4();
      localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  // Reset unread count when dialog is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  if (!sessionId) {
    return null; // Don't render until session ID is ready
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-lg transition-all duration-200 ${
            isOpen
              ? "bg-slate-700 hover:bg-slate-600"
              : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          }`}
          aria-label={isOpen ? "Zamknij czat" : "Otwórz czat"}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <>
              <MessageCircle className="w-6 h-6 text-white" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </>
          )}
        </Button>

        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            Zapytaj AI Asystenta
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
          </div>
        )}
      </div>

      {/* Chat dialog */}
      <ChatDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        sessionId={sessionId}
        contextType={contextType}
        contextId={contextId}
        contextTitle={contextTitle}
      />
    </>
  );
}
