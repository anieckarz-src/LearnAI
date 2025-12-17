import type { APIRoute } from "astro";
import type { ModuleWithLessons } from "@/types";

// GET /api/courses/:id/modules - Get all modules with lessons for a course
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { supabase, user } = locals;
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const courseId = params.id;

    // Check if user is enrolled in the course or is admin
    const isAdmin = user.role === "admin";
    let isEnrolled = false;

    if (!isAdmin) {
      const { data: enrollment } = await supabase
        .from("course_enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .single();

      isEnrolled = !!enrollment;

      if (!isEnrolled) {
        return new Response(JSON.stringify({ success: false, error: "Not enrolled in course" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Fetch course
    const { data: course, error: courseError } = await supabase.from("courses").select("*").eq("id", courseId).single();

    if (courseError || !course) {
      return new Response(JSON.stringify({ success: false, error: "Course not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if course is published (unless admin)
    if (!isAdmin && course.status !== "published") {
      return new Response(JSON.stringify({ success: false, error: "Course not available" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch modules
    const { data: modules, error: modulesError } = await supabase
      .from("modules")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (modulesError) {
      console.error("Error fetching modules:", modulesError);
      return new Response(JSON.stringify({ success: false, error: modulesError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch lessons for all modules
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (lessonsError) {
      console.error("Error fetching lessons:", lessonsError);
      return new Response(JSON.stringify({ success: false, error: lessonsError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch lesson progress for the user
    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", courseId);

    const progressMap = new Map(progress?.map((p) => [p.lesson_id, p]) || []);

    // Fetch quizzes for quiz-type lessons
    const quizLessonIds = lessons?.filter((l) => l.type === "quiz").map((l) => l.id) || [];
    let quizzesMap = new Map();

    if (quizLessonIds.length > 0) {
      const { data: quizzes } = await supabase.from("quizzes").select("*").in("lesson_id", quizLessonIds);

      quizzesMap = new Map(quizzes?.map((q) => [q.lesson_id, q]) || []);
    }

    // Calculate lesson accessibility based on sequential mode
    const isSequential = course.lesson_access_mode === "sequential";
    let allLessonsCompleted = true;

    // Group lessons by module
    const modulesWithLessons: ModuleWithLessons[] = (modules || []).map((module) => {
      const moduleLessons = (lessons || [])
        .filter((l) => l.module_id === module.id)
        .map((lesson, index) => {
          const lessonProgress = progressMap.get(lesson.id);
          const completed = lessonProgress?.completed || false;
          const completed_at = lessonProgress?.completed_at || null;

          // Determine accessibility
          let is_accessible = true;

          // Admins have access to all lessons
          if (isAdmin) {
            is_accessible = true;
          } else if (isSequential) {
            // In sequential mode, check if previous lesson is completed
            if (index > 0) {
              // Get the previous lesson from the already filtered moduleLessons array
              const filteredModuleLessons = (lessons || []).filter((l) => l.module_id === module.id);
              const prevLesson = filteredModuleLessons[index - 1];
              const prevLessonProgress = progressMap.get(prevLesson.id);
              is_accessible = prevLessonProgress?.completed || false;
            } else {
              // First lesson in module is always accessible
              is_accessible = true;
            }
          } else {
            // In all_access mode (or undefined/null), all lessons are accessible
            is_accessible = true;
          }

          if (!completed) {
            allLessonsCompleted = false;
          }

          // Parse files from JSONB
          const files = Array.isArray(lesson.files) ? lesson.files : [];

          return {
            ...lesson,
            files,
            completed,
            completed_at,
            is_accessible,
            quiz: lesson.type === "quiz" ? quizzesMap.get(lesson.id) : undefined,
          };
        });

      return {
        ...module,
        lessons: moduleLessons,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: modulesWithLessons,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in GET /api/courses/:id/modules:", error);
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
