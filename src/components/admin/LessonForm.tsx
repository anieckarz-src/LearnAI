import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "./RichTextEditor";
import { FileUpload } from "./FileUpload";
import type { Lesson, LessonFile, Module, LessonType } from "@/types";
import { Save, X } from "lucide-react";

const lessonSchema = z.object({
  module_id: z.string().min(1, "Moduł jest wymagany"),
  title: z.string().min(3, "Tytuł musi mieć co najmniej 3 znaki").max(200, "Tytuł może mieć maksymalnie 200 znaków"),
  type: z.enum(["quiz", "content"], { required_error: "Typ lekcji jest wymagany" }),
  content: z.string().optional(),
  video_url: z.string().optional(),
  files: z.array(z.any()).optional(),
}).refine((data) => {
  // For content type, at least one field must be filled
  if (data.type === "content") {
    const hasContent = data.content && data.content.trim().length > 0;
    const hasVideo = data.video_url && data.video_url.trim().length > 0;
    const hasFiles = data.files && data.files.length > 0;
    return hasContent || hasVideo || hasFiles;
  }
  return true;
}, {
  message: "Lekcja typu 'content' musi mieć wypełnione przynajmniej jedno pole: treść, video URL lub pliki",
  path: ["content"],
});

type LessonFormData = z.infer<typeof lessonSchema>;

interface LessonFormProps {
  courseId: string;
  lesson?: Lesson;
  onSave: () => void;
  onCancel: () => void;
}

export function LessonForm({ courseId, lesson, onSave, onCancel }: LessonFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);

  const isEditMode = !!lesson;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      module_id: lesson?.module_id || "",
      title: lesson?.title || "",
      type: lesson?.type || "content",
      content: lesson?.content || "",
      video_url: lesson?.video_url || "",
      files: lesson?.files || [],
    },
  });

  const selectedType = watch("type");
  const content = watch("content");
  const videoUrl = watch("video_url");
  const files = watch("files") || [];

  useEffect(() => {
    fetchModules();
  }, [courseId]);

  const fetchModules = async () => {
    try {
      setLoadingModules(true);
      const response = await fetch(`/api/admin/modules?course_id=${courseId}`);
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

  const onSubmit = async (data: LessonFormData) => {
    try {
      setLoading(true);
      setError(null);

      const url = isEditMode ? `/api/admin/lessons/${lesson.id}` : "/api/admin/lessons";
      const method = isEditMode ? "PATCH" : "POST";

      const payload = {
        ...data,
        course_id: courseId,
        order_index: lesson?.order_index || 0,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Nie udało się zapisać lekcji");
      }

      onSave();
    } catch (err) {
      console.error("Error saving lesson:", err);
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas zapisywania");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">{error}</div>}

      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">{isEditMode ? "Edytuj lekcję" : "Nowa lekcja"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Module Selection */}
          <div className="space-y-2">
            <Label htmlFor="module_id" className="text-white">
              Moduł <span className="text-red-400">*</span>
            </Label>
            {loadingModules ? (
              <div className="text-gray-400">Ładowanie modułów...</div>
            ) : (
              <Select value={watch("module_id")} onValueChange={(value) => setValue("module_id", value)}>
                <SelectTrigger className="bg-slate-700/50 border-white/10 text-white">
                  <SelectValue placeholder="Wybierz moduł" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.module_id && <p className="text-sm text-red-400">{errors.module_id.message}</p>}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Tytuł lekcji <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Wprowadź tytuł lekcji"
              className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400"
            />
            {errors.title && <p className="text-sm text-red-400">{errors.title.message}</p>}
          </div>

          {/* Lesson Type */}
          <div className="space-y-2">
            <Label className="text-white">
              Typ lekcji <span className="text-red-400">*</span>
            </Label>
            <RadioGroup
              value={selectedType}
              onValueChange={(value: LessonType) => setValue("type", value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="content" id="content" />
                <Label htmlFor="content" className="text-white cursor-pointer">
                  🎬 Treść (video/tekst/pliki)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="quiz" id="quiz" />
                <Label htmlFor="quiz" className="text-white cursor-pointer">
                  ❓ Quiz
                </Label>
              </div>
            </RadioGroup>
            {errors.type && <p className="text-sm text-red-400">{errors.type.message}</p>}
          </div>

          {/* Conditional fields based on type */}
          {selectedType === "content" && (
            <>
              {/* Video URL */}
              <div className="space-y-2">
                <Label htmlFor="video_url" className="text-white">
                  URL Video (opcjonalnie)
                </Label>
                <Input
                  id="video_url"
                  {...register("video_url")}
                  placeholder="https://vimeo.com/..."
                  className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-500">Obsługiwane platformy: Vimeo, YouTube</p>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-white">
                  Treść lekcji (opcjonalnie)
                </Label>
                <RichTextEditor
                  content={content || ""}
                  onChange={(html) => setValue("content", html)}
                  placeholder="Wprowadź treść lekcji..."
                />
                {errors.content && <p className="text-sm text-red-400">{errors.content.message}</p>}
              </div>

              {/* Files */}
              <div className="space-y-2">
                <Label htmlFor="files" className="text-white">
                  Dodatkowe pliki (opcjonalnie)
                </Label>
                <FileUpload
                  value={files as LessonFile[]}
                  onChange={(newFiles) => setValue("files", newFiles)}
                />
                <p className="text-xs text-gray-500">Dozwolone typy: PDF, obrazy, dokumenty</p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-sm text-blue-300">
                  💡 Lekcja typu "content" musi mieć wypełnione przynajmniej jedno pole: video URL, treść lub pliki.
                </p>
              </div>
            </>
          )}

          {selectedType === "quiz" && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-yellow-300">
                💡 Lekcja typu "quiz" wymaga utworzenia quizu. Po zapisaniu lekcji, będziesz mógł przypisać do niej quiz w zakładce "Quizy".
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          <X className="w-4 h-4 mr-2" />
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
              {isEditMode ? "Zapisz zmiany" : "Utwórz lekcję"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
