import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals, url }) => {
  const { supabase, user } = locals;

  try {
    const search = url.searchParams.get("search");
    const isFree = url.searchParams.get("is_free");

    // Build query for published courses
    let query = supabase
      .from("courses")
      .select("*, instructor:users!courses_instructor_id_fkey(id, email, full_name)")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply free/paid filter
    if (isFree === "true") {
      query = query.is("price", null);
    } else if (isFree === "false") {
      query = query.not("price", "is", null);
    }

    const { data: courses, error } = await query;

    if (error) {
      throw error;
    }

    // If user is logged in, check which courses they have access to
    let enrolledCourseIds: string[] = [];
    if (user) {
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .eq("user_id", user.id);

      enrolledCourseIds = enrollments?.map((e) => e.course_id) || [];
    }

    // Add enrollment status to courses
    const coursesWithStatus = courses?.map((course) => ({
      ...course,
      is_enrolled: enrolledCourseIds.includes(course.id),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: coursesWithStatus,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching courses:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch courses" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
