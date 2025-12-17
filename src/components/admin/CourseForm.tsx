import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "./RichTextEditor";
import { ImageUpload } from "./ImageUpload";
import type { Course, CourseStatus, User } from "@/types";
import { ArrowLeft, Save, CheckCircle2, Clock } from "lucide-react";

const courseSchema = z.object({
  title: z.string().min(3, "Tytuł musi mieć co najmniej 3 znaki").max(200, "Tytuł może mieć maksymalnie 200 znaków"),
  description: z.string(),
  status: z.enum(["draft", "published", "archived"] as const),
  thumbnail_url: z.string(),
  lesson_access_mode: z.enum(["sequential", "all_access"] as const).default("all_access"),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CourseFormProps {
  course?: Course;
  compact?: boolean;
}

export function CourseForm({ course, compact = false }: CourseFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

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
  const title = watch("title");

  // Watch all form values for auto-save
  const formValues = watch();

  // Auto-save functionality (only in edit mode)
  const { clearSaved } = useAutoSave({
    key: `course-draft-${course?.id || "new"}`,
    data: formValues,
    delay: 30000, // 30 seconds
    enabled: isEditMode, // Only auto-save in edit mode
    onSave: () => {
      setLastAutoSave(new Date());
    },
  });

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

      // Show success toast
      toast.success(isEditMode ? "Kurs został zaktualizowany!" : "Kurs został utworzony!", {
        description: isEditMode ? "Zmiany zostały zapisane pomyślnie." : "Możesz teraz dodać moduły i lekcje.",
      });

      // Clear auto-save draft
      clearSaved();

      // Only redirect if creating new course
      if (!isEditMode) {
        setTimeout(() => {
          window.location.href = `/admin/courses/${result.data.id}`;
        }, 1000);
      }
    } catch (err) {
      console.error("Error saving course:", err);
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd podczas zapisywania";
      setError(errorMessage);
      toast.error("Błąd zapisywania kursu", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Status badge colors
  const getStatusBadge = () => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Opublikowany
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">
            Zarchiwizowany
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            Szkic
          </span>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {!compact && (
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
      )}

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">{error}</div>}

      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader className={compact ? "pb-4" : ""}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-white">{isEditMode ? "Szczegóły kursu" : "Utwórz nowy kurs"}</CardTitle>
              {isEditMode && lastAutoSave && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  Zapisano {new Date(lastAutoSave).toLocaleTimeString()}
                </span>
              )}
            </div>
            {isEditMode && getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className={compact ? "space-y-4" : "space-y-6"}>
          {/* Title with character counter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="text-white">
                Tytuł kursu <span className="text-red-400">*</span>
              </Label>
              <span className={`text-xs ${title.length > 200 ? "text-red-400" : "text-gray-500"}`}>
                {title.length}/200
              </span>
            </div>
            <Input
              id="title"
              {...register("title")}
              placeholder="Wprowadź tytuł kursu"
              className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400"
            />
            {errors.title && <p className="text-sm text-red-400">{errors.title.message}</p>}
          </div>

          {/* Compact layout for status and access mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Lesson Access Mode */}
            <div className="space-y-2">
              <Label htmlFor="lesson_access_mode" className="text-white">
                Dostęp <span className="text-red-400">*</span>
              </Label>
              <Select
                value={lesson_access_mode || "all_access"}
                onValueChange={(value) =>
                  setValue("lesson_access_mode", value as "sequential" | "all_access", { shouldValidate: true })
                }
              >
                <SelectTrigger className="bg-slate-700/50 border-white/10 text-white">
                  <SelectValue placeholder="Wybierz tryb" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="all_access" className="text-white focus:bg-slate-700 focus:text-white">
                    Pełny dostęp
                  </SelectItem>
                  <SelectItem value="sequential" className="text-white focus:bg-slate-700 focus:text-white">
                    Sekwencyjny
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.lesson_access_mode && <p className="text-sm text-red-400">{errors.lesson_access_mode.message}</p>}
            </div>
          </div>

          {/* Thumbnail */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail" className="text-white">
              Miniatura kursu
            </Label>
            <ImageUpload value={thumbnail_url} onChange={(url) => setValue("thumbnail_url", url)} />
            {errors.thumbnail_url && <p className="text-sm text-red-400">{errors.thumbnail_url.message}</p>}
          </div>

          {/* Description - Collapsible in compact mode */}
          {!compact || description ? (
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
          ) : null}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3">
        {!compact && (
          <Button
            type="button"
            variant="outline"
            onClick={() => (window.location.href = "/admin/courses")}
            disabled={loading}
          >
            Anuluj
          </Button>
        )}
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
