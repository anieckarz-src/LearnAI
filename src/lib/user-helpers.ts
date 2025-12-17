import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

/**
 * Generates a strong random password
 * @param length - Length of password (default: 16)
 * @returns Strong password with uppercase, lowercase, numbers, and special characters
 */
export function generateStrongPassword(length = 16): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  const allChars = uppercase + lowercase + numbers + special;

  let password = "";

  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

/**
 * Checks if a lesson is accessible to a user based on course access mode
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param courseId - Course ID
 * @param lessonId - Lesson ID
 * @returns true if lesson is accessible, false otherwise
 */
export async function isLessonAccessible(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseId: string,
  lessonId: string
): Promise<boolean> {
  try {
    // Get the lesson's order_index
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("order_index")
      .eq("id", lessonId)
      .eq("course_id", courseId)
      .single();

    if (lessonError || !lesson) {
      return false;
    }

    // Get course access mode
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("lesson_access_mode")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return false;
    }

    // If all_access mode, all lessons are accessible
    if (course.lesson_access_mode === "all_access") {
      return true;
    }

    // For sequential mode, check if previous lessons are completed
    // First lesson (order_index = 0) is always accessible
    if (lesson.order_index === 0) {
      return true;
    }

    // Get all previous lessons
    const { data: previousLessons, error: prevError } = await supabase
      .from("lessons")
      .select("id")
      .eq("course_id", courseId)
      .lt("order_index", lesson.order_index);

    if (prevError || !previousLessons) {
      return false;
    }

    // If no previous lessons, this lesson is accessible
    if (previousLessons.length === 0) {
      return true;
    }

    // Check if all previous lessons are completed
    const { data: completedProgress, error: progressError } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("completed", true)
      .in(
        "lesson_id",
        previousLessons.map((l) => l.id)
      );

    if (progressError) {
      return false;
    }

    // All previous lessons must be completed
    return (completedProgress?.length || 0) === previousLessons.length;
  } catch (error) {
    console.error("Error checking lesson accessibility:", error);
    return false;
  }
}

/**
 * Calculates course progress for a user
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param courseId - Course ID
 * @returns Object with total lessons, completed lessons, and percentage
 */
export async function calculateCourseProgress(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseId: string
): Promise<{ total: number; completed: number; percentage: number }> {
  try {
    // Get total lessons count
    const { count: totalLessons, error: totalError } = await supabase
      .from("lessons")
      .select("*", { count: "exact", head: true })
      .eq("course_id", courseId);

    if (totalError) {
      console.error("Error getting total lessons:", totalError);
      return { total: 0, completed: 0, percentage: 0 };
    }

    const total = totalLessons || 0;

    if (total === 0) {
      return { total: 0, completed: 0, percentage: 0 };
    }

    // Get completed lessons count
    const { count: completedLessons, error: completedError } = await supabase
      .from("lesson_progress")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("completed", true);

    if (completedError) {
      console.error("Error getting completed lessons:", completedError);
      return { total, completed: 0, percentage: 0 };
    }

    const completed = completedLessons || 0;
    const percentage = Math.round((completed / total) * 100);

    return { total, completed, percentage };
  } catch (error) {
    console.error("Error calculating course progress:", error);
    return { total: 0, completed: 0, percentage: 0 };
  }
}

/**
 * Gets the next incomplete lesson for a user in a course
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param courseId - Course ID
 * @returns Lesson ID of next incomplete lesson, or null if all completed
 */
export async function getNextIncompleteLesson(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseId: string
): Promise<string | null> {
  try {
    // Get all lessons for the course
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, order_index")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (lessonsError || !lessons || lessons.length === 0) {
      return null;
    }

    // Get completed lesson IDs
    const { data: completedProgress, error: progressError } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("completed", true);

    if (progressError) {
      return lessons[0].id; // Return first lesson if error
    }

    const completedLessonIds = new Set(completedProgress?.map((p) => p.lesson_id) || []);

    // Find first incomplete lesson
    for (const lesson of lessons) {
      if (!completedLessonIds.has(lesson.id)) {
        return lesson.id;
      }
    }

    // All lessons completed, return last lesson
    return lessons[lessons.length - 1].id;
  } catch (error) {
    console.error("Error getting next incomplete lesson:", error);
    return null;
  }
}

/**
 * Marks a lesson as completed for a user
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param lessonId - Lesson ID
 * @param courseId - Course ID
 * @returns true if successful, false otherwise
 */
export async function markLessonCompleted(
  supabase: SupabaseClient<Database>,
  userId: string,
  lessonId: string,
  courseId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from("lesson_progress").upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        course_id: courseId,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,lesson_id",
      }
    );

    if (error) {
      console.error("Error marking lesson as completed:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error marking lesson as completed:", error);
    return false;
  }
}

/**
 * Marks a lesson as incomplete for a user
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param lessonId - Lesson ID
 * @param courseId - Course ID
 * @returns true if successful, false otherwise
 */
export async function markLessonIncomplete(
  supabase: SupabaseClient<Database>,
  userId: string,
  lessonId: string,
  courseId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from("lesson_progress").upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        course_id: courseId,
        completed: false,
        completed_at: null,
      },
      {
        onConflict: "user_id,lesson_id",
      }
    );

    if (error) {
      console.error("Error marking lesson as incomplete:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error marking lesson as incomplete:", error);
    return false;
  }
}
