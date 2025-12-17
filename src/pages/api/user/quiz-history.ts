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
    // Get all quiz attempts for the user with quiz and course information
    const { data: attempts, error } = await supabase
      .from("quiz_attempts")
      .select(
        `
        id,
        quiz_id,
        score,
        completed_at,
        answers,
        quiz:quizzes (
          id,
          title,
          questions,
          lesson:lessons (
            id,
            title,
            course:courses (
              id,
              title
            )
          )
        )
      `
      )
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });

    if (error) {
      console.error("Error fetching quiz attempts:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch quiz history" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Transform the data for easier consumption
    const formattedAttempts = attempts?.map((attempt: any) => {
      const quiz = attempt.quiz;
      const lesson = quiz?.lesson;
      const course = lesson?.course;
      const questions = quiz?.questions || [];

      return {
        id: attempt.id,
        quiz_id: attempt.quiz_id,
        quiz_title: quiz?.title || "Nieznany quiz",
        course_title: course?.title || "Nieznany kurs",
        course_id: course?.id,
        score: attempt.score,
        completed_at: attempt.completed_at,
        total_questions: Array.isArray(questions) ? questions.length : 0,
      };
    }) || [];

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: formattedAttempts 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in quiz-history:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
