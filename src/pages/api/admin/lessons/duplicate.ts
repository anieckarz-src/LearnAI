import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }) => {
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
    const { lesson_id, target_module_id } = body;

    if (!lesson_id) {
      return new Response(JSON.stringify({ success: false, error: "lesson_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the original lesson
    const { data: originalLesson, error: fetchError } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lesson_id)
      .single();

    if (fetchError || !originalLesson) {
      return new Response(JSON.stringify({ success: false, error: "Lesson not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Determine target module (same module if not specified)
    const finalModuleId = target_module_id || originalLesson.module_id;

    // Get the highest order_index for the target module
    const { data: maxOrderData } = await supabase
      .from("lessons")
      .select("order_index")
      .eq("module_id", finalModuleId)
      .order("order_index", { ascending: false })
      .limit(1)
      .single();

    const newOrderIndex = (maxOrderData?.order_index ?? -1) + 1;

    // Create new lesson with "(kopia)" suffix
    const { data: newLesson, error: createError } = await supabase
      .from("lessons")
      .insert({
        title: `${originalLesson.title} (kopia)`,
        type: originalLesson.type,
        content: originalLesson.content,
        video_url: originalLesson.video_url,
        files: originalLesson.files,
        module_id: finalModuleId,
        course_id: originalLesson.course_id,
        order_index: newOrderIndex,
      })
      .select()
      .single();

    if (createError || !newLesson) {
      return new Response(JSON.stringify({ success: false, error: "Failed to create lesson copy" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: newLesson,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error duplicating lesson:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
