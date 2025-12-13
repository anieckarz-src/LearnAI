import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });

  // Get session from cookies
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  // Get current user
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Make supabase and user available in locals
  context.locals.supabase = supabase;
  context.locals.session = session;
  context.locals.user = null;

  // If user is authenticated, get their profile
  if (session?.user) {
    const { data: userProfile } = await supabase.from("users").select("*").eq("id", session.user.id).single();

    if (userProfile) {
      context.locals.user = userProfile;

      // Update last_login
      await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", session.user.id);
    }
  }

  // Protected routes check
  const pathname = context.url.pathname;

  // Admin routes protection
  if (pathname.startsWith("/admin")) {
    // Require authentication
    if (!session?.user) {
      return context.redirect("/login?redirect=" + encodeURIComponent(pathname));
    }

    // Require admin role
    if (!context.locals.user || context.locals.user.role !== "admin") {
      return context.redirect("/unauthorized");
    }

    // Check if user is blocked
    if (context.locals.user.is_blocked) {
      await supabase.auth.signOut();
      return context.redirect("/login?error=blocked");
    }
  }

  // API admin routes protection
  if (pathname.startsWith("/api/admin")) {
    if (!session?.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!context.locals.user || context.locals.user.role !== "admin") {
      return new Response(JSON.stringify({ success: false, error: "Forbidden - Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (context.locals.user.is_blocked) {
      return new Response(JSON.stringify({ success: false, error: "Account blocked" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return next();
});
