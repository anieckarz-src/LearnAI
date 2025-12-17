import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals, url }) => {
  const { supabase, user } = locals;

  if (!user || !["admin", "instructor"].includes(user.role)) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const courseId = url.searchParams.get("course_id");

    // Build query for enrollments with progress
    let query = supabase
      .from("course_enrollments")
      .select(
        `
        id,
        enrolled_at,
        completed_at,
        user:users(id, email, full_name),
        course:courses(id, title, instructor_id)
      `
      )
      .order("enrolled_at", { ascending: false });

    // Filter by course if specified
    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    // Filter by instructor's courses if not admin
    if (user.role === "instructor") {
      // Get instructor's course IDs
      const { data: instructorCourses } = await supabase
        .from("courses")
        .select("id")
        .eq("instructor_id", user.id);

      const courseIds = instructorCourses?.map((c) => c.id) || [];

      if (courseIds.length === 0) {
        // Instructor has no courses
        return generateCSV([]);
      }

      query = query.in("course_id", courseIds);
    }

    const { data: enrollments, error } = await query;

    if (error) {
      throw error;
    }

    // Get lesson progress for each enrollment
    const enrichedData = await Promise.all(
      (enrollments || []).map(async (enrollment: any) => {
        // Get total lessons and completed lessons for this course
        const { count: totalLessons } = await supabase
          .from("lessons")
          .select("*", { count: "exact", head: true })
          .eq("course_id", enrollment.course.id);

        const { count: completedLessons } = await supabase
          .from("lesson_progress")
          .select("*", { count: "exact", head: true })
          .eq("user_id", enrollment.user.id)
          .eq("course_id", enrollment.course.id)
          .eq("completed", true);

        // Get quiz attempts
        const { data: quizAttempts } = await supabase
          .from("quiz_attempts")
          .select("score, quizzes!inner(lesson_id, lessons!inner(course_id))")
          .eq("user_id", enrollment.user.id)
          .eq("quizzes.lessons.course_id", enrollment.course.id);

        const avgQuizScore =
          quizAttempts && quizAttempts.length > 0
            ? quizAttempts.reduce((sum: number, a: any) => sum + a.score, 0) / quizAttempts.length
            : 0;

        const progressPercentage = totalLessons ? Math.round(((completedLessons || 0) / totalLessons) * 100) : 0;

        return {
          student_name: enrollment.user.full_name || enrollment.user.email,
          student_email: enrollment.user.email,
          course_title: enrollment.course.title,
          enrolled_at: new Date(enrollment.enrolled_at).toLocaleDateString("pl-PL"),
          completed_at: enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString("pl-PL") : "W trakcie",
          total_lessons: totalLessons || 0,
          completed_lessons: completedLessons || 0,
          progress_percentage: progressPercentage,
          quiz_attempts: quizAttempts?.length || 0,
          avg_quiz_score: avgQuizScore.toFixed(1),
        };
      })
    );

    return generateCSV(enrichedData);
  } catch (error) {
    console.error("Error exporting students progress:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to export data" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

function generateCSV(data: any[]): Response {
  if (data.length === 0) {
    const csv = "Brak danych do eksportu\n";
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="postepy_studentow.csv"',
      },
    });
  }

  // CSV headers
  const headers = [
    "Imię i nazwisko",
    "Email",
    "Kurs",
    "Data zapisu",
    "Data ukończenia",
    "Liczba lekcji",
    "Ukończone lekcje",
    "Postęp (%)",
    "Liczba podejść do quizów",
    "Średnia ocena z quizów (%)",
  ];

  // Build CSV content
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = [
      escapeCSV(row.student_name),
      escapeCSV(row.student_email),
      escapeCSV(row.course_title),
      row.enrolled_at,
      row.completed_at,
      row.total_lessons,
      row.completed_lessons,
      row.progress_percentage,
      row.quiz_attempts,
      row.avg_quiz_score,
    ];
    csvRows.push(values.join(","));
  }

  const csv = "\uFEFF" + csvRows.join("\n"); // BOM for Excel UTF-8 support

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="postepy_studentow_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}

function escapeCSV(value: string): string {
  if (value === null || value === undefined) {
    return "";
  }
  const stringValue = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}
