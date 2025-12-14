import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals, params }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { id } = params;

    const { data: quiz, error } = await supabase
      .from("quizzes")
      .select(
        `
        *,
        lesson:lessons(
          id,
          title,
          course:courses(id, title)
        )
      `
      )
      .eq("id", id)
      .single();

    if (error || !quiz) {
      return new Response(JSON.stringify({ success: false, error: "Quiz not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get quiz attempts stats
    const { data: attempts } = await supabase.from("quiz_attempts").select("score").eq("quiz_id", id);

    const stats =
      attempts && attempts.length > 0
        ? {
            total_attempts: attempts.length,
            avg_score: attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length,
          }
        : { total_attempts: 0, avg_score: 0 };

    return new Response(JSON.stringify({ success: true, data: { ...quiz, stats } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch quiz" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PATCH: APIRoute = async ({ locals, params, request }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { title, lesson_id, questions, ai_generated, passing_score, max_attempts, time_limit_minutes } = body;

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};

    if (title !== undefined) updateData.title = title;
    if (lesson_id !== undefined) updateData.lesson_id = lesson_id;
    if (questions !== undefined) updateData.questions = questions;
    if (ai_generated !== undefined) updateData.ai_generated = ai_generated;
    if (passing_score !== undefined) updateData.passing_score = passing_score;
    if (max_attempts !== undefined) updateData.max_attempts = max_attempts;
    if (time_limit_minutes !== undefined) updateData.time_limit_minutes = time_limit_minutes;

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ success: false, error: "No fields to update" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get old quiz data for audit log
    const { data: oldQuiz } = await supabase.from("quizzes").select("*").eq("id", id).single();

    const { data: quiz, error } = await supabase
      .from("quizzes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!quiz) {
      return new Response(JSON.stringify({ success: false, error: "Quiz not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log the action
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "update_quiz",
      entity_type: "quiz",
      entity_id: quiz.id,
      old_values: oldQuiz,
      new_values: quiz,
    });

    return new Response(JSON.stringify({ success: true, data: quiz }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating quiz:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to update quiz" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ locals, params }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { id } = params;

    const { error } = await supabase.from("quizzes").delete().eq("id", id);

    if (error) {
      throw error;
    }

    // Log the action
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "delete_quiz",
      entity_type: "quiz",
      entity_id: id,
    });

    return new Response(JSON.stringify({ success: true, message: "Quiz deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to delete quiz" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
