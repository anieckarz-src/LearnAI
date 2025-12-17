import type { APIRoute } from "astro";

// Helper function to check course ownership
async function checkCourseOwnership(supabase: any, userId: string, userRole: string, courseId: string): Promise<boolean> {
  if (userRole === "admin") {
    return true;
  }

  if (userRole === "instructor") {
    const { data: course } = await supabase.from("courses").select("instructor_id").eq("id", courseId).single();
    return course?.instructor_id === userId;
  }

  return false;
}

export const GET: APIRoute = async ({ locals, url }) => {
  const { supabase, user } = locals;

  if (!user || !["admin", "instructor"].includes(user.role)) {
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

    // Check ownership for instructors
    const hasAccess = await checkCourseOwnership(supabase, user.id, user.role, courseId);
    if (!hasAccess) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden - You don't own this course" }), {
        status: 403,
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

  if (!user || !["admin", "instructor"].includes(user.role)) {
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

    // Check ownership for instructors
    const hasAccess = await checkCourseOwnership(supabase, user.id, user.role, course_id);
    if (!hasAccess) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden - You don't own this course" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
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

    // If order_index is provided, shift existing lessons at or after that position
    // to make room for the new lesson
    if (order_index !== undefined && order_index !== null) {
      // Get all lessons that need to be shifted
      const { data: lessonsToShift, error: fetchError } = await supabase
        .from("lessons")
        .select("id, order_index")
        .eq("module_id", module_id)
        .gte("order_index", order_index)
        .order("order_index", { ascending: false }); // Process in reverse to avoid conflicts

      if (!fetchError && lessonsToShift && lessonsToShift.length > 0) {
        // Update each lesson's order_index
        for (const lessonToShift of lessonsToShift) {
          await supabase
            .from("lessons")
            .update({ order_index: lessonToShift.order_index + 1 })
            .eq("id", lessonToShift.id);
        }
      }
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
