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
    const { lesson_ids, target_module_id } = body;

    if (!lesson_ids || !Array.isArray(lesson_ids) || lesson_ids.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "lesson_ids array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!target_module_id) {
      return new Response(JSON.stringify({ success: false, error: "target_module_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify target module exists
    const { data: targetModule, error: moduleError } = await supabase
      .from("modules")
      .select("id, course_id")
      .eq("id", target_module_id)
      .single();

    if (moduleError || !targetModule) {
      return new Response(JSON.stringify({ success: false, error: "Target module not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the highest order_index for the target module
    const { data: maxOrderData } = await supabase
      .from("lessons")
      .select("order_index")
      .eq("module_id", target_module_id)
      .order("order_index", { ascending: false })
      .limit(1)
      .single();

    let nextOrderIndex = (maxOrderData?.order_index ?? -1) + 1;

    // Move each lesson
    let updatedCount = 0;
    for (const lessonId of lesson_ids) {
      const { error: updateError } = await supabase
        .from("lessons")
        .update({
          module_id: target_module_id,
          order_index: nextOrderIndex,
        })
        .eq("id", lessonId);

      if (!updateError) {
        updatedCount++;
        nextOrderIndex++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated_count: updatedCount,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error bulk moving lessons:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
