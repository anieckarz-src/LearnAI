import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get total users
    const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true });

    // Get new users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: newUsersThisMonth } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString());

    // Get total courses
    const { count: totalCourses } = await supabase.from("courses").select("*", { count: "exact", head: true });

    // Get published courses
    const { count: publishedCourses } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");

    // Get draft courses
    const { count: draftCourses } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft");

    // Get total enrollments
    const { count: totalEnrollments } = await supabase
      .from("course_enrollments")
      .select("*", { count: "exact", head: true });

    // Get active students (students with at least one enrollment)
    const { data: activeStudentsData } = await supabase
      .from("course_enrollments")
      .select("user_id")
      .not("user_id", "is", null);

    const activeStudents = activeStudentsData ? new Set(activeStudentsData.map((e) => e.user_id)).size : 0;

    // Get total quizzes
    const { count: totalQuizzes } = await supabase.from("quizzes").select("*", { count: "exact", head: true });

    // Get total quiz attempts
    const { count: totalQuizAttempts } = await supabase
      .from("quiz_attempts")
      .select("*", { count: "exact", head: true });

    // Get average quiz score
    const { data: quizScores } = await supabase.from("quiz_attempts").select("score");

    const avgQuizScore =
      quizScores && quizScores.length > 0
        ? quizScores.reduce((sum, attempt) => sum + attempt.score, 0) / quizScores.length
        : 0;

    const stats = {
      total_users: totalUsers || 0,
      new_users_this_month: newUsersThisMonth || 0,
      total_courses: totalCourses || 0,
      published_courses: publishedCourses || 0,
      draft_courses: draftCourses || 0,
      total_enrollments: totalEnrollments || 0,
      active_students: activeStudents,
      total_quizzes: totalQuizzes || 0,
      total_quiz_attempts: totalQuizAttempts || 0,
      avg_quiz_score: avgQuizScore,
    };

    return new Response(JSON.stringify({ success: true, data: stats }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch stats" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
