import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

export interface LessonContext {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  moduleTitle?: string;
}

export interface CourseContext {
  id: string;
  title: string;
  description?: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  currentModule?: string;
  modules?: ModuleContext[];
}

export interface ModuleContext {
  id: string;
  title: string;
  lessonsCount: number;
  completedLessonsCount: number;
}

export interface UserProgressContext {
  totalCoursesEnrolled: number;
  totalLessonsCompleted: number;
  averageQuizScore: number;
  recentActivity: string[];
}

export interface CombinedContext {
  lesson?: LessonContext;
  course?: CourseContext;
  userProgress?: UserProgressContext;
}

interface BuildContextOptions {
  lessonId?: string;
  courseId?: string;
  includeUserProgress?: boolean;
}

/**
 * Strips HTML tags from content and limits length
 */
function stripHtml(html: string, maxLength = 3000): string {
  if (!html) return "";

  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Remove extra whitespace
  text = text.replace(/\s+/g, " ").trim();

  // Limit length
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + "...";
  }

  return text;
}

/**
 * Builds context for a specific lesson
 */
export async function buildLessonContext(
  supabase: SupabaseClient<Database>,
  lessonId: string,
  userId: string
): Promise<LessonContext | null> {
  try {
    // Get lesson with module info
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select(
        `
        id,
        title,
        content,
        module_id,
        modules (
          title
        )
      `
      )
      .eq("id", lessonId)
      .single();

    if (lessonError || !lesson) {
      console.error("Error fetching lesson:", lessonError);
      return null;
    }

    // Check if lesson is completed
    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("completed")
      .eq("lesson_id", lessonId)
      .eq("user_id", userId)
      .maybeSingle();

    return {
      id: lesson.id,
      title: lesson.title,
      content: stripHtml(lesson.content || ""),
      completed: progress?.completed || false,
      moduleTitle: (lesson.modules as any)?.title,
    };
  } catch (error) {
    console.error("Error building lesson context:", error);
    return null;
  }
}

/**
 * Builds context for a course
 */
export async function buildCourseContext(
  supabase: SupabaseClient<Database>,
  courseId: string,
  userId: string
): Promise<CourseContext | null> {
  try {
    // Get course info
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, description")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      console.error("Error fetching course:", courseError);
      return null;
    }

    // Get modules with lessons
    const { data: modules, error: modulesError } = await supabase
      .from("modules")
      .select(
        `
        id,
        title,
        order_index,
        lessons (
          id
        )
      `
      )
      .eq("course_id", courseId)
      .order("order_index");

    if (modulesError) {
      console.error("Error fetching modules:", modulesError);
    }

    // Get all lesson IDs for this course
    const lessonIds = modules?.flatMap((m) => (m.lessons as any[]).map((l) => l.id)) || [];

    // Get progress for all lessons
    const { data: progressData } = await supabase
      .from("lesson_progress")
      .select("lesson_id, completed")
      .eq("user_id", userId)
      .in("lesson_id", lessonIds);

    const completedLessonIds = new Set(progressData?.filter((p) => p.completed).map((p) => p.lesson_id) || []);

    // Build module contexts
    const moduleContexts: ModuleContext[] =
      modules?.map((module) => {
        const moduleLessons = (module.lessons as any[]) || [];
        const completedInModule = moduleLessons.filter((l) => completedLessonIds.has(l.id)).length;

        return {
          id: module.id,
          title: module.title,
          lessonsCount: moduleLessons.length,
          completedLessonsCount: completedInModule,
        };
      }) || [];

    const totalLessons = lessonIds.length;
    const completedLessons = completedLessonIds.size;
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      id: course.id,
      title: course.title,
      description: course.description || undefined,
      totalLessons,
      completedLessons,
      progressPercentage,
      modules: moduleContexts,
    };
  } catch (error) {
    console.error("Error building course context:", error);
    return null;
  }
}

/**
 * Builds user progress context
 */
