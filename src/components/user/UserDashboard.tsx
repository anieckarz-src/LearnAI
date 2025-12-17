import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, ArrowRight, TrendingUp, Award, Target, Zap } from "lucide-react";
import { QuickActions } from "./QuickActions";

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

  // Calculate statistics
  const stats = {
    totalCourses: courses.length,
    completedCourses: courses.filter((c) => c.progress_percentage === 100).length,
    totalLessons: courses.reduce((sum, c) => sum + c.total_lessons, 0),
    completedLessons: courses.reduce((sum, c) => sum + c.completed_lessons, 0),
    averageProgress:
      courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + c.progress_percentage, 0) / courses.length) : 0,
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
      {/* Statistics Overview - Compact Admin Style */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <BookOpen className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-0.5">{stats.totalCourses}</div>
            <p className="text-xs font-medium text-gray-300 mb-1">Kursy</p>
            <p className="text-xs text-gray-400">{stats.completedCourses} ukończone</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                <Target className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-0.5">{stats.completedLessons}</div>
            <p className="text-xs font-medium text-gray-300 mb-1">Lekcje</p>
            <p className="text-xs text-gray-400">z {stats.totalLessons} dostępnych</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                <TrendingUp className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-0.5">{stats.averageProgress}%</div>
            <p className="text-xs font-medium text-gray-300 mb-1">Średni postęp</p>
            <p className="text-xs text-gray-400">we wszystkich kursach</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                <Award className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-0.5">{stats.completedCourses}</div>
            <p className="text-xs font-medium text-gray-300 mb-1">Ukończone</p>
            <p className="text-xs text-gray-400">
              {stats.completedCourses > 0 ? "Świetna robota!" : "Zacznij naukę!"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-white">Moje Kursy</h2>
          <p className="text-sm text-gray-400 mt-0.5">Kontynuuj naukę tam, gdzie skończyłeś</p>
        </div>
        <Button
          onClick={() => (window.location.href = "/courses")}
          variant="outline"
          className="border-white/10 text-gray-300 hover:text-white hover:border-blue-500/50 hover:bg-blue-600/10 transition-all"
        >
          Przeglądaj katalog
        </Button>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {courses.map((course) => (
          <Card
            key={course.id}
            className="bg-slate-800/50 border-white/10 backdrop-blur-sm hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden group"
          >
            {course.thumbnail_url && (
              <div className="relative h-40 bg-slate-700 overflow-hidden">
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                
                {/* Progress Bar Overlay */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-800/60 rounded-full h-1.5 overflow-hidden backdrop-blur-sm border border-white/10">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-500"
                        style={{ width: `${course.progress_percentage}%` }}
                      />
                    </div>
                    <span className="text-white font-semibold text-xs bg-slate-900/90 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">
                      {course.progress_percentage}%
                    </span>
                  </div>
                </div>
                
                {/* Completed Badge */}
                {course.progress_percentage === 100 && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 text-white shadow-lg">
                      <Award className="w-3 h-3 mr-1" />
                      Ukończony
                    </Badge>
                  </div>
                )}
              </div>
            )}

            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg font-semibold line-clamp-1 group-hover:text-blue-400 transition-colors">
                {course.title}
              </CardTitle>
              {course.description && (
                <p className="text-gray-400 text-sm line-clamp-2 mt-1.5">{stripHtml(course.description)}</p>
              )}
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Course Info */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>
                    {course.completed_lessons} / {course.total_lessons} lekcji
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(course.enrolled_at).toLocaleDateString("pl-PL")}</span>
                </div>
              </div>

              {/* Sequential Mode Badge */}
              {course.lesson_access_mode === "sequential" && course.progress_percentage < 100 && (
                <div className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1.5 rounded border border-blue-500/20">
                  <Zap className="w-3 h-3" />
                  <span>Sekwencyjny</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  onClick={() => handleContinueCourse(course)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all"
                  size="sm"
                >
                  {course.progress_percentage === 0
                    ? "Rozpocznij"
                    : course.progress_percentage === 100
                      ? "Przejrzyj"
                      : "Kontynuuj"}
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
                <Button
                  onClick={() => (window.location.href = `/courses/${course.id}`)}
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-gray-300 hover:text-white hover:border-blue-500/50 hover:bg-blue-600/10"
                >
                  Szczegóły
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
