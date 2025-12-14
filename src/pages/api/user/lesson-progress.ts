import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { lesson_id, course_id } = body;

    if (!lesson_id || !course_id) {
      return new Response(JSON.stringify({ success: false, error: "Missing lesson_id or course_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify user has access to the course
    const { data: enrollment } = await supabase
      .from("course_enrollments")
      .select("id")
      .eq("course_id", course_id)
      .eq("user_id", user.id)
      .single();

    if (!enrollment) {
      return new Response(JSON.stringify({ success: false, error: "Access denied - not enrolled in course" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify lesson belongs to course
    const { data: lesson } = await supabase
      .from("lessons")
      .select("id")
      .eq("id", lesson_id)
      .eq("course_id", course_id)
      .single();

    if (!lesson) {
      return new Response(JSON.stringify({ success: false, error: "Lesson not found in this course" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Mark lesson as completed (upsert to handle updates)
    const { data, error } = await supabase
      .from("lesson_progress")
      .upsert(
        {
          user_id: user.id,
          lesson_id: lesson_id,
          course_id: course_id,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,lesson_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error marking lesson as completed:", error);
      return new Response(JSON.stringify({ success: false, error: "Failed to update progress" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in lesson-progress POST:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { lesson_id, course_id } = body;

    if (!lesson_id || !course_id) {
      return new Response(JSON.stringify({ success: false, error: "Missing lesson_id or course_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify user has access to the course
    const { data: enrollment } = await supabase
      .from("course_enrollments")
      .select("id")
      .eq("course_id", course_id)
      .eq("user_id", user.id)
      .single();

    if (!enrollment) {
      return new Response(JSON.stringify({ success: false, error: "Access denied - not enrolled in course" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Mark lesson as incomplete (upsert to handle updates)
    const { data, error } = await supabase
      .from("lesson_progress")
      .upsert(
        {
          user_id: user.id,
          lesson_id: lesson_id,
          course_id: course_id,
          completed: false,
          completed_at: null,
        },
        {
          onConflict: "user_id,lesson_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error marking lesson as incomplete:", error);
      return new Response(JSON.stringify({ success: false, error: "Failed to update progress" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in lesson-progress DELETE:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const GET: APIRoute = async ({ locals, url }) => {
  const { supabase, user } = locals;

  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const courseId = url.searchParams.get("course_id");

    if (!courseId) {
      return new Response(JSON.stringify({ success: false, error: "Missing course_id parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user's progress for this course
    const { data, error } = await supabase
      .from("lesson_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", courseId);

    if (error) {
      console.error("Error fetching lesson progress:", error);
      return new Response(JSON.stringify({ success: false, error: "Failed to fetch progress" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in lesson-progress GET:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
