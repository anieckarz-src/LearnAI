import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { supabase } = locals;
    const courseId = params.id;

    // Fetch course - only published courses can be previewed
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return new Response(
        JSON.stringify({ success: false, error: "Course not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Only allow preview of published courses
    if (course.status !== "published") {
      return new Response(
        JSON.stringify({ success: false, error: "Course not available for preview" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch modules
    const { data: modules, error: modulesError } = await supabase
      .from("modules")
      .select("id, title, description, order_index")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (modulesError) {
      console.error("Error fetching modules:", modulesError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch modules" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch lessons (only basic info)
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, title, type, order_index, module_id")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (lessonsError) {
      console.error("Error fetching lessons:", lessonsError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch lessons" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Group lessons by module
    const modulesWithLessons = (modules || []).map((module) => {
      const moduleLessons = (lessons || [])
        .filter((l) => l.module_id === module.id)
        .map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          type: lesson.type,
          order_index: lesson.order_index,
        }));

      return {
        id: module.id,
        title: module.title,
        description: module.description,
        order_index: module.order_index,
        lessons: moduleLessons,
      };
    });

    // Calculate stats
    const totalModules = modulesWithLessons.length;
    const totalLessons = lessons?.length || 0;
    const totalQuizzes = lessons?.filter((l) => l.type === "quiz").length || 0;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          modules: modulesWithLessons,
          stats: {
            total_modules: totalModules,
            total_lessons: totalLessons,
            total_quizzes: totalQuizzes,
          },
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in GET /api/courses/:id/preview:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
