import type { APIRoute } from "astro";

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const { supabase, session } = locals;
    if (!session?.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (userData?.role !== "admin") {
      return new Response(JSON.stringify({ success: false, error: "Forbidden - Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { lesson_ids } = body;

    if (!lesson_ids || !Array.isArray(lesson_ids) || lesson_ids.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "lesson_ids array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete all lessons in the array
    const { error: deleteError, count } = await supabase
      .from("lessons")
      .delete()
      .in("id", lesson_ids);

    if (deleteError) {
      return new Response(JSON.stringify({ success: false, error: "Failed to delete lessons" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        deleted_count: count || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error bulk deleting lessons:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
