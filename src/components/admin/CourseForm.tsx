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
  status: z.enum(["draft", "published", "archived"] as const),
  thumbnail_url: z.string(),
  lesson_access_mode: z.enum(["sequential", "all_access"] as const).default("all_access"),
  price: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val === "") return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    }),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CourseFormProps {
  course?: Course;
}

export function CourseForm({ course }: CourseFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      status: (course?.status as CourseStatus) || "draft",
      thumbnail_url: course?.thumbnail_url || "",
      lesson_access_mode: (course?.lesson_access_mode as "sequential" | "all_access") || "all_access",
      price: course?.price?.toString() || "",
    },
  });

  // Ensure form fields are registered
  useEffect(() => {
    register("status");
    register("lesson_access_mode");
  }, [register]);

  const description = watch("description");
  const thumbnail_url = watch("thumbnail_url");
  const status = watch("status");
  const lesson_access_mode = watch("lesson_access_mode");
  const price = watch("price");

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
          {/* Title - Full Width */}
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

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-white">
              Status <span className="text-red-400">*</span>
            </Label>
            <Select 
              value={status || "draft"} 
              onValueChange={(value) => setValue("status", value as CourseStatus, { shouldValidate: true })}
            >
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

          {/* Price and Lesson Access Mode - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price" className="text-white">
                Cena kursu (PLN)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...register("price")}
                placeholder="0.00"
                className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400"
              />
              <p className="text-xs text-gray-400">Pozostaw puste dla darmowego kursu</p>
              {errors.price && <p className="text-sm text-red-400">{errors.price.message}</p>}
            </div>

            {/* Lesson Access Mode */}
            <div className="space-y-2">
              <Label htmlFor="lesson_access_mode" className="text-white">
                Tryb dostępu do lekcji <span className="text-red-400">*</span>
              </Label>
              <Select
                value={lesson_access_mode || "all_access"}
                onValueChange={(value) => setValue("lesson_access_mode", value as "sequential" | "all_access", { shouldValidate: true })}
              >
                <SelectTrigger className="bg-slate-700/50 border-white/10 text-white">
                  <SelectValue placeholder="Wybierz tryb dostępu" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="all_access" className="text-white focus:bg-slate-700 focus:text-white">
                    Pełny dostęp - wszystkie lekcje od razu
                  </SelectItem>
                  <SelectItem value="sequential" className="text-white focus:bg-slate-700 focus:text-white">
                    Sekwencyjny - odblokowanie po kolei
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">
                {lesson_access_mode === "sequential"
                  ? "Użytkownicy muszą ukończyć lekcje po kolei"
                  : "Użytkownicy mają dostęp do wszystkich lekcji od razu"}
              </p>
              {errors.lesson_access_mode && (
                <p className="text-sm text-red-400">{errors.lesson_access_mode.message}</p>
              )}
            </div>
          </div>

          {/* Thumbnail - Full Width */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail" className="text-white">
              Miniatura kursu
            </Label>
            <ImageUpload value={thumbnail_url} onChange={(url) => setValue("thumbnail_url", url)} />
            {errors.thumbnail_url && <p className="text-sm text-red-400">{errors.thumbnail_url.message}</p>}
          </div>

          {/* Description - Full Width at the End */}
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
