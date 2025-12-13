import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals, url }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const days = parseInt(url.searchParams.get("days") || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get new users per day
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at");

    if (usersError) throw usersError;

    // Get enrollments per day
    const { data: enrollmentsData, error: enrollmentsError } = await supabase
      .from("course_enrollments")
      .select("enrolled_at")
      .gte("enrolled_at", startDate.toISOString())
      .order("enrolled_at");

    if (enrollmentsError) throw enrollmentsError;

    // Get quiz attempts per day
    const { data: attemptsData, error: attemptsError } = await supabase
      .from("quiz_attempts")
      .select("completed_at")
      .gte("completed_at", startDate.toISOString())
      .order("completed_at");

    if (attemptsError) throw attemptsError;

    // Aggregate data by date
    const activityMap = new Map<string, { users: number; enrollments: number; quiz_attempts: number }>();

    // Initialize all dates
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      activityMap.set(dateStr, { users: 0, enrollments: 0, quiz_attempts: 0 });
    }

    // Count users
    usersData?.forEach((user) => {
      const dateStr = user.created_at.split("T")[0];
      const entry = activityMap.get(dateStr);
      if (entry) entry.users++;
    });

    // Count enrollments
    enrollmentsData?.forEach((enrollment) => {
      const dateStr = enrollment.enrolled_at.split("T")[0];
      const entry = activityMap.get(dateStr);
      if (entry) entry.enrollments++;
    });

    // Count quiz attempts
    attemptsData?.forEach((attempt) => {
      const dateStr = attempt.completed_at.split("T")[0];
      const entry = activityMap.get(dateStr);
      if (entry) entry.quiz_attempts++;
    });

    // Convert to array
    const activityData = Array.from(activityMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    return new Response(JSON.stringify({ success: true, data: activityData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching activity stats:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch activity stats" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
