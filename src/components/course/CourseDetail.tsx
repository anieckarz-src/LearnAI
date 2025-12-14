import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PurchaseButton } from "./PurchaseButton";
import type { Course, User, Lesson } from "@/types";
import { BookOpen, User as UserIcon, Calendar, ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CourseDetailProps {
  courseId: string;
}

interface CourseData extends Course {
  instructor: User;
  has_access: boolean;
  is_enrolled: boolean;
  lessons: Lesson[] | null;
  lesson_progress?: Array<{ lesson_id: string; completed: boolean; completed_at: string | null }> | null;
  lesson_access_mode?: "sequential" | "all_access";
}

export function CourseDetail({ courseId }: CourseDetailProps) {
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Nie udało się pobrać kursu");
        return;
      }

      setCourse(result.data);
    } catch (err) {
      console.error("Error fetching course:", err);
      setError("Wystąpił błąd podczas pobierania kursu");
    } finally {
      setLoading(false);
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // Calculate progress
  const calculateProgress = () => {
    if (!course?.lessons || !course.lesson_progress) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const progressMap = new Map(course.lesson_progress.map((p) => [p.lesson_id, p.completed]));
    const completed = course.lessons.filter((l) => progressMap.get(l.id) === true).length;
    const total = course.lessons.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  };

  // Check if lesson is accessible based on sequential mode
  const isLessonAccessible = (lessonIndex: number) => {
    if (!course?.lessons || !course.lesson_progress) {
      return true;
    }

    // If all_access mode, all lessons are accessible
    if (course.lesson_access_mode === "all_access" || !course.lesson_access_mode) {
      return true;
    }

    // First lesson is always accessible
    if (lessonIndex === 0) {
      return true;
    }

    // For sequential mode, check if all previous lessons are completed
    const progressMap = new Map(course.lesson_progress.map((p) => [p.lesson_id, p.completed]));
    const previousLessons = course.lessons.slice(0, lessonIndex);

    return previousLessons.every((lesson) => progressMap.get(lesson.id) === true);
  };

  // Check if lesson is completed
  const isLessonCompleted = (lessonId: string) => {
    if (!course?.lesson_progress) {
      return false;
    }
    const progress = course.lesson_progress.find((p) => p.lesson_id === lessonId);
    return progress?.completed || false;
  };

  const progress = course ? calculateProgress() : { completed: 0, total: 0, percentage: 0 };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardContent className="text-center py-12">
          <p className="text-red-400 text-lg">{error || "Kurs nie został znaleziony"}</p>
          <Button onClick={() => (window.location.href = "/courses")} className="mt-4">
            Wróć do listy kursów
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => (window.location.href = "/courses")}
        className="text-gray-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Wróć do listy kursów
      </Button>

      {/* Course Header */}
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm overflow-hidden">
        {course.thumbnail_url && (
          <div className="relative h-64 md:h-96 bg-slate-700 overflow-hidden">
            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          </div>
        )}

        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-3xl md:text-4xl font-bold text-white mb-4">{course.title}</CardTitle>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  <span>{course.instructor.full_name || course.instructor.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(course.created_at).toLocaleDateString("pl-PL")}</span>
                </div>
                {course.lessons && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.lessons.length} lekcji</span>
                  </div>
                )}
              </div>

              {/* Price badge */}
              <div className="mb-4">
                {course.price !== null && course.price !== undefined && course.price > 0 ? (
                  <Badge className="bg-green-600 text-white text-lg px-4 py-1">
                    {course.price.toFixed(2)} PLN
                  </Badge>
                ) : (
                  <Badge className="bg-blue-600 text-white text-lg px-4 py-1">Darmowy</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Description */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-3">Opis kursu</h3>
            <div className="text-gray-300 leading-relaxed whitespace-pre-line">
              {course.description ? stripHtml(course.description) : "Brak opisu"}
            </div>
          </div>

          {/* Purchase button */}
          <div className="max-w-md">
            <PurchaseButton
              courseId={course.id}
              price={course.price}
              isEnrolled={course.is_enrolled}
              hasAccess={course.has_access}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lessons section */}
      {course.has_access && course.lessons ? (
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-2xl">Lekcje</CardTitle>
              {progress.total > 0 && (
                <Badge className="bg-blue-600 text-white px-4 py-2">
                  {progress.completed} / {progress.total} ukończone
                </Badge>
              )}
            </div>
            {progress.total > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-gray-400">Twój postęp</span>
                  <span className="text-white font-semibold">{progress.percentage}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-500"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )}
            {course.lesson_access_mode === "sequential" && (
              <div className="mt-4 flex items-center gap-2 text-sm text-blue-400 bg-blue-500/10 px-3 py-2 rounded-lg">
                <Lock className="w-4 h-4" />
                <span>Tryb sekwencyjny - lekcje odblokowują się po kolei</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {course.lessons.map((lesson, index) => {
                const isAccessible = isLessonAccessible(index);
                const isCompleted = isLessonCompleted(lesson.id);

                return isAccessible ? (
                  <a
                    key={lesson.id}
                    href={`/courses/${course.id}/lessons/${lesson.id}`}
                    className="block p-4 rounded-lg bg-slate-700/30 border border-white/5 hover:border-blue-500/30 hover:bg-slate-700/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                            isCompleted
                              ? "bg-green-600 text-white"
                              : "bg-blue-600/20 text-blue-400"
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                        </div>
                        <span className="text-white font-medium">{lesson.title}</span>
                      </div>
                      {isCompleted && (
                        <Badge className="bg-green-600 text-white">Ukończona</Badge>
                      )}
                    </div>
                  </a>
                ) : (
                  <div
                    key={lesson.id}
                    className="block p-4 rounded-lg bg-slate-700/10 border border-white/5 opacity-50 cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-gray-500 font-semibold text-sm">
                          <Lock className="w-4 h-4" />
                        </div>
                        <span className="text-gray-500 font-medium">{lesson.title}</span>
                      </div>
                      <Badge className="bg-slate-700 text-gray-400">Zablokowana</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        !course.has_access && (
          <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                Kup kurs, aby uzyskać dostęp do {course.lessons?.length || "wszystkich"} lekcji
              </p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
