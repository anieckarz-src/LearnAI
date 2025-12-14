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
    const courseId = url.searchParams.get("course_id");

    if (!courseId) {
      return new Response(JSON.stringify({ success: false, error: "course_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: lessons, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index");

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true, data: lessons || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch lessons" }), {
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
    const { course_id, module_id, title, type, content, video_url, files, order_index } = body;

    // Validation
    if (!course_id || !module_id || !title || !type) {
      return new Response(
        JSON.stringify({ success: false, error: "course_id, module_id, title, and type are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify module exists and belongs to course
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

    if (module.course_id !== course_id) {
      return new Response(JSON.stringify({ success: false, error: "Module does not belong to this course" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Type-specific validation
    if (type === "content") {
      // Content lesson must have at least one: video_url, content, or files
      const hasContent = content && content.trim().length > 0;
      const hasVideo = video_url && video_url.trim().length > 0;
      const hasFiles = files && Array.isArray(files) && files.length > 0;

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
    } else if (type === "quiz") {
      // Quiz lesson - we'll check for quiz association later
      // For now, just allow creation
    }

    const { data: lesson, error } = await supabase
      .from("lessons")
      .insert({
        course_id,
        module_id,
        title,
        type,
        content: content || null,
        video_url: video_url || null,
        files: files || [],
        order_index: order_index || 0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the action
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "create_lesson",
      entity_type: "lesson",
      entity_id: lesson.id,
      new_values: lesson,
    });

    return new Response(JSON.stringify({ success: true, data: lesson }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating lesson:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to create lesson" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
