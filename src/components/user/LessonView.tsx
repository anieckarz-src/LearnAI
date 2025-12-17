import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, List, Lock, Loader2 } from "lucide-react";

interface LessonViewProps {
  lessonId: string;
  courseId: string;
  lessonTitle: string;
  lessonContent: string | null;
  lessonOrderIndex: number;
  courseTitle: string;
  lessonAccessMode: "sequential" | "all_access";
}

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
}

interface Lesson {
  id: string;
  title: string;
  order_index: number;
  completed: boolean;
  is_accessible: boolean;
}

export function LessonView({
  lessonId,
  courseId,
  lessonTitle,
  lessonContent,
  lessonOrderIndex,
  courseTitle,
  lessonAccessMode,
}: LessonViewProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [courseProgress, setCourseProgress] = useState({ completed: 0, total: 0, percentage: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLessonProgress();
    fetchAllLessons();
  }, [lessonId, courseId]);

  const fetchLessonProgress = async () => {
    try {
      const response = await fetch(`/api/user/lesson-progress?course_id=${courseId}`);
      const result = await response.json();

      if (result.success) {
        const progress = result.data.find((p: LessonProgress) => p.lesson_id === lessonId);
        setIsCompleted(progress?.completed || false);
      }
    } catch (err) {
      console.error("Error fetching lesson progress:", err);
    }
  };

  const fetchAllLessons = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      const result = await response.json();

      if (result.success && result.data.lessons) {
        const progressMap = new Map(
          result.data.lesson_progress?.map((p: LessonProgress) => [p.lesson_id, p.completed]) || []
        );

        const lessonsWithStatus = result.data.lessons.map((lesson: any, index: number) => {
          const completed = progressMap.get(lesson.id) || false;

          // Check if lesson is accessible
          let isAccessible = true;
          if (lessonAccessMode === "sequential" && index > 0) {
            // Check if all previous lessons are completed
            const previousLessons = result.data.lessons.slice(0, index);
            isAccessible = previousLessons.every((pl: any) => progressMap.get(pl.id) === true);
          }

          return {
            id: lesson.id,
            title: lesson.title,
            order_index: lesson.order_index,
            completed,
            is_accessible: isAccessible,
          };
        });

        setAllLessons(lessonsWithStatus);

        // Calculate progress
        const completed = lessonsWithStatus.filter((l: Lesson) => l.completed).length;
        const total = lessonsWithStatus.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        setCourseProgress({ completed, total, percentage });
      }
    } catch (err) {
      console.error("Error fetching lessons:", err);
    }
  };

  const toggleCompletion = async () => {
    setLoading(true);
    setError(null);

    try {
      const method = isCompleted ? "DELETE" : "POST";
      const response = await fetch("/api/user/lesson-progress", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lesson_id: lessonId,
          course_id: courseId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Nie udało się zaktualizować postępu");
      }

      setIsCompleted(!isCompleted);
      // Refresh lessons to update accessibility
      await fetchAllLessons();
    } catch (err) {
      console.error("Error toggling completion:", err);
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  };

  const navigateToLesson = (lesson: Lesson) => {
    if (!lesson.is_accessible) {
      return;
    }
    window.location.href = `/courses/${courseId}/lessons/${lesson.id}`;
  };

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <>
      {/* Chat Widget with lesson context */}
      <ChatWidget contextType="lesson" contextId={lessonId} contextTitle={lessonTitle} />

      <div className="space-y-6">
        {/* Progress bar */}
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Postęp kursu</span>
              <span className="text-sm font-semibold text-white">
                {courseProgress.completed} / {courseProgress.total} lekcji
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-500"
                style={{ width: `${courseProgress.percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={() => (window.location.href = `/courses/${courseId}`)}
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Wróć do kursu
          </Button>

          <div className="flex items-center gap-2">
            {previousLesson && previousLesson.is_accessible && (
              <Button
                onClick={() => navigateToLesson(previousLesson)}
                variant="outline"
                className="border-white/10 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Poprzednia
              </Button>
            )}
            {nextLesson && nextLesson.is_accessible && (
              <Button onClick={() => navigateToLesson(nextLesson)} className="bg-blue-600 hover:bg-blue-700 text-white">
                Następna
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Lesson content */}
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <div className="space-y-2">
              <p className="text-blue-400 text-sm">{courseTitle}</p>
              <CardTitle className="text-white text-3xl">{lessonTitle}</CardTitle>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-white/20 text-gray-300">
                  Lekcja {lessonOrderIndex + 1}
                </Badge>
                {isCompleted && (
                  <Badge className="bg-green-600 text-white">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Ukończona
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {lessonContent ? (
              <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: lessonContent }} />
            ) : (
              <p className="text-gray-400">Brak treści lekcji</p>
            )}

            {error && (
              <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-white/10">
              <Button
                onClick={toggleCompletion}
                disabled={loading}
                className={`w-full py-6 text-lg font-semibold ${
                  isCompleted
                    ? "bg-slate-600 hover:bg-slate-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Aktualizowanie...
                  </>
                ) : isCompleted ? (
                  <>
                    <Circle className="w-5 h-5 mr-2" />
                    Oznacz jako nieukończone
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Oznacz jako ukończone
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lessons list */}
        {allLessons.length > 0 && (
          <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <List className="w-5 h-5" />
                Wszystkie lekcje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allLessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => navigateToLesson(lesson)}
                    disabled={!lesson.is_accessible}
                    className={`w-full p-4 rounded-lg text-left transition-all ${
                      lesson.id === lessonId
                        ? "bg-blue-600/20 border-2 border-blue-500/50"
                        : lesson.is_accessible
                          ? "bg-slate-700/30 border border-white/5 hover:border-blue-500/30 hover:bg-slate-700/50"
                          : "bg-slate-700/10 border border-white/5 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            lesson.completed
                              ? "bg-green-600"
                              : lesson.is_accessible
                                ? "bg-blue-600/20 text-blue-400"
                                : "bg-slate-700"
                          } font-semibold text-sm`}
                        >
                          {lesson.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          ) : lesson.is_accessible ? (
                            index + 1
                          ) : (
                            <Lock className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <span className={`font-medium ${lesson.is_accessible ? "text-white" : "text-gray-500"}`}>
                          {lesson.title}
                        </span>
                      </div>
                      {lesson.id === lessonId && <Badge className="bg-blue-600 text-white">Obecna</Badge>}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
