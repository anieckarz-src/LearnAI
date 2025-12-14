import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, ArrowRight, TrendingUp } from "lucide-react";

interface CourseWithProgress {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  status: string;
  lesson_access_mode: "sequential" | "all_access";
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
  enrolled_at: string;
  next_lesson_id: string | null;
}

export function UserDashboard() {
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/enrolled-courses");
      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Nie udało się pobrać kursów");
        return;
      }

      setCourses(result.data);
    } catch (err) {
      console.error("Error fetching enrolled courses:", err);
      setError("Wystąpił błąd podczas pobierania kursów");
    } finally {
      setLoading(false);
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handleContinueCourse = (course: CourseWithProgress) => {
    if (course.next_lesson_id) {
      window.location.href = `/courses/${course.id}/lessons/${course.next_lesson_id}`;
    } else {
      window.location.href = `/courses/${course.id}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardContent className="text-center py-12">
          <p className="text-red-400 text-lg">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (courses.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardContent className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Brak zapisanych kursów</h3>
          <p className="text-gray-400 mb-6">Nie jesteś jeszcze zapisany na żaden kurs</p>
          <Button onClick={() => (window.location.href = "/courses")} className="bg-blue-600 hover:bg-blue-700">
            Przeglądaj kursy
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Moje Kursy</h2>
          <p className="text-gray-400 mt-1">Kontynuuj naukę tam, gdzie skończyłeś</p>
        </div>
        <Badge className="bg-blue-600 text-white px-4 py-2 text-base">
          {courses.length} {courses.length === 1 ? "kurs" : "kursów"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="bg-slate-800/50 border-white/10 backdrop-blur-sm hover:border-blue-500/30 transition-all overflow-hidden group">
            {course.thumbnail_url && (
              <div className="relative h-48 bg-slate-700 overflow-hidden">
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-700/80 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-500"
                        style={{ width: `${course.progress_percentage}%` }}
                      />
                    </div>
                    <span className="text-white font-semibold text-sm bg-slate-900/80 px-2 py-1 rounded backdrop-blur-sm">
                      {course.progress_percentage}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-white text-xl group-hover:text-blue-400 transition-colors">
                  {course.title}
                </CardTitle>
                {course.progress_percentage === 100 && (
                  <Badge className="bg-green-600 text-white">Ukończony</Badge>
                )}
              </div>
              {course.description && (
                <p className="text-gray-400 text-sm line-clamp-2 mt-2">{stripHtml(course.description)}</p>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>
                    {course.completed_lessons} / {course.total_lessons} lekcji
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(course.enrolled_at).toLocaleDateString("pl-PL")}</span>
                </div>
              </div>

              {course.lesson_access_mode === "sequential" && (
                <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 px-3 py-2 rounded-lg">
                  <TrendingUp className="w-3 h-3" />
                  <span>Tryb sekwencyjny - lekcje odblokowują się po kolei</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => handleContinueCourse(course)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {course.progress_percentage === 0
                    ? "Rozpocznij kurs"
                    : course.progress_percentage === 100
                      ? "Przejrzyj kurs"
                      : "Kontynuuj naukę"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  onClick={() => (window.location.href = `/courses/${course.id}`)}
                  variant="outline"
                  className="border-white/10 text-gray-300 hover:text-white hover:border-white/30"
                >
                  Szczegóły
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/20 backdrop-blur-sm">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Szukasz nowych kursów?</h3>
              <p className="text-gray-400 text-sm">Odkryj pełną ofertę dostępnych kursów</p>
            </div>
            <Button
              onClick={() => (window.location.href = "/courses")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Przeglądaj katalog
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