export async function buildUserProgressContext(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseId?: string
): Promise<UserProgressContext | null> {
  try {
    // Get enrolled courses count
    const { count: enrolledCount } = await supabase
      .from("course_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get completed lessons count
    const { count: completedCount } = await supabase
      .from("lesson_progress")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("completed", true);

    // Get average quiz score
    const { data: quizAttempts } = await supabase
      .from("quiz_attempts")
      .select("score")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(10);

    const avgScore =
      quizAttempts && quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length)
        : 0;

    // Get recent activity (last completed lessons)
    const { data: recentLessons } = await supabase
      .from("lesson_progress")
      .select(
        `
        completed_at,
        lessons (
          title
        )
      `
      )
      .eq("user_id", userId)
      .eq("completed", true)
      .order("completed_at", { ascending: false })
      .limit(5);

    const recentActivity =
      recentLessons?.filter((l) => l.lessons && (l.lessons as any).title).map((l) => (l.lessons as any).title) || [];

    return {
      totalCoursesEnrolled: enrolledCount || 0,
      totalLessonsCompleted: completedCount || 0,
      averageQuizScore: avgScore,
      recentActivity,
    };
  } catch (error) {
    console.error("Error building user progress context:", error);
    return null;
  }
}

/**
 * Builds combined context for the chatbot
 */
export async function buildCombinedContext(
  supabase: SupabaseClient<Database>,
  userId: string,
  options: BuildContextOptions = {}
): Promise<CombinedContext> {
  const context: CombinedContext = {};

  // Build lesson context if lessonId provided
  if (options.lessonId) {
    context.lesson = await buildLessonContext(supabase, options.lessonId, userId);
  }

  // Build course context if courseId provided
  if (options.courseId) {
    context.course = await buildCourseContext(supabase, options.courseId, userId);
  }

  // Build user progress context if requested
  if (options.includeUserProgress) {
    context.userProgress = await buildUserProgressContext(supabase, userId, options.courseId);
  }

  return context;
}

/**
 * Formats context into a system prompt string
 */
export function formatContextForPrompt(context: CombinedContext): string {
  const parts: string[] = [];

  if (context.lesson) {
    parts.push(`[KONTEKST LEKCJI]`);
    parts.push(`Tytuł: ${context.lesson.title}`);
    if (context.lesson.moduleTitle) {
      parts.push(`Moduł: ${context.lesson.moduleTitle}`);
    }
    parts.push(`Status: ${context.lesson.completed ? "ukończona" : "w trakcie"}`);
    if (context.lesson.content) {
      parts.push(`\nTreść lekcji:\n${context.lesson.content}`);
    }
    parts.push("");
  }

  if (context.course) {
    parts.push(`[KONTEKST KURSU]`);
    parts.push(`Kurs: ${context.course.title}`);
    if (context.course.description) {
      parts.push(`Opis: ${context.course.description}`);
    }
    parts.push(
      `Postęp: ${context.course.completedLessons}/${context.course.totalLessons} lekcji (${context.course.progressPercentage}%)`
    );
    if (context.course.modules && context.course.modules.length > 0) {
      parts.push(`\nModuły:`);
      context.course.modules.forEach((module) => {
        parts.push(`- ${module.title}: ${module.completedLessonsCount}/${module.lessonsCount} ukończonych`);
      });
    }
    parts.push("");
  }

  if (context.userProgress) {
    parts.push(`[POSTĘPY UŻYTKOWNIKA]`);
    parts.push(`Zapisane kursy: ${context.userProgress.totalCoursesEnrolled}`);
    parts.push(`Ukończone lekcje: ${context.userProgress.totalLessonsCompleted}`);
    if (context.userProgress.averageQuizScore > 0) {
      parts.push(`Średni wynik z quizów: ${context.userProgress.averageQuizScore}%`);
    }
    if (context.userProgress.recentActivity.length > 0) {
      parts.push(`\nOstatnio ukończone lekcje:`);
      context.userProgress.recentActivity.slice(0, 3).forEach((title) => {
        parts.push(`- ${title}`);
      });
    }
    parts.push("");
  }

  return parts.join("\n");
}
