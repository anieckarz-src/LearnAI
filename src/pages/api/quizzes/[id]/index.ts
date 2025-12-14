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
        *,
        lesson:lessons(
          id,
          title,
          course_id,
          course:courses(id, title)
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

    // Check if course is free
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

    // Get user's attempts count
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("id, score, passed, completed_at")
      .eq("quiz_id", id)
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });

    const userAttemptsCount = attempts?.length || 0;
    const userBestScore = attempts && attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : 0;
    const userHasPassed = attempts?.some((a) => a.passed) || false;

    // Check if user can attempt quiz
    const canAttempt = quiz.max_attempts === null || userAttemptsCount < quiz.max_attempts;

    // Remove correct answers from questions for security
    const questionsWithoutAnswers = quiz.questions.map((q: any) => ({
      id: q.id,
      question: q.question,
      options: q.options,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...quiz,
          questions: questionsWithoutAnswers,
          user_attempts_count: userAttemptsCount,
          user_best_score: userBestScore,
          user_has_passed: userHasPassed,
          can_attempt: canAttempt,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch quiz" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
