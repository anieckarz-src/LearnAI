import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals, params }) => {
  const { supabase, user } = locals;
  const { id } = params;

  try {
    // Get course details
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("*, instructor:users!courses_instructor_id_fkey(id, email, full_name)")
      .eq("id", id)
      .eq("status", "published")
      .single();

    if (courseError || !course) {
      return new Response(JSON.stringify({ success: false, error: "Course not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has access
    let hasAccess = false;
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

    // Free courses are always accessible
    if (!course.price || course.price <= 0) {
      hasAccess = true;
    } else {
      hasAccess = isEnrolled;
    }

    // Get lessons (only if user has access)
    let lessons = null;
    let lessonProgress = null;
    
    if (hasAccess) {
      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", id)
        .order("order_index");

      lessons = lessonsData;

      // Get user's progress for this course (if authenticated)
      if (user) {
        const { data: progressData } = await supabase
          .from("lesson_progress")
          .select("lesson_id, completed, completed_at")
          .eq("user_id", user.id)
          .eq("course_id", id);

        lessonProgress = progressData;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...course,
          has_access: hasAccess,
          is_enrolled: isEnrolled,
          lessons: lessons,
          lesson_progress: lessonProgress,
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
