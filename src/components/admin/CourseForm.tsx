import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "./RichTextEditor";
import { ImageUpload } from "./ImageUpload";
import type { Course, CourseStatus, User } from "@/types";
import { ArrowLeft, Save } from "lucide-react";

const courseSchema = z.object({
  title: z.string().min(3, "Tytuł musi mieć co najmniej 3 znaki").max(200, "Tytuł może mieć maksymalnie 200 znaków"),
  description: z.string(),
  instructor_id: z.string().uuid("Wybierz instruktora"),
  status: z.enum(["draft", "published", "archived"] as const),
  thumbnail_url: z.string(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CourseFormProps {
  course?: Course;
}

export function CourseForm({ course }: CourseFormProps) {
  const [instructors, setInstructors] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingInstructors, setLoadingInstructors] = useState(true);

  const isEditMode = !!course;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: course?.title || "",
      description: course?.description || "",
      instructor_id: course?.instructor_id || "",
      status: course?.status || "draft",
      thumbnail_url: course?.thumbnail_url || "",
    },
  });

  const description = watch("description");
  const thumbnail_url = watch("thumbnail_url");
  const status = watch("status");
  const instructor_id = watch("instructor_id");

  // Fetch instructors (both instructors and admins can be instructors)
  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        setLoadingInstructors(true);

        // Fetch both instructors and admins
        const [instructorsResponse, adminsResponse] = await Promise.all([
          fetch("/api/admin/users?role=instructor&limit=100"),
          fetch("/api/admin/users?role=admin&limit=100"),
        ]);

        const instructorsResult = await instructorsResponse.json();
        const adminsResult = await adminsResponse.json();

        const allInstructors: User[] = [];

        if (instructorsResult.success) {
          allInstructors.push(...instructorsResult.data.data);
        }

        if (adminsResult.success) {
          allInstructors.push(...adminsResult.data.data);
        }

        // Sort by full_name or email
        allInstructors.sort((a, b) => {
          const nameA = (a.full_name || a.email).toLowerCase();
          const nameB = (b.full_name || b.email).toLowerCase();
          return nameA.localeCompare(nameB);
        });

        setInstructors(allInstructors);
      } catch (err) {
        console.error("Error fetching instructors:", err);
      } finally {
        setLoadingInstructors(false);
      }
    };

    fetchInstructors();
  }, []);

  const onSubmit = async (data: CourseFormData) => {
    try {
      setLoading(true);
      setError(null);

      const url = isEditMode ? `/api/admin/courses/${course.id}` : "/api/admin/courses";
      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Nie udało się zapisać kursu");
      }

      // Redirect to courses list
      window.location.href = "/admin/courses";
    } catch (err) {
      console.error("Error saving course:", err);
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas zapisywania");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => (window.location.href = "/admin/courses")}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Powrót do listy kursów
        </Button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">{error}</div>}

      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">{isEditMode ? "Edytuj kurs" : "Utwórz nowy kurs"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Tytuł kursu <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Wprowadź tytuł kursu"
              className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400"
            />
            {errors.title && <p className="text-sm text-red-400">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Opis kursu
            </Label>
            <RichTextEditor
              content={description}
              onChange={(html) => setValue("description", html)}
              placeholder="Wprowadź szczegółowy opis kursu..."
            />
            {errors.description && <p className="text-sm text-red-400">{errors.description.message}</p>}
          </div>

          {/* Instructor */}
          <div className="space-y-2">
            <Label htmlFor="instructor" className="text-white">
              Instruktor <span className="text-red-400">*</span>
            </Label>
            {loadingInstructors ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                Ładowanie instruktorów...
              </div>
            ) : (
              <Select value={instructor_id} onValueChange={(value) => setValue("instructor_id", value)}>
                <SelectTrigger className="bg-slate-700/50 border-white/10 text-white">
                  <SelectValue placeholder="Wybierz instruktora" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {instructors.map((instructor) => (
                    <SelectItem
                      key={instructor.id}
                      value={instructor.id}
                      className="text-white focus:bg-slate-700 focus:text-white"
                    >
                      {instructor.full_name || instructor.email}
                      <span className="ml-2 text-xs text-gray-400">
                        ({instructor.role === "admin" ? "Administrator" : "Instruktor"})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.instructor_id && <p className="text-sm text-red-400">{errors.instructor_id.message}</p>}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-white">
              Status <span className="text-red-400">*</span>
            </Label>
            <Select value={status} onValueChange={(value) => setValue("status", value as CourseStatus)}>
              <SelectTrigger className="bg-slate-700/50 border-white/10 text-white">
                <SelectValue placeholder="Wybierz status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10">
                <SelectItem value="draft" className="text-white focus:bg-slate-700 focus:text-white">
                  Szkic
                </SelectItem>
                <SelectItem value="published" className="text-white focus:bg-slate-700 focus:text-white">
                  Opublikowany
                </SelectItem>
                <SelectItem value="archived" className="text-white focus:bg-slate-700 focus:text-white">
                  Zarchiwizowany
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.status && <p className="text-sm text-red-400">{errors.status.message}</p>}
          </div>

          {/* Thumbnail */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail" className="text-white">
              Miniatura kursu
            </Label>
            <ImageUpload value={thumbnail_url} onChange={(url) => setValue("thumbnail_url", url)} />
            {errors.thumbnail_url && <p className="text-sm text-red-400">{errors.thumbnail_url.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/admin/courses")}
          disabled={loading}
        >
          Anuluj
        </Button>
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Zapisywanie...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isEditMode ? "Zapisz zmiany" : "Utwórz kurs"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
