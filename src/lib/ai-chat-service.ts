import OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import { buildCombinedContext, formatContextForPrompt } from "./context-builder";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatOptions {
  sessionId: string;
  userId: string;
  contextType?: "lesson" | "course" | "general";
  contextId?: string;
  maxHistory?: number;
}

export interface ChatResult {
  reply: string;
  messageId: string;
}

interface SaveMessageOptions {
  userId: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  contextType?: string;
  contextId?: string;
}

/**
 * Initializes OpenAI client
 */
function getOpenAIClient(): OpenAI {
  const apiKey = import.meta.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({
    apiKey,
  });
}

/**
 * Gets the configured model for chat
 */
function getChatModel(): string {
  return import.meta.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
}

/**
 * Gets the max tokens for chat responses
 */
function getMaxTokens(): number {
  const tokens = import.meta.env.OPENAI_CHAT_MAX_TOKENS;
  return tokens ? parseInt(tokens) : 1000;
}

/**
 * Builds the system prompt for the chatbot
 */
function buildSystemPrompt(contextText: string): string {
  return `Jesteś pomocnym asystentem edukacyjnym platformy LMS. Pomagasz uczniom w nauce, odpowiadasz na pytania o materiały kursu i dostosowujesz swoje odpowiedzi do postępów użytkownika.

${contextText}

ZASADY:
- Odpowiadaj zwięźle i konkretnie (maksymalnie 3-4 akapity)
- Używaj przykładów z materiałów kursu, jeśli są dostępne
- Jeśli użytkownik pyta o coś poza zakresem dostępnego materiału, poinformuj go o tym uprzejmie
- Zachęcaj ucznia do samodzielnego myślenia, zadawaj pytania naprowadzające
- Używaj polskiego języka
- Jeśli nie jesteś pewien odpowiedzi, powiedz o tym
- Możesz używać formatowania Markdown do lepszej czytelności (np. **pogrubienie**, listy, kod)
- Unikaj powtarzania całych fragmentów z materiałów - raczej wyjaśniaj swoimi słowami`;
}

/**
 * Retrieves chat history from database
 */
export async function getChatHistory(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  userId: string,
  maxMessages = 10
): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(maxMessages);

    if (error) {
      console.error("Error fetching chat history:", error);
      return [];
    }

    // Reverse to get chronological order (oldest first)
    return (data || [])
      .reverse()
      .map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      }))
      .filter((msg) => msg.role !== "system"); // Don't include system messages in history
  } catch (error) {
    console.error("Error in getChatHistory:", error);
    return [];
  }
}

/**
 * Saves a chat message to the database
 */
export async function saveChatMessage(
  supabase: SupabaseClient<Database>,
  options: SaveMessageOptions
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        user_id: options.userId,
        session_id: options.sessionId,
        role: options.role,
        content: options.content,
        context_type: options.contextType || null,
        context_id: options.contextId || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error saving chat message:", error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error("Error in saveChatMessage:", error);
    return null;
  }
}

/**
 * Sends a message to the AI chatbot and gets a response
 */
export async function sendMessage(
  supabase: SupabaseClient<Database>,
  userMessage: string,
  options: ChatOptions
): Promise<ChatResult> {
  const { sessionId, userId, contextType, contextId, maxHistory = 10 } = options;

  // Validate message
  if (!userMessage || userMessage.trim().length === 0) {
    throw new Error("Wiadomość nie może być pusta");
  }

  if (userMessage.length > 2000) {
    throw new Error("Wiadomość jest zbyt długa (maksymalnie 2000 znaków)");
  }

  try {
    // Build context based on contextType and contextId
    let contextText = "";
    if (contextType && contextId) {
      const contextOptions: any = {
        includeUserProgress: true,
      };

      if (contextType === "lesson") {
        contextOptions.lessonId = contextId;
      } else if (contextType === "course") {
        contextOptions.courseId = contextId;
      }

      const context = await buildCombinedContext(supabase, userId, contextOptions);
      contextText = formatContextForPrompt(context);
    } else {
      // General context - just user progress
      const context = await buildCombinedContext(supabase, userId, {
        includeUserProgress: true,
      });
      contextText = formatContextForPrompt(context);
    }

    // Get chat history
    const history = await getChatHistory(supabase, sessionId, userId, maxHistory);

    // Build messages array for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: buildSystemPrompt(contextText),
      },
      ...history.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      {
        role: "user",
        content: userMessage,
      },
    ];

    // Save user message to database
    await saveChatMessage(supabase, {
      userId,
      sessionId,
      role: "user",
      content: userMessage,
      contextType,
      contextId,
    });

    // Call OpenAI API
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: getChatModel(),
      messages,
      max_tokens: getMaxTokens(),
      temperature: 0.7,
      top_p: 0.9,
    });

    // Extract assistant's response
    const assistantReply = completion.choices[0]?.message?.content;

    if (!assistantReply) {
      throw new Error("Nie otrzymano odpowiedzi od AI");
    }

    // Save assistant's response to database
    const messageId = await saveChatMessage(supabase, {
      userId,
      sessionId,
      role: "assistant",
      content: assistantReply,
      contextType,
      contextId,
    });

    return {
      reply: assistantReply,
      messageId: messageId || "",
    };
  } catch (error) {
    console.error("Error in sendMessage:", error);

    if (error instanceof Error) {
      // Handle specific OpenAI errors
      if (error.message.includes("API key")) {
        throw new Error("Błąd konfiguracji API. Skontaktuj się z administratorem.");
      }
      if (error.message.includes("rate_limit")) {
        throw new Error("Przekroczono limit zapytań API. Spróbuj ponownie za chwilę.");
      }
      throw error;
    }

    throw new Error("Wystąpił błąd podczas komunikacji z AI. Spróbuj ponownie.");
  }
}

/**
 * Clears chat history for a session
 */
export async function clearChatHistory(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from("chat_messages").delete().eq("user_id", userId).eq("session_id", sessionId);

    if (error) {
      console.error("Error clearing chat history:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in clearChatHistory:", error);
    return false;
  }
}

/**
 * Gets the count of messages in a session
 */
export async function getChatMessageCount(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  userId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("session_id", sessionId);

    if (error) {
      console.error("Error getting message count:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error in getChatMessageCount:", error);
    return 0;
  }
}
