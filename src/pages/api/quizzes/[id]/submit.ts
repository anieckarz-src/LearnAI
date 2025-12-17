import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ locals, params, request }) => {
  const { supabase, user } = locals;

  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { answers, time_spent_seconds = 0 } = body;

    if (!answers || typeof answers !== "object") {
      return new Response(JSON.stringify({ success: false, error: "Invalid answers format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch quiz data with full questions including correct answers
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select(
        `
        *,
        lesson:lessons(
          id,
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

    const { data: course } = await supabase.from("courses").select("price").eq("id", quiz.lesson.course_id).single();

    const isFree = !course?.price || course.price === 0;
    const hasAccess = isFree || !!enrollment;

    if (!hasAccess) {
      return new Response(JSON.stringify({ success: false, error: "No access to this quiz" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has reached max attempts
    const { data: existingAttempts } = await supabase
      .from("quiz_attempts")
      .select("id")
      .eq("quiz_id", id)
      .eq("user_id", user.id);

    const attemptsCount = existingAttempts?.length || 0;

    if (quiz.max_attempts !== null && attemptsCount >= quiz.max_attempts) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Osiągnięto maksymalną liczbę prób (${quiz.max_attempts})`,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Calculate score
    const questions = quiz.questions as {
      id: string;
      question: string;
      options: string[];
      correct_answer: number;
    }[];

    let correctAnswers = 0;
    const feedback = questions.map((question) => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correct_answer;
      if (isCorrect) correctAnswers++;

      return {
        question_id: question.id,
        question: question.question,
        options: question.options,
        user_answer: userAnswer,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
      };
    });

    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= quiz.passing_score;

    // Save the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .insert({
        quiz_id: id,
        user_id: user.id,
        score,
        answers,
        time_spent_seconds,
        passed,
      })
      .select()
      .single();

    if (attemptError) {
      throw attemptError;
    }

    // Return results with feedback
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          attempt,
          quiz: {
            id: quiz.id,
            title: quiz.title,
            passing_score: quiz.passing_score,
            max_attempts: quiz.max_attempts,
          },
          feedback,
          total_questions: questions.length,
          correct_answers: correctAnswers,
          percentage: score,
          passed,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to submit quiz" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
