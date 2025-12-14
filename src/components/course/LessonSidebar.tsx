import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock, ArrowLeft } from "lucide-react";

interface LessonWithProgress {
  id: string;
  title: string;
  order_index: number;
  completed: boolean;
  is_accessible: boolean;
}

interface CourseProgress {
  completed: number;
  total: number;
  percentage: number;
}

interface LessonSidebarProps {
  courseId: string;
  courseTitle: string;
  currentLessonId: string;
  lessons: LessonWithProgress[];
  progress: CourseProgress;
  lessonAccessMode: "sequential" | "all_access";
}

export function LessonSidebar({
  courseId,
  courseTitle,
  currentLessonId,
  lessons,
  progress,
  lessonAccessMode,
}: LessonSidebarProps) {
  const navigateToLesson = (lessonId: string, isAccessible: boolean) => {
    if (!isAccessible) return;
    window.location.href = `/courses/${courseId}/lessons/${lessonId}`;
  };

  return (
    <aside className="w-80 h-screen sticky top-0 bg-slate-800/50 border-r border-white/10 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <Button
          onClick={() => (window.location.href = `/courses/${courseId}`)}
          variant="ghost"
          className="text-gray-400 hover:text-white mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Wróć do kursu
        </Button>
        <h2 className="text-white font-bold text-lg line-clamp-2">{courseTitle}</h2>
      </div>

      {/* Progress */}
      <div className="p-6 border-b border-white/10">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-gray-400">Postęp kursu</span>
          <span className="text-white font-semibold">{progress.percentage}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-400 text-center">
          {progress.completed} / {progress.total} lekcji ukończone
        </div>
      </div>

      {/* Sequential Mode Info */}
      {lessonAccessMode === "sequential" && (
        <div className="px-6 py-3 bg-blue-500/10 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs text-blue-400">
            <Lock className="w-3 h-3" />
            <span>Tryb sekwencyjny aktywny</span>
          </div>
        </div>
      )}

      {/* Lessons List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {lessons.map((lesson, idx) => {
          const isCurrent = lesson.id === currentLessonId;
          const isAccessible = lesson.is_accessible;
          const isCompleted = lesson.completed;

          return (
            <button
              key={lesson.id}
              onClick={() => navigateToLesson(lesson.id, isAccessible)}
              disabled={!isAccessible}
              className={`w-full p-3 rounded-lg text-left transition-all ${
                isCurrent
                  ? "bg-blue-600/20 border-2 border-blue-500/50"
                  : isAccessible
                    ? "bg-slate-700/30 border border-white/5 hover:border-blue-500/30 hover:bg-slate-700/50"
                    : "bg-slate-700/10 border border-white/5 opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Icon/Number */}
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 font-semibold text-sm ${
                    isCompleted
                      ? "bg-green-600 text-white"
                      : isAccessible
                        ? "bg-blue-600/20 text-blue-400"
                        : "bg-slate-700 text-gray-500"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isAccessible ? (
                    idx + 1
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <span
                    className={`font-medium text-sm line-clamp-2 ${
                      isAccessible ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {lesson.title}
                  </span>
                  {isCurrent && (
                    <span className="text-xs text-blue-400 mt-1 block">← Jesteś tutaj</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
