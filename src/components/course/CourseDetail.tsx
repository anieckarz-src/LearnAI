import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PurchaseButton } from "./PurchaseButton";
import { ModulesList } from "./ModulesList";
import { ModulesPreview } from "./ModulesPreview";
import type { Course, ModuleWithLessons, CoursePreviewData } from "@/types";
import { BookOpen, Calendar, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CourseDetailProps {
  courseId: string;
}

interface CourseData extends Course {
  is_enrolled: boolean;
  lesson_count?: number;
}

export function CourseDetail({ courseId }: CourseDetailProps) {
  const [course, setCourse] = useState<CourseData | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [preview, setPreview] = useState<CoursePreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);
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

      // If user is enrolled, fetch modules; otherwise fetch preview
      if (result.data.is_enrolled) {
        await fetchModules();
      } else {
        await fetchPreview();
      }
    } catch (err) {
      console.error("Error fetching course:", err);
      setError("Wystąpił błąd podczas pobierania kursu");
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      setLoadingModules(true);
      const response = await fetch(`/api/courses/${courseId}/modules`);
      const result = await response.json();

      if (result.success) {
        setModules(result.data);
      }
    } catch (err) {
      console.error("Error fetching modules:", err);
    } finally {
      setLoadingModules(false);
    }
  };

  const fetchPreview = async () => {
    try {
      setLoadingModules(true);
      const response = await fetch(`/api/courses/${courseId}/preview`);
      const result = await response.json();

      if (result.success) {
        setPreview(result.data);
      }
    } catch (err) {
      console.error("Error fetching preview:", err);
    } finally {
      setLoadingModules(false);
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // Calculate progress from modules
  const calculateProgress = () => {
    if (modules.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    let completed = 0;
    let total = 0;

    modules.forEach((module) => {
      module.lessons.forEach((lesson) => {
        total++;
        if (lesson.completed) {
          completed++;
        }
      });
    });

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const progress = calculateProgress();

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
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(course.created_at).toLocaleDateString("pl-PL")}</span>
                </div>
                {course.lesson_count !== undefined && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.lesson_count} lekcji</span>
                  </div>
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

          {/* Enroll button */}
          {!course.is_enrolled && (
            <div className="max-w-md">
              <PurchaseButton courseId={course.id} isEnrolled={course.is_enrolled} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modules and Lessons section */}
      {course.is_enrolled ? (
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-2xl">Program kursu</CardTitle>
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
            {loadingModules ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : modules.length > 0 ? (
              <ModulesList modules={modules} courseId={courseId} />
            ) : (
              <div className="text-center py-8 text-gray-400">Brak modułów w tym kursie</div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Program kursu</CardTitle>
            <p className="text-gray-400 text-sm mt-2">Zobacz czego się nauczysz w tym kursie</p>
          </CardHeader>
          <CardContent>
            {loadingModules ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : preview ? (
              <ModulesPreview preview={preview} />
            ) : (
              <div className="text-center py-12">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Zapisz się na kurs, aby uzyskać dostęp do wszystkich lekcji</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
