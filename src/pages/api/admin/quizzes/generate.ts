import type { APIRoute } from "astro";
import { generateQuizFromLesson, validateLessonContent } from "@/lib/ai-quiz-generator";
import type { QuizDifficulty } from "@/types";

export const POST: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { lesson_id, num_questions = 5, difficulty = "medium" } = body;

    // Validate input
    if (!lesson_id) {
      return new Response(JSON.stringify({ success: false, error: "lesson_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (num_questions < 3 || num_questions > 15) {
      return new Response(
        JSON.stringify({ success: false, error: "num_questions must be between 3 and 15" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validDifficulties: QuizDifficulty[] = ["easy", "medium", "hard"];
    if (!validDifficulties.includes(difficulty)) {
      return new Response(
        JSON.stringify({ success: false, error: "difficulty must be 'easy', 'medium', or 'hard'" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch lesson content
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id, title, content")
      .eq("id", lesson_id)
      .single();

    if (lessonError || !lesson) {
      return new Response(JSON.stringify({ success: false, error: "Lesson not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate lesson content
    const validation = validateLessonContent(lesson.content || "");
    if (!validation.valid) {
      return new Response(JSON.stringify({ success: false, error: validation.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate quiz using AI
    const questions = await generateQuizFromLesson({
      lessonContent: lesson.content || "",
      lessonTitle: lesson.title,
      numQuestions: num_questions,
      difficulty: difficulty as QuizDifficulty,
    });

    // Return generated questions (without saving to database)
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          questions,
          lesson_title: lesson.title,
          suggested_title: `Quiz: ${lesson.title}`,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating quiz:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate quiz";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
