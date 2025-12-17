-- AI Features: Chat Messages and Rate Limiting
-- Migration 016

-- Create ENUM for chat message roles
CREATE TYPE chat_message_role AS ENUM ('user', 'assistant', 'system');

-- Chat messages table - stores conversation history
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role chat_message_role NOT NULL,
  content TEXT NOT NULL,
  context_type TEXT,
  context_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chat_messages_content_check CHECK (char_length(content) <= 10000),
  CONSTRAINT chat_messages_session_id_check CHECK (char_length(session_id) >= 10)
);

-- API rate limits table - tracks API usage per user
CREATE TABLE public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT api_rate_limits_endpoint_check CHECK (endpoint IN ('chat', 'quiz_generation')),
  CONSTRAINT api_rate_limits_count_check CHECK (request_count >= 0),
  UNIQUE(user_id, endpoint, window_start)
);

-- Create indexes for better query performance
CREATE INDEX idx_chat_messages_user_session ON public.chat_messages(user_id, session_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_context ON public.chat_messages(context_type, context_id) WHERE context_type IS NOT NULL;
CREATE INDEX idx_rate_limits_lookup ON public.api_rate_limits(user_id, endpoint, window_start);
CREATE INDEX idx_rate_limits_window ON public.api_rate_limits(window_start);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
-- Users can view their own chat messages
CREATE POLICY "Users can view own chat messages"
  ON public.chat_messages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own chat messages
CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own chat messages
CREATE POLICY "Users can delete own chat messages"
  ON public.chat_messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all chat messages
CREATE POLICY "Admins can view all chat messages"
  ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for api_rate_limits
-- Users can view their own rate limits
CREATE POLICY "Users can view own rate limits"
  ON public.api_rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all rate limits (for API)
-- Note: This is handled by service role key, not RLS

-- Admins can view all rate limits
CREATE POLICY "Admins can view all rate limits"
  ON public.api_rate_limits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to clean up old chat messages (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_chat_messages()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.chat_messages
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Function to clean up old rate limit records (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.api_rate_limits
  WHERE window_start < NOW() - INTERVAL '7 days';
END;
$$;

-- Function to atomically increment rate limit counter
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_window_start TIMESTAMP WITH TIME ZONE
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.api_rate_limits (user_id, endpoint, request_count, window_start)
  VALUES (p_user_id, p_endpoint, 1, p_window_start)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET
    request_count = api_rate_limits.request_count + 1,
    updated_at = NOW();
END;
$$;

-- Add comments for documentation
COMMENT ON TABLE public.chat_messages IS 'Stores AI chatbot conversation history';
COMMENT ON TABLE public.api_rate_limits IS 'Tracks API usage for rate limiting';
COMMENT ON COLUMN public.chat_messages.session_id IS 'UUID stored in localStorage to maintain session';
COMMENT ON COLUMN public.chat_messages.context_type IS 'Type of context: lesson, course, or general';
COMMENT ON COLUMN public.chat_messages.context_id IS 'ID of the lesson or course if applicable';
COMMENT ON COLUMN public.api_rate_limits.window_start IS 'Start of the rate limit window (typically start of day)';
