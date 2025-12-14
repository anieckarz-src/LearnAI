import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
  FileText,
  Download,
  Award,
  TrendingUp,
  Play,
} from "lucide-react";
import { VideoPlayer } from "./VideoPlayer";
import type { Lesson, LessonMaterial } from "@/types";

interface LessonWithProgress extends Lesson {
  completed?: boolean;
  is_accessible?: boolean;
  video_url?: string | null;
}

interface QuizWithAttempts {
  id: string;
  title: string;
  questions: any[];
  passing_score: number;
  max_attempts: number | null;
  user_attempts_count: number;
  user_best_score: number;
  user_has_passed: boolean;
  can_attempt: boolean;
}

interface LessonContentProps {
  lesson: LessonWithProgress;
  courseId: string;
  courseTitle: string;
  quizzes?: QuizWithAttempts[];
  isCompleted: boolean;
  previousLesson?: LessonWithProgress | null;
  nextLesson?: LessonWithProgress | null;
  onToggleCompletion?: () => Promise<void>;
}

export function LessonContent({
  lesson,
  courseId,
  courseTitle,
  quizzes = [],
  isCompleted: initialCompleted,
  previousLesson,
  nextLesson,
  onToggleCompletion,
}: LessonContentProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleCompletion = async () => {
    if (!onToggleCompletion) {
      // Fallback API call
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
            lesson_id: lesson.id,
            course_id: courseId,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Nie udało się zaktualizować postępu");
        }

        setIsCompleted(!isCompleted);
        // Reload page to update sidebar
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (err) {
        console.error("Error toggling completion:", err);
        setError(err instanceof Error ? err.message : "Wystąpił błąd");
      } finally {
        setLoading(false);
      }
    } else {
      await onToggleCompletion();
      setIsCompleted(!isCompleted);
    }
  };

  const navigateToLesson = (lessonId: string | undefined) => {
    if (!lessonId) return;
    window.location.href = `/courses/${courseId}/lessons/${lessonId}`;
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Lesson Header */}
        <div className="space-y-2">
          <p className="text-blue-400 text-sm">{courseTitle}</p>
          <h1 className="text-white text-3xl md:text-4xl font-bold">{lesson.title}</h1>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-white/20 text-gray-300">
              Lekcja {lesson.order_index + 1}
            </Badge>
            {isCompleted && (
              <Badge className="bg-green-600 text-white">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Ukończona
              </Badge>
            )}
          </div>
        </div>

        {/* Video Player */}
        {lesson.video_url && (
          <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <VideoPlayer videoUrl={lesson.video_url} title={lesson.title} />
            </CardContent>
          </Card>
        )}

        {/* Lesson Content */}
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Treść lekcji
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lesson.content ? (
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: lesson.content }}
              />
            ) : (
              <p className="text-gray-400">Brak treści lekcji</p>
            )}
          </CardContent>
        </Card>

        {/* Materials */}
        {lesson.materials && lesson.materials.length > 0 && (
          <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Download className="w-5 h-5" />
                Materiały do pobrania
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lesson.materials.map((material: LessonMaterial) => (
                  <a
                    key={material.id}
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-white/10 hover:border-blue-500/30 hover:bg-slate-700/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-blue-600/20">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{material.name}</p>
                        <p className="text-xs text-gray-400">
                          {material.type.toUpperCase()} • {(material.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-gray-400" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quizzes */}
        {quizzes.length > 0 && (
          <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="w-5 h-5" />
                Quizy do tej lekcji
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      quiz.user_has_passed
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-white/10 bg-slate-700/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-white font-medium text-lg">{quiz.title}</h3>
                          {quiz.user_has_passed && (
                            <Badge className="bg-green-600 text-white">✓ Zaliczony</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
                          <div>Pytań: {quiz.questions.length}</div>
                          <div>Próg: {quiz.passing_score}%</div>
                          {quiz.max_attempts && <div>Max. prób: {quiz.max_attempts}</div>}
                          {quiz.user_attempts_count > 0 && (
                            <>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Prób: {quiz.user_attempts_count}
                                {quiz.max_attempts && ` / ${quiz.max_attempts}`}
                              </div>
                              <div className="flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                Najlepszy: {quiz.user_best_score}%
                              </div>
                            </>
                          )}
                        </div>
                        {!quiz.can_attempt && (
                          <p className="text-sm text-red-400">Wykorzystano wszystkie próby</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {quiz.user_attempts_count > 0 && (
                          <Button
                            onClick={() => (window.location.href = `/quizzes/${quiz.id}/attempts`)}
                            variant="outline"
                            size="sm"
                            className="border-white/10 text-gray-300"
                          >
                            Historia
                          </Button>
                        )}
                        {quiz.can_attempt && (
                          <Button
                            onClick={() => (window.location.href = `/quizzes/${quiz.id}/take`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            size="sm"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            {quiz.user_attempts_count > 0 ? "Spróbuj ponownie" : "Rozpocznij quiz"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completion Button */}
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleToggleCompletion}
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
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 pb-8">
          {previousLesson && previousLesson.is_accessible ? (
            <Button
              onClick={() => navigateToLesson(previousLesson.id)}
              variant="outline"
              className="border-white/10 text-gray-300 hover:text-white hover:border-blue-500/30"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Poprzednia lekcja
            </Button>
          ) : (
            <div />
          )}

          {nextLesson && nextLesson.is_accessible ? (
            <Button
              onClick={() => navigateToLesson(nextLesson.id)}
              className="bg-blue-600 hover:bg-blue-700 text-white ml-auto"
            >
              Następna lekcja
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : nextLesson && !nextLesson.is_accessible ? (
            <Button disabled className="bg-slate-700 text-gray-400 ml-auto cursor-not-allowed">
              Następna lekcja (zablokowana)
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <div />
          )}
        </div>
      </div>

      <style>{`
        .prose {
          color: #e2e8f0;
        }
        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4,
        .prose h5,
        .prose h6 {
          color: #ffffff;
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .prose h1 {
          font-size: 2em;
        }
        .prose h2 {
          font-size: 1.5em;
        }
        .prose h3 {
          font-size: 1.25em;
        }
        .prose p {
          margin-bottom: 1em;
          line-height: 1.7;
        }
        .prose a {
          color: #60a5fa;
          text-decoration: underline;
        }
        .prose a:hover {
          color: #93c5fd;
        }
        .prose ul,
        .prose ol {
          margin: 1em 0;
          padding-left: 1.5em;
        }
        .prose li {
          margin: 0.5em 0;
        }
        .prose code {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-size: 0.9em;
        }
        .prose pre {
          background-color: rgba(0, 0, 0, 0.3);
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
        }
        .prose pre code {
          background-color: transparent;
          padding: 0;
        }
        .prose blockquote {
          border-left: 4px solid #60a5fa;
          padding-left: 1em;
          margin: 1em 0;
          color: #cbd5e1;
          font-style: italic;
        }
        .prose table {
          width: 100%;
          border-collapse: collapse;
          margin: 1em 0;
        }
        .prose th,
        .prose td {
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.5em;
        }
        .prose th {
          background-color: rgba(255, 255, 255, 0.05);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
