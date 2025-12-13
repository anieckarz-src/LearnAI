import type { APIRoute } from "astro";
import type { ReportFilters } from "@/types";

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
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const status = url.searchParams.get("status") as ReportFilters["status"];
    const contentType = url.searchParams.get("content_type") as ReportFilters["content_type"];

    const offset = (page - 1) * limit;

    let query = supabase.from("content_reports").select(
      `
        *,
        reporter:users!content_reports_reported_by_fkey(id, email, full_name),
        reviewer:users!content_reports_reviewed_by_fkey(id, email, full_name)
      `,
      { count: "exact" }
    );

    if (status) {
      query = query.eq("status", status);
    }

    if (contentType) {
      query = query.eq("content_type", contentType);
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data: reports, error, count } = await query;

    if (error) {
      throw error;
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          data: reports || [],
          total: count || 0,
          page,
          limit,
          total_pages: totalPages,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching reports:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch reports" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
