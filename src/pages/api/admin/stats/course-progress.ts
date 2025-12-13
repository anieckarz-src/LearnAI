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
    const limit = parseInt(url.searchParams.get("limit") || "10");

    // Get top courses by enrollments with completion stats
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select(
        `
        id,
        title,
        status
      `
      )
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (coursesError) throw coursesError;

    // Get enrollment and completion data for each course
    const courseStats = await Promise.all(
      (courses || []).map(async (course) => {
        // Get total enrollments
        const { count: enrollmentCount, error: enrollmentError } = await supabase
          .from("course_enrollments")
          .select("*", { count: "exact", head: true })
          .eq("course_id", course.id);

        if (enrollmentError) throw enrollmentError;

        // Get completions
        const { count: completionCount, error: completionError } = await supabase
          .from("course_enrollments")
          .select("*", { count: "exact", head: true })
          .eq("course_id", course.id)
          .not("completed_at", "is", null);

        if (completionError) throw completionError;

        // Get average quiz score for this course
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select(
            `
            id,
            quiz_attempts(score)
          `
          )
          .in("lesson_id", supabase.from("lessons").select("id").eq("course_id", course.id));

        let avgScore = 0;
        if (!quizError && quizData) {
          const allScores: number[] = [];
          quizData.forEach((quiz: any) => {
            if (quiz.quiz_attempts) {
              quiz.quiz_attempts.forEach((attempt: any) => {
                allScores.push(attempt.score);
              });
            }
          });
          avgScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
        }

        return {
          course_id: course.id,
          title: course.title,
          enrollments: enrollmentCount || 0,
          completions: completionCount || 0,
          completion_rate:
            enrollmentCount && enrollmentCount > 0 ? ((completionCount || 0) / enrollmentCount) * 100 : 0,
          avg_score: avgScore,
        };
      })
    );

    // Sort by enrollments and limit
    const sortedStats = courseStats.sort((a, b) => b.enrollments - a.enrollments).slice(0, limit);

    return new Response(JSON.stringify({ success: true, data: sortedStats }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching course progress stats:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch course progress stats" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
