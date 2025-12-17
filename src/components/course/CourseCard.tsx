import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/types";
import { Check } from "lucide-react";

interface CourseCardProps {
  course: Course & {
    is_enrolled?: boolean;
  };
}

export function CourseCard({ course }: CourseCardProps) {
  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  return (
    <a href={`/courses/${course.id}`} className="block group">
      <Card className="h-full bg-slate-800/50 border-white/10 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/30">
        {course.thumbnail_url && (
          <div className="relative h-48 bg-slate-700 overflow-hidden">
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />

            {/* Enrolled badge */}
            {course.is_enrolled && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-purple-600 text-white flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Zapisany
                </Badge>
              </div>
            )}
          </div>
        )}

        <CardHeader className="pb-3">
          <CardTitle className="text-white text-xl font-semibold line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">
            {course.title}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-gray-400 line-clamp-3">
            {course.description ? stripHtml(course.description) : "Brak opisu"}
          </p>
        </CardContent>
      </Card>
    </a>
  );
}
