import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "./RichTextEditor";
import { FileUpload } from "./FileUpload";
import type { Lesson, LessonMaterial } from "@/types";
import { Save, X } from "lucide-react";

const lessonSchema = z.object({
  title: z.string().min(3, "Tytuł musi mieć co najmniej 3 znaki").max(200, "Tytuł może mieć maksymalnie 200 znaków"),
  content: z.string(),
  materials: z.array(z.any()).optional(),
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
      title: lesson?.title || "",
      content: lesson?.content || "",
      materials: lesson?.materials || [],
    },
  });

  const content = watch("content");
  const materials = watch("materials") || [];

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

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-white">
              Treść lekcji
            </Label>
            <RichTextEditor
              content={content}
              onChange={(html) => setValue("content", html)}
              placeholder="Wprowadź treść lekcji..."
            />
            {errors.content && <p className="text-sm text-red-400">{errors.content.message}</p>}
          </div>

          {/* Materials */}
          <div className="space-y-2">
            <Label htmlFor="materials" className="text-white">
              Materiały do lekcji
            </Label>
            <FileUpload
              value={materials as LessonMaterial[]}
              onChange={(newMaterials) => setValue("materials", newMaterials)}
            />
          </div>
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
