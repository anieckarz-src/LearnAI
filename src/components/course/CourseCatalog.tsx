import { useEffect, useState } from "react";
import { CourseCard } from "./CourseCard";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { Course, User } from "@/types";
import { Search } from "lucide-react";

interface CourseWithInstructor extends Course {
  instructor: User;
  is_enrolled?: boolean;
}

export function CourseCatalog() {
  const [courses, setCourses] = useState<CourseWithInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "free" | "paid">("all");

  useEffect(() => {
    fetchCourses();
  }, [filter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filter === "free") {
        params.append("is_free", "true");
      } else if (filter === "paid") {
        params.append("is_free", "false");
      }

      const response = await fetch(`/api/courses?${params}`);
      const result = await response.json();

      if (result.success) {
        setCourses(result.data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Szukaj kursów..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                Wszystkie
              </button>
              <button
                onClick={() => setFilter("free")}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  filter === "free"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                Darmowe
              </button>
              <button
                onClick={() => setFilter("paid")}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  filter === "paid"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                Płatne
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <p className="text-gray-400 text-lg">Nie znaleziono kursów</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
