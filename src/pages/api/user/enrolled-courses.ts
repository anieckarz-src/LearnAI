import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  const { supabase, user } = locals;

  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get all courses the user is enrolled in
    const { data: enrollments, error: enrollError } = await supabase
      .from("course_enrollments")
      .select(
        `
        id,
        enrolled_at,
        course:courses (
          id,
          title,
          description,
          thumbnail_url,
          status,
          lesson_access_mode
        )
      `
      )
      .eq("user_id", user.id)
      .order("enrolled_at", { ascending: false });

    if (enrollError) {
      console.error("Error fetching enrollments:", enrollError);
      return new Response(JSON.stringify({ success: false, error: "Failed to fetch enrollments" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!enrollments || enrollments.length === 0) {
      return new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // For each course, calculate progress
    const coursesWithProgress = await Promise.all(
      enrollments.map(async (enrollment: any) => {
        const course = enrollment.course;

        if (!course) {
          return null;
        }

        // Get total lessons count for this course
        const { count: totalLessons, error: lessonsError } = await supabase
          .from("lessons")
          .select("*", { count: "exact", head: true })
          .eq("course_id", course.id);

        if (lessonsError) {
          console.error("Error counting lessons:", lessonsError);
          return {
            ...course,
            total_lessons: 0,
            completed_lessons: 0,
            progress_percentage: 0,
            enrolled_at: enrollment.enrolled_at,
          };
        }

        // Get completed lessons count
        const { count: completedLessons, error: progressError } = await supabase
          .from("lesson_progress")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("course_id", course.id)
          .eq("completed", true);

        if (progressError) {
          console.error("Error counting progress:", progressError);
          return {
            ...course,
            total_lessons: totalLessons || 0,
            completed_lessons: 0,
            progress_percentage: 0,
            enrolled_at: enrollment.enrolled_at,
          };
        }

        const total = totalLessons || 0;
        const completed = completedLessons || 0;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Get next incomplete lesson
        let nextLessonId = null;
        if (completed < total) {
          const { data: lessons } = await supabase
            .from("lessons")
            .select("id, order_index")
            .eq("course_id", course.id)
            .order("order_index", { ascending: true });

          if (lessons) {
            const { data: completedProgress } = await supabase
              .from("lesson_progress")
              .select("lesson_id")
              .eq("user_id", user.id)
              .eq("course_id", course.id)
              .eq("completed", true);

            const completedLessonIds = new Set(completedProgress?.map((p) => p.lesson_id) || []);

            for (const lesson of lessons) {
              if (!completedLessonIds.has(lesson.id)) {
                nextLessonId = lesson.id;
                break;
              }
            }
          }
        }

        return {
          ...course,
          total_lessons: total,
          completed_lessons: completed,
          progress_percentage: percentage,
          enrolled_at: enrollment.enrolled_at,
          next_lesson_id: nextLessonId,
        };
      })
    );

    // Filter out null courses
    const validCourses = coursesWithProgress.filter((c) => c !== null);

    return new Response(JSON.stringify({ success: true, data: validCourses }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in enrolled-courses:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
