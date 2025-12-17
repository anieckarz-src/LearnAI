import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  const { supabase, user } = locals;

  if (!user || !["admin", "instructor"].includes(user.role)) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const isInstructor = user.role === "instructor";

    // Get total users (admin only)
    const { count: totalUsers } = isInstructor
      ? { count: 0 }
      : await supabase.from("users").select("*", { count: "exact", head: true });

    // Get new users this month (admin only)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: newUsersThisMonth } = isInstructor
      ? { count: 0 }
      : await supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", startOfMonth.toISOString());

    // Get total courses (filtered for instructors)
    let coursesQuery = supabase.from("courses").select("*", { count: "exact", head: true });
    if (isInstructor) {
      coursesQuery = coursesQuery.eq("instructor_id", user.id);
    }
    const { count: totalCourses } = await coursesQuery;

    // Get published courses (filtered for instructors)
    let publishedQuery = supabase.from("courses").select("*", { count: "exact", head: true }).eq("status", "published");
    if (isInstructor) {
      publishedQuery = publishedQuery.eq("instructor_id", user.id);
    }
    const { count: publishedCourses } = await publishedQuery;

    // Get draft courses (filtered for instructors)
    let draftQuery = supabase.from("courses").select("*", { count: "exact", head: true }).eq("status", "draft");
    if (isInstructor) {
      draftQuery = draftQuery.eq("instructor_id", user.id);
    }
    const { count: draftCourses } = await draftQuery;

    // Get total enrollments (filtered for instructors - only their courses)
    let enrollmentsQuery = supabase.from("course_enrollments").select("*", { count: "exact", head: true });
    if (isInstructor) {
      // Get course IDs for this instructor
      const { data: instructorCourses } = await supabase
        .from("courses")
        .select("id")
        .eq("instructor_id", user.id);
      const courseIds = instructorCourses?.map((c) => c.id) || [];
      if (courseIds.length > 0) {
        enrollmentsQuery = enrollmentsQuery.in("course_id", courseIds);
      } else {
        enrollmentsQuery = enrollmentsQuery.eq("course_id", "00000000-0000-0000-0000-000000000000"); // No courses
      }
    }
    const { count: totalEnrollments } = await enrollmentsQuery;

    // Get active users (filtered for instructors)
    let activeUsersQuery = supabase.from("course_enrollments").select("user_id").not("user_id", "is", null);
    if (isInstructor) {
      const { data: instructorCourses } = await supabase
        .from("courses")
        .select("id")
        .eq("instructor_id", user.id);
      const courseIds = instructorCourses?.map((c) => c.id) || [];
      if (courseIds.length > 0) {
        activeUsersQuery = activeUsersQuery.in("course_id", courseIds);
      } else {
        activeUsersQuery = activeUsersQuery.eq("course_id", "00000000-0000-0000-0000-000000000000");
      }
    }
    const { data: activeUsersData } = await activeUsersQuery;
    const activeUsers = activeUsersData ? new Set(activeUsersData.map((e) => e.user_id)).size : 0;

    // Get total quizzes (filtered for instructors)
    let quizzesQuery = supabase.from("quizzes").select("*, lessons!inner(course_id, courses!inner(instructor_id))", { count: "exact", head: true });
    if (isInstructor) {
      quizzesQuery = quizzesQuery.eq("lessons.courses.instructor_id", user.id);
    }
    const { count: totalQuizzes } = await quizzesQuery;

    // Get total quiz attempts (filtered for instructors)
    let attemptsQuery = supabase.from("quiz_attempts").select("*, quizzes!inner(lesson_id, lessons!inner(course_id, courses!inner(instructor_id)))", { count: "exact", head: true });
    if (isInstructor) {
      attemptsQuery = attemptsQuery.eq("quizzes.lessons.courses.instructor_id", user.id);
    }
    const { count: totalQuizAttempts } = await attemptsQuery;

    // Get average quiz score (filtered for instructors)
    let scoresQuery = supabase.from("quiz_attempts").select("score, quizzes!inner(lesson_id, lessons!inner(course_id, courses!inner(instructor_id)))");
    if (isInstructor) {
      scoresQuery = scoresQuery.eq("quizzes.lessons.courses.instructor_id", user.id);
    }
    const { data: quizScores } = await scoresQuery;

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
      active_students: activeUsers,
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
