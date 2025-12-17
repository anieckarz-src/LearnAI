import type { APIRoute } from "astro";

// Helper function to check course ownership
async function checkCourseOwnership(supabase: any, userId: string, userRole: string, courseId: string): Promise<boolean> {
  // Admin has access to all courses
  if (userRole === "admin") {
    return true;
  }

  // Instructor only to their own courses
  if (userRole === "instructor") {
    const { data: course } = await supabase.from("courses").select("instructor_id").eq("id", courseId).single();

    return course?.instructor_id === userId;
  }

  return false;
}

export const GET: APIRoute = async ({ locals, params }) => {
  const { supabase, user } = locals;

  if (!user || !["admin", "instructor"].includes(user.role)) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { id } = params;

    const { data: course, error } = await supabase.from("courses").select("*").eq("id", id).single();

    if (error || !course) {
      return new Response(JSON.stringify({ success: false, error: "Course not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check ownership for instructors
    const hasAccess = await checkCourseOwnership(supabase, user.id, user.role, id);
    if (!hasAccess) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden - You don't own this course" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get lessons for this course
    const { data: lessons } = await supabase.from("lessons").select("*").eq("course_id", id).order("order_index");

    return new Response(JSON.stringify({ success: true, data: { ...course, lessons: lessons || [] } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch course" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PATCH: APIRoute = async ({ locals, params, request }) => {
  const { supabase, user } = locals;

  if (!user || !["admin", "instructor"].includes(user.role)) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { id } = params;

    // Check ownership for instructors
    const hasAccess = await checkCourseOwnership(supabase, user.id, user.role, id);
    if (!hasAccess) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden - You don't own this course" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { title, description, thumbnail_url, status } = body;

    const { data: oldCourse } = await supabase.from("courses").select("*").eq("id", id).single();

    const updateData: Record<string, unknown> = {
      title,
      description,
      thumbnail_url,
      status,
    };

    const { data: course, error } = await supabase.from("courses").update(updateData).eq("id", id).select().single();

    if (error) {
      throw error;
    }

    // Log the action
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "update_course",
      entity_type: "course",
      entity_id: id,
      old_values: oldCourse,
      new_values: course,
    });

    return new Response(JSON.stringify({ success: true, data: course }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to update course" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ locals, params }) => {
  const { supabase, user } = locals;

  if (!user || !["admin", "instructor"].includes(user.role)) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { id } = params;

    // Check ownership for instructors
    const hasAccess = await checkCourseOwnership(supabase, user.id, user.role, id);
    if (!hasAccess) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden - You don't own this course" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: course } = await supabase.from("courses").select("*").eq("id", id).single();

    const { error } = await supabase.from("courses").delete().eq("id", id);

    if (error) {
      throw error;
    }

    // Log the action
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "delete_course",
      entity_type: "course",
      entity_id: id,
      old_values: course,
    });

    return new Response(JSON.stringify({ success: true, message: "Course deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to delete course" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
