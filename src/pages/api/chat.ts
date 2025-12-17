import type { APIRoute } from "astro";
import { sendMessage, getChatHistory, clearChatHistory } from "@/lib/ai-chat-service";
import { checkRateLimit, incrementRateLimit } from "@/lib/rate-limiter";

/**
 * POST /api/chat - Send a message to the chatbot
 */
export const POST: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  // Check authentication
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { message, sessionId, contextType, contextId } = body;

    // Validate input
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!sessionId || typeof sessionId !== "string") {
      return new Response(JSON.stringify({ success: false, error: "Session ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (message.length > 2000) {
      return new Response(JSON.stringify({ success: false, error: "Message too long (max 2000 characters)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate contextType if provided
    if (contextType && !["lesson", "course", "general"].includes(contextType)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid context type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check rate limit
    const isAdmin = user.role === "admin";
    const rateLimitCheck = await checkRateLimit(supabase, user.id, "chat", isAdmin);

    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Rate limit exceeded",
          resetAt: rateLimitCheck.resetAt.toISOString(),
          limit: rateLimitCheck.limit,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Increment rate limit
    await incrementRateLimit(supabase, user.id, "chat", isAdmin);

    // Send message to chatbot
    const result = await sendMessage(supabase, message, {
      sessionId,
      userId: user.id,
      contextType: contextType as "lesson" | "course" | "general" | undefined,
      contextId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          reply: result.reply,
          messageId: result.messageId,
          rateLimitRemaining: rateLimitCheck.remaining - 1,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in chat API:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process chat message";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * GET /api/chat - Get chat history
 */
export const GET: APIRoute = async ({ locals, url }) => {
  const { supabase, user } = locals;

  // Check authentication
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const sessionId = url.searchParams.get("sessionId");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    if (!sessionId) {
      return new Response(JSON.stringify({ success: false, error: "Session ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get chat history
    const history = await getChatHistory(supabase, sessionId, user.id, limit);

    return new Response(
      JSON.stringify({
        success: true,
        data: history,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch chat history" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/chat - Clear chat history for a session
 */
export const DELETE: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  // Check authentication
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return new Response(JSON.stringify({ success: false, error: "Session ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Clear chat history
    const success = await clearChatHistory(supabase, sessionId, user.id);

    if (!success) {
      return new Response(JSON.stringify({ success: false, error: "Failed to clear chat history" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Chat history cleared",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error clearing chat history:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to clear chat history" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
