import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Course, CourseStatus, PaginatedResponse } from "@/types";
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, User, Calendar } from "lucide-react";

interface CourseWithInstructor extends Course {
  instructor: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

export function CoursesManagement() {
  const [courses, setCourses] = useState<CourseWithInstructor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CourseStatus | "">("");

  const limit = 12;

  // Helper function to strip HTML tags from description
  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  useEffect(() => {
    fetchCourses();
  }, [page, search, statusFilter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(`/api/admin/courses?${params}`);
      const result = await response.json();

      if (result.success) {
        setCourses(result.data.data);
        setTotal(result.data.total);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten kurs? Zostaną usunięte również wszystkie lekcje i quizy.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        fetchCourses();
      } else {
        alert(result.error || "Nie udało się usunąć kursu");
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Wystąpił błąd");
    }
  };

  const getStatusBadge = (status: CourseStatus) => {
    const variants: Record<CourseStatus, { variant: "default" | "secondary" | "warning"; label: string }> = {
      published: { variant: "default", label: "Opublikowany" },
      draft: { variant: "warning", label: "Szkic" },
      archived: { variant: "secondary", label: "Zarchiwizowany" },
    };

    const config = variants[status];

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div></div>
        <Button onClick={() => (window.location.href = "/admin/courses/new")} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Dodaj nowy kurs
        </Button>
      </div>

      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Filtruj kursy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Szukaj po tytule lub opisie..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as CourseStatus | "");
                setPage(1);
              }}
              className="px-4 py-2 rounded-md bg-slate-700/50 border border-white/10 text-white"
            >
              <option value="">Wszystkie statusy</option>
              <option value="published">Opublikowane</option>
              <option value="draft">Szkice</option>
              <option value="archived">Zarchiwizowane</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : courses.length === 0 ? (
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="text-center py-12 text-gray-400">Nie znaleziono kursów</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="bg-slate-800/50 border-white/10 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10"
              >
                {course.thumbnail_url && (
                  <div className="relative h-40 bg-slate-700 overflow-hidden group">
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {/* Badge on thumbnail */}
                    <div className="absolute top-2 right-2">{getStatusBadge(course.status)}</div>
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg font-semibold line-clamp-2 leading-tight">
                    {course.title}
                  </CardTitle>
                  {/* Display clean text instead of HTML */}
                  <p className="text-sm text-gray-400 line-clamp-3 mt-2">
                    {course.description ? stripHtml(course.description) : "Brak opisu"}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Instructor info */}
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <User className="w-4 h-4" />
                      <span>{course.instructor.full_name || course.instructor.email}</span>
                    </div>
                    {/* Creation date */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(course.created_at).toLocaleDateString("pl-PL")}</span>
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => (window.location.href = `/admin/courses/${course.id}`)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edytuj
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(course.id)} className="px-3">
                        <Trash2 className="w-3 h-3 mr-1" />
                        Usuń
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
            <CardContent className="flex items-center justify-between py-4">
              <div className="text-sm text-gray-400">
                Pokazuję {(page - 1) * limit + 1}-{Math.min(page * limit, total)} z {total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-white">
                  Strona {page} z {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
