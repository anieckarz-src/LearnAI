import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

export type RateLimitEndpoint = "chat" | "quiz_generation";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  current: number;
  limit: number;
}

interface RateLimitConfig {
  limit: number; // Max requests per window
  windowMinutes: number; // Window size in minutes (typically 1440 for 24h)
}

// Rate limit configurations
const RATE_LIMITS: Record<RateLimitEndpoint, RateLimitConfig> = {
  chat: {
    limit: 50,
    windowMinutes: 1440, // 24 hours
  },
  quiz_generation: {
    limit: 10,
    windowMinutes: 1440, // 24 hours
  },
};

/**
 * Checks if a user has exceeded their rate limit for an endpoint
 */
export async function checkRateLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
  endpoint: RateLimitEndpoint,
  isAdmin = false
): Promise<RateLimitResult> {
  // Admins have unlimited access
  if (isAdmin) {
    return {
      allowed: true,
      remaining: Infinity,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      current: 0,
      limit: Infinity,
    };
  }

  const config = RATE_LIMITS[endpoint];
  const windowStart = getWindowStart(config.windowMinutes);

  // Get or create rate limit record
  const { data, error } = await supabase
    .from("api_rate_limits")
    .select("*")
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .eq("window_start", windowStart.toISOString())
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned"
    console.error("Error checking rate limit:", error);
    // In case of error, allow the request but log it
    return {
      allowed: true,
      remaining: config.limit,
      resetAt: getWindowEnd(windowStart, config.windowMinutes),
      current: 0,
      limit: config.limit,
    };
  }

  const currentCount = data?.request_count || 0;
  const allowed = currentCount < config.limit;
  const remaining = Math.max(0, config.limit - currentCount);

  return {
    allowed,
    remaining,
    resetAt: getWindowEnd(windowStart, config.windowMinutes),
    current: currentCount,
    limit: config.limit,
  };
}

/**
 * Increments the rate limit counter for a user
 */
export async function incrementRateLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
  endpoint: RateLimitEndpoint,
  isAdmin = false
): Promise<void> {
  // Don't track for admins
  if (isAdmin) {
    return;
  }

  const config = RATE_LIMITS[endpoint];
  const windowStart = getWindowStart(config.windowMinutes);

  // Use upsert to increment or create
  const { error } = await supabase.rpc("increment_rate_limit", {
    p_user_id: userId,
    p_endpoint: endpoint,
    p_window_start: windowStart.toISOString(),
  });

  // If the RPC doesn't exist, fall back to manual upsert
  if (error?.code === "42883") {
    // Function doesn't exist
    await manualIncrementRateLimit(supabase, userId, endpoint, windowStart);
  } else if (error) {
    console.error("Error incrementing rate limit:", error);
  }
}

/**
 * Manual increment when RPC function is not available
 */
async function manualIncrementRateLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
  endpoint: RateLimitEndpoint,
  windowStart: Date
): Promise<void> {
  // Try to get existing record
  const { data: existing } = await supabase
    .from("api_rate_limits")
    .select("*")
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .eq("window_start", windowStart.toISOString())
    .maybeSingle();

  if (existing) {
    // Update existing record
    await supabase
      .from("api_rate_limits")
      .update({
        request_count: existing.request_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    // Insert new record
    await supabase.from("api_rate_limits").insert({
      user_id: userId,
      endpoint,
      request_count: 1,
      window_start: windowStart.toISOString(),
    });
  }
}

/**
 * Gets the start of the current rate limit window
 */
function getWindowStart(windowMinutes: number): Date {
  const now = new Date();
  if (windowMinutes >= 1440) {
    // Daily window - start at midnight UTC
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  } else if (windowMinutes >= 60) {
    // Hourly window - start at top of hour
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours()));
  } else {
    // Minute-based window
    const minutes = Math.floor(now.getUTCMinutes() / windowMinutes) * windowMinutes;
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), minutes));
  }
}

/**
 * Gets the end of the current rate limit window
 */
function getWindowEnd(windowStart: Date, windowMinutes: number): Date {
  return new Date(windowStart.getTime() + windowMinutes * 60 * 1000);
}

/**
 * Cleans up old rate limit records (older than 7 days)
 * This should be called periodically, e.g., via a cron job
 */
export async function cleanupOldRateLimits(supabase: SupabaseClient<Database>): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const { error } = await supabase.from("api_rate_limits").delete().lt("window_start", sevenDaysAgo.toISOString());

  if (error) {
    console.error("Error cleaning up old rate limits:", error);
  }
}

/**
 * Gets current rate limit status for a user across all endpoints
 */
export async function getRateLimitStatus(
  supabase: SupabaseClient<Database>,
  userId: string,
  isAdmin = false
): Promise<Record<RateLimitEndpoint, RateLimitResult>> {
  const endpoints: RateLimitEndpoint[] = ["chat", "quiz_generation"];
  const results: Record<string, RateLimitResult> = {};

  for (const endpoint of endpoints) {
    results[endpoint] = await checkRateLimit(supabase, userId, endpoint, isAdmin);
  }

  return results as Record<RateLimitEndpoint, RateLimitResult>;
}
