import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className={isUser ? "bg-blue-600" : "bg-purple-600"}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-2 ${
            isUser ? "bg-blue-600 text-white rounded-tr-sm" : "bg-slate-700 text-white rounded-tl-sm"
          }`}
        >
          <div className="prose prose-invert prose-sm max-w-none">
            <MessageContent content={content} />
          </div>
        </div>
        {timestamp && (
          <span className="text-xs text-gray-500 px-2">
            {formatDistanceToNow(timestamp, { addSuffix: true, locale: pl })}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Renders message content with basic Markdown support
 */
function MessageContent({ content }: { content: string }) {
  // Split by code blocks first
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{formatInlineMarkdown(content.slice(lastIndex, match.index))}</span>);
    }

    // Add code block
    const language = match[1] || "";
    const code = match[2].trim();
    parts.push(
      <pre key={`code-${match.index}`} className="bg-slate-900 p-3 rounded-lg overflow-x-auto my-2">
        <code className={`language-${language} text-sm`}>{code}</code>
      </pre>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(<span key={`text-${lastIndex}`}>{formatInlineMarkdown(content.slice(lastIndex))}</span>);
  }

  return <>{parts}</>;
}

/**
 * Formats inline Markdown elements
 */
function formatInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const lines = text.split("\n");

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      parts.push(<br key={`br-${lineIndex}`} />);
    }

    // Handle list items
    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      parts.push(
        <span key={`line-${lineIndex}`} className="block ml-4">
          • {processInlineFormatting(line.replace(/^[-•]\s*/, ""))}
        </span>
      );
      return;
    }

    // Handle numbered lists
    const numberedMatch = line.match(/^\d+\.\s/);
    if (numberedMatch) {
      parts.push(
        <span key={`line-${lineIndex}`} className="block ml-4">
          {processInlineFormatting(line)}
        </span>
      );
      return;
    }

    // Regular text
    parts.push(<span key={`line-${lineIndex}`}>{processInlineFormatting(line)}</span>);
  });

  return parts;
}

/**
 * Processes inline formatting (bold, italic, inline code)
 */
function processInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;

  // Pattern for bold (**text**), inline code (`text`), and italic (*text* or _text_)
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before match
    if (match.index > currentIndex) {
      parts.push(text.slice(currentIndex, match.index));
    }

    const matched = match[0];
    if (matched.startsWith("**") && matched.endsWith("**")) {
      // Bold
      parts.push(<strong key={`bold-${match.index}`}>{matched.slice(2, -2)}</strong>);
    } else if (matched.startsWith("`") && matched.endsWith("`")) {
      // Inline code
      parts.push(
        <code key={`code-${match.index}`} className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">
          {matched.slice(1, -1)}
        </code>
      );
    } else if (
      (matched.startsWith("*") || matched.startsWith("_")) &&
      (matched.endsWith("*") || matched.endsWith("_"))
    ) {
      // Italic
      parts.push(<em key={`italic-${match.index}`}>{matched.slice(1, -1)}</em>);
    }

    currentIndex = match.index + matched.length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(text.slice(currentIndex));
  }

  return parts.length > 0 ? parts : [text];
}
