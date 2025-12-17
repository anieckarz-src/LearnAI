import type { APIRoute } from "astro";

export const PATCH: APIRoute = async ({ locals, params, request }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { module_id, title, type, content, video_url, files, order_index } = body;

    // Build update object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (content !== undefined) updateData.content = content;
    if (video_url !== undefined) updateData.video_url = video_url;
    if (files !== undefined) updateData.files = files;
    if (order_index !== undefined) updateData.order_index = order_index;
    if (module_id !== undefined) updateData.module_id = module_id;

    // Type-specific validation if type is being updated or already exists
    if (type === "content" || (type === undefined && body.content !== undefined)) {
      // If updating to content type, check if it has content
      const finalType = type || "content";
      if (finalType === "content") {
        // Get current lesson to check existing values
        const { data: currentLesson } = await supabase.from("lessons").select("*").eq("id", id).single();

        const finalContent = content !== undefined ? content : currentLesson?.content;
        const finalVideo = video_url !== undefined ? video_url : currentLesson?.video_url;
        const finalFiles = files !== undefined ? files : currentLesson?.files;

        const hasContent = finalContent && finalContent.trim().length > 0;
        const hasVideo = finalVideo && finalVideo.trim().length > 0;
        const hasFiles = Array.isArray(finalFiles) && finalFiles.length > 0;

        if (!hasContent && !hasVideo && !hasFiles) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Content lesson must have at least one: content, video_url, or files",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    // Verify module exists if being updated
    if (module_id) {
      const { data: module, error: moduleError } = await supabase
        .from("modules")
        .select("course_id")
        .eq("id", module_id)
        .single();

      if (moduleError || !module) {
        return new Response(JSON.stringify({ success: false, error: "Module not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const { data: lesson, error } = await supabase.from("lessons").update(updateData).eq("id", id).select().single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true, data: lesson }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating lesson:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to update lesson" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ locals, params }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { id } = params;

    const { error } = await supabase.from("lessons").delete().eq("id", id);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true, message: "Lesson deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to delete lesson" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
