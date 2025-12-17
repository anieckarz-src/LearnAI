import type { APIRoute } from "astro";
import type { Module } from "@/types";

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

// GET /api/admin/modules?course_id=xxx - Get all modules for a course
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user || !["admin", "instructor"].includes(user.role)) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const courseId = url.searchParams.get("course_id");

    if (!courseId) {
      return new Response(JSON.stringify({ success: false, error: "course_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check ownership for instructors
    const { supabase } = locals;
    const hasAccess = await checkCourseOwnership(supabase, user.id, user.role, courseId);
    if (!hasAccess) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden - You don't own this course" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch modules for the course
    const { data: modules, error } = await supabase
      .from("modules")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching modules:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: modules }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/modules:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// POST /api/admin/modules - Create a new module
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user || !["admin", "instructor"].includes(user.role)) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { course_id, title, description, order_index } = body;

    // Validation
    if (!course_id || !title) {
      return new Response(JSON.stringify({ success: false, error: "course_id and title are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (title.length < 3) {
      return new Response(JSON.stringify({ success: false, error: "Title must be at least 3 characters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { supabase } = locals;

    // Check ownership for instructors
    const hasAccess = await checkCourseOwnership(supabase, user.id, user.role, course_id);
    if (!hasAccess) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden - You don't own this course" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", course_id)
      .single();

    if (courseError || !course) {
      return new Response(JSON.stringify({ success: false, error: "Course not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If order_index not provided, get the next available index
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const { data: lastModule } = await supabase
        .from("modules")
        .select("order_index")
        .eq("course_id", course_id)
        .order("order_index", { ascending: false })
        .limit(1)
        .single();

      finalOrderIndex = lastModule ? lastModule.order_index + 1 : 0;
    }

    // Create module
    const { data: module, error } = await supabase
      .from("modules")
      .insert({
        course_id,
        title,
        description: description || null,
        order_index: finalOrderIndex,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating module:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: module }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/admin/modules:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
