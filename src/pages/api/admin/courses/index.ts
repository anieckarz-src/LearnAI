import type { APIRoute } from "astro";
import type { CourseFilters } from "@/types";

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
    const status = url.searchParams.get("status") as CourseFilters["status"];
    const search = url.searchParams.get("search") || "";

    const offset = (page - 1) * limit;

    let query = supabase
      .from("courses")
      .select("*, instructor:users!courses_instructor_id_fkey(id, email, full_name)", { count: "exact" });

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data: courses, error, count } = await query;

    if (error) {
      throw error;
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          data: courses || [],
          total: count || 0,
          page,
          limit,
          total_pages: totalPages,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching courses:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch courses" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { title, description, instructor_id, thumbnail_url } = body;

    if (!title || !instructor_id) {
      return new Response(JSON.stringify({ success: false, error: "Title and instructor_id are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: course, error } = await supabase
      .from("courses")
      .insert({
        title,
        description,
        instructor_id,
        thumbnail_url,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the action
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "create_course",
      entity_type: "course",
      entity_id: course.id,
      new_values: course,
    });

    return new Response(JSON.stringify({ success: true, data: course }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating course:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to create course" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
