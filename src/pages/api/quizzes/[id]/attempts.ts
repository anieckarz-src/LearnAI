import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals, params }) => {
  const { supabase, user } = locals;

  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { id } = params;

    // Fetch quiz data
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select(
        `
        id,
        title,
        passing_score,
        max_attempts,
        lesson:lessons(
          course_id,
          course:courses(id)
        )
      `
      )
      .eq("id", id)
      .single();

    if (quizError || !quiz) {
      return new Response(JSON.stringify({ success: false, error: "Quiz not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has access to the course
    const { data: enrollment } = await supabase
      .from("course_enrollments")
      .select("id")
      .eq("course_id", quiz.lesson.course_id)
      .eq("user_id", user.id)
      .single();

    const { data: course } = await supabase
      .from("courses")
      .select("price")
      .eq("id", quiz.lesson.course_id)
      .single();

    const isFree = !course?.price || course.price === 0;
    const hasAccess = isFree || !!enrollment;

    if (!hasAccess) {
      return new Response(JSON.stringify({ success: false, error: "No access to this quiz" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch user's attempts
    const { data: attempts, error: attemptsError } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("quiz_id", id)
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });

    if (attemptsError) {
      throw attemptsError;
    }

    // Calculate stats
    const totalAttempts = attempts?.length || 0;
    const bestScore = totalAttempts > 0 ? Math.max(...attempts.map((a) => a.score)) : 0;
    const avgScore = totalAttempts > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts) : 0;
    const hasPassed = attempts?.some((a) => a.passed) || false;
    const canRetry = quiz.max_attempts === null || totalAttempts < quiz.max_attempts;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          attempts: attempts || [],
          stats: {
            total_attempts: totalAttempts,
            best_score: bestScore,
            avg_score: avgScore,
            has_passed: hasPassed,
            can_retry: canRetry,
          },
          quiz: {
            id: quiz.id,
            title: quiz.title,
            passing_score: quiz.passing_score,
            max_attempts: quiz.max_attempts,
          },
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching quiz attempts:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch quiz attempts" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
