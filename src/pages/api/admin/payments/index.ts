import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals, url }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const status = url.searchParams.get("status");
    const userId = url.searchParams.get("user_id");
    const courseId = url.searchParams.get("course_id");

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("payments")
      .select(
        `
        *,
        user:users!payments_user_id_fkey(id, email, full_name),
        course:courses!payments_course_id_fkey(id, title)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    const { data: payments, error, count } = await query;

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          data: payments,
          total: count || 0,
          page,
          limit,
          total_pages: Math.ceil((count || 0) / limit),
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching payments:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch payments" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
