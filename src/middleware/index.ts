import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Helper function to check course access
export async function checkCourseAccess(
  supabase: ReturnType<typeof createClient<Database>>,
  userId: string,
  courseId: string
): Promise<boolean> {
  // Get course details
  const { data: course } = await supabase.from("courses").select("price").eq("id", courseId).single();

  if (!course) {
    return false;
  }

  // Free courses are accessible to everyone
  if (!course.price || course.price <= 0) {
    return true;
  }

  // Check if user has enrollment (via payment or admin grant)
  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .single();

  return !!enrollment;
}

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

  // Define public routes (accessible without authentication)
  const publicRoutes = ["/", "/login", "/register", "/unauthorized", "/reset-password", "/courses"];
  const publicApiRoutes = ["/api/auth/signin", "/api/auth/signout", "/api/auth/signup", "/api/courses"];

  const isPublicRoute = publicRoutes.includes(pathname) || publicRoutes.some((route) => pathname.startsWith(route));
  const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route));

  // Admin routes protection (admin + instructor)
  if (pathname.startsWith("/admin")) {
    // Require authentication
    if (!session?.user) {
      return context.redirect("/login?redirect=" + encodeURIComponent(pathname));
    }

    // Require admin or instructor role
    if (!context.locals.user || !["admin", "instructor"].includes(context.locals.user.role)) {
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

    const userRole = context.locals.user?.role;

    // Instructor restrictions
    if (userRole === "instructor") {
      // Block access to user management and settings
      if (pathname.startsWith("/api/admin/users") || pathname.startsWith("/api/admin/settings")) {
        return new Response(JSON.stringify({ success: false, error: "Forbidden - Admin access required" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else if (userRole !== "admin") {
      // Not admin or instructor
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

  // Quiz routes protection (user access)
  if (pathname.startsWith("/quizzes/") && !pathname.includes("/api/")) {
    // Require authentication for all quiz pages
    if (!session?.user) {
      return context.redirect("/login?redirect=" + encodeURIComponent(pathname));
    }

    // Check if user is blocked
    if (context.locals.user && context.locals.user.is_blocked) {
      await supabase.auth.signOut();
      return context.redirect("/login?error=blocked");
    }
  }

  // API quiz routes protection
  if (pathname.startsWith("/api/quizzes/")) {
    if (!session?.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (context.locals.user && context.locals.user.is_blocked) {
      return new Response(JSON.stringify({ success: false, error: "Account blocked" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Course lesson routes protection (user access)
  // Allow public access to course catalog and course details, but require auth for lessons
  if (pathname.match(/^\/courses\/[^\/]+\/lessons\//)) {
    // Require authentication for lesson pages
    if (!session?.user) {
      return context.redirect("/login?redirect=" + encodeURIComponent(pathname));
    }

    // Check if user is blocked
    if (context.locals.user && context.locals.user.is_blocked) {
      await supabase.auth.signOut();
      return context.redirect("/login?error=blocked");
    }
  }

  // Dashboard protection (user access)
  if (pathname.startsWith("/dashboard")) {
    // Require authentication
    if (!session?.user) {
      return context.redirect("/login?redirect=" + encodeURIComponent(pathname));
    }

    // Check if user is blocked
    if (context.locals.user && context.locals.user.is_blocked) {
      await supabase.auth.signOut();
      return context.redirect("/login?error=blocked");
    }
  }

  // API user routes protection
  if (pathname.startsWith("/api/user/")) {
    if (!session?.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (context.locals.user && context.locals.user.is_blocked) {
      return new Response(JSON.stringify({ success: false, error: "Account blocked" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // API courses routes protection
  // Allow public GET requests to list courses and get course details
  // Require auth for POST (enroll) and other operations
  if (pathname.startsWith("/api/courses/")) {
    const isGetRequest = context.request.method === "GET";
    const isEnrollEndpoint = pathname.includes("/enroll");

    // Public endpoints: GET /api/courses and GET /api/courses/[id]
    const isPublicEndpoint = isGetRequest && !isEnrollEndpoint;

    if (!isPublicEndpoint) {
      if (!session?.user) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (context.locals.user && context.locals.user.is_blocked) {
        return new Response(JSON.stringify({ success: false, error: "Account blocked" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }

  return next();
});
