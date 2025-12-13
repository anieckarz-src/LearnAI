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

    // Get all quiz attempts
    const { data: attempts, error: attemptsError } = await supabase
      .from("quiz_attempts")
      .select("score, completed_at")
      .gte("completed_at", startDate.toISOString())
      .order("completed_at");

    if (attemptsError) throw attemptsError;

    // Calculate score distribution
    const scoreRanges = {
      "0-25": 0,
      "25-50": 0,
      "50-75": 0,
      "75-100": 0,
    };

    const scoresByDate = new Map<string, number[]>();

    attempts?.forEach((attempt) => {
      const score = attempt.score;

      // Categorize score
      if (score <= 25) scoreRanges["0-25"]++;
      else if (score <= 50) scoreRanges["25-50"]++;
      else if (score <= 75) scoreRanges["50-75"]++;
      else scoreRanges["75-100"]++;

      // Group by date
      const dateStr = attempt.completed_at.split("T")[0];
      if (!scoresByDate.has(dateStr)) {
        scoresByDate.set(dateStr, []);
      }
      scoresByDate.get(dateStr)!.push(score);
    });

    // Calculate average scores by date
    const avgScoresByDate = Array.from(scoresByDate.entries()).map(([date, scores]) => ({
      date,
      avg_score: scores.reduce((a, b) => a + b, 0) / scores.length,
    }));

    // Convert score ranges to array for pie chart
    const scoreDistribution = Object.entries(scoreRanges).map(([range, count]) => ({
      range,
      count,
      percentage: attempts && attempts.length > 0 ? (count / attempts.length) * 100 : 0,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          distribution: scoreDistribution,
          timeline: avgScoresByDate,
          total_attempts: attempts?.length || 0,
          average_score:
            attempts && attempts.length > 0 ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length : 0,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching quiz results stats:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch quiz results stats" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
