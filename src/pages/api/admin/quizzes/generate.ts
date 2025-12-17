import type { APIRoute } from "astro";
import { generateQuizFromLesson, generateQuizFromPrompt, validateLessonContent } from "@/lib/ai-quiz-generator";
import { checkRateLimit, incrementRateLimit } from "@/lib/rate-limiter";
import type { QuizDifficulty } from "@/types";

export const POST: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  if (!user || !["admin", "instructor"].includes(user.role)) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { lesson_id, topic, description, num_questions = 5, difficulty = "medium" } = body;

    // Determine generation mode: from lesson or from custom topic
    const isCustomTopic = !lesson_id && topic;

    // Validate input
    if (!lesson_id && !topic) {
      return new Response(JSON.stringify({ success: false, error: "Either lesson_id or topic is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check ownership for instructors if lesson_id is provided
    if (lesson_id && user.role === "instructor") {
      const { data: lesson } = await supabase
        .from("lessons")
        .select("course_id, courses!inner(instructor_id)")
        .eq("id", lesson_id)
        .single();

      if (!lesson || lesson.courses?.instructor_id !== user.id) {
        return new Response(JSON.stringify({ success: false, error: "Forbidden - You don't own this lesson's course" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (num_questions < 3 || num_questions > 15) {
      return new Response(JSON.stringify({ success: false, error: "num_questions must be between 3 and 15" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validDifficulties: QuizDifficulty[] = ["easy", "medium", "hard"];
    if (!validDifficulties.includes(difficulty)) {
      return new Response(JSON.stringify({ success: false, error: "difficulty must be 'easy', 'medium', or 'hard'" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check rate limit (admins and instructors have unlimited, but we still track)
    const isAdminOrInstructor = ["admin", "instructor"].includes(user.role);
    const rateLimitCheck = await checkRateLimit(supabase, user.id, "quiz_generation", isAdminOrInstructor);

    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Rate limit exceeded",
          resetAt: rateLimitCheck.resetAt.toISOString(),
          limit: rateLimitCheck.limit,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Increment rate limit
    await incrementRateLimit(supabase, user.id, "quiz_generation", isAdmin);

    let questions;
    let suggestedTitle;

    if (isCustomTopic) {
      // Generate quiz from custom topic
      if (!topic || topic.trim().length < 3) {
        return new Response(JSON.stringify({ success: false, error: "Topic must be at least 3 characters" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      questions = await generateQuizFromPrompt({
        topic: topic.trim(),
        description: description?.trim(),
        numQuestions: num_questions,
        difficulty: difficulty as QuizDifficulty,
      });

      suggestedTitle = `Quiz: ${topic}`;
    } else {
      // Generate quiz from lesson
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

      questions = await generateQuizFromLesson({
        lessonContent: lesson.content || "",
        lessonTitle: lesson.title,
        numQuestions: num_questions,
        difficulty: difficulty as QuizDifficulty,
      });

      suggestedTitle = `Quiz: ${lesson.title}`;
    }

    // Return generated questions (without saving to database)
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          questions,
          suggested_title: suggestedTitle,
          rateLimitRemaining: rateLimitCheck.remaining - 1,
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
