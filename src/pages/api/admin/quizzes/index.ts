import type { APIRoute } from "astro";

// Helper function to check quiz ownership via lesson and course
async function checkQuizOwnership(supabase: any, userId: string, userRole: string, quizId: string): Promise<boolean> {
  if (userRole === "admin") {
    return true;
  }

  if (userRole === "instructor") {
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("lesson_id, lessons!inner(course_id, courses!inner(instructor_id))")
      .eq("id", quizId)
      .single();

    return quiz?.lessons?.courses?.instructor_id === userId;
  }

  return false;
}

export const GET: APIRoute = async ({ locals, url }) => {
  const { supabase, user } = locals;

  if (!user || !["admin", "instructor"].includes(user.role)) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const lessonId = url.searchParams.get("lesson_id");

    const offset = (page - 1) * limit;

    let query = supabase.from("quizzes").select(
      `
        *,
        lesson:lessons(
          id,
          title,
          course:courses(id, title, instructor_id)
        )
      `,
      { count: "exact" }
    );

    if (lessonId) {
      query = query.eq("lesson_id", lessonId);
    }

    // Filter by instructor_id for instructors
    if (user.role === "instructor") {
      query = query.eq("lesson.course.instructor_id", user.id);
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data: quizzes, error, count } = await query;

    if (error) {
      throw error;
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          data: quizzes || [],
          total: count || 0,
          page,
          limit,
          total_pages: totalPages,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch quizzes" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

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
    const { lesson_id, title, questions, ai_generated } = body;

    // Check ownership for instructors - verify they own the course
    if (user.role === "instructor") {
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

    if (!lesson_id || !title || !questions) {
      return new Response(JSON.stringify({ success: false, error: "lesson_id, title, and questions are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: quiz, error } = await supabase
      .from("quizzes")
      .insert({
        lesson_id,
        title,
        questions,
        ai_generated: ai_generated || false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the action
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "create_quiz",
      entity_type: "quiz",
      entity_id: quiz.id,
      new_values: quiz,
    });

    return new Response(JSON.stringify({ success: true, data: quiz }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to create quiz" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
