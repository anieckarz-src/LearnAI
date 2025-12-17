import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals, params }) => {
  const { supabase, user } = locals;
  const { id } = params;

  try {
    // Get course details
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .eq("status", "published")
      .single();

    if (courseError || !course) {
      return new Response(JSON.stringify({ success: false, error: "Course not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is enrolled
    let isEnrolled = false;

    if (user) {
      const { data: enrollment } = await supabase
        .from("course_enrollments")
        .select("id")
        .eq("course_id", id)
        .eq("user_id", user.id)
        .single();

      isEnrolled = !!enrollment;
    }

    // Get lesson count
    const { count: lessonCount } = await supabase
      .from("lessons")
      .select("*", { count: "exact", head: true })
      .eq("course_id", id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...course,
          is_enrolled: isEnrolled,
          lesson_count: lessonCount || 0,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching course:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch course" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
