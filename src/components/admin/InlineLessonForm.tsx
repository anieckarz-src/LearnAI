import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RichTextEditor } from "./RichTextEditor";
import { FileUpload } from "./FileUpload";
import { getVideoThumbnail, isValidVideoUrl } from "@/lib/video-utils";
import type { Lesson, LessonType, LessonFile } from "@/types";
import { Save, X, Loader2 } from "lucide-react";

const lessonSchema = z
  .object({
    title: z.string().min(3, "Tytuł musi mieć co najmniej 3 znaki").max(200, "Tytuł może mieć maksymalnie 200 znaków"),
    type: z.enum(["quiz", "content"], { required_error: "Typ lekcji jest wymagany" }),
    content: z.string().optional(),
    video_url: z.string().optional(),
    files: z.array(z.any()).optional(),
  })
  .refine(
    (data) => {
      // For content type, at least one field must be filled
      if (data.type === "content") {
        const hasContent = data.content && data.content.trim().length > 0;
        const hasVideo = data.video_url && data.video_url.trim().length > 0;
        const hasFiles = data.files && data.files.length > 0;
        return hasContent || hasVideo || hasFiles;
      }
      return true;
    },
    {
      message: "Lekcja typu 'content' musi mieć wypełnione przynajmniej jedno pole: treść, video URL lub pliki",
      path: ["content"],
    }
  );

type LessonFormData = z.infer<typeof lessonSchema>;

interface InlineLessonFormProps {
  courseId: string;
  moduleId: string;
  lesson?: Lesson;
  insertAtIndex?: number;
  onSave: (lesson: Lesson) => void;
  onCancel: () => void;
}

export function InlineLessonForm({
  courseId,
  moduleId,
  lesson,
  insertAtIndex,
  onSave,
  onCancel,
}: InlineLessonFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [loadingThumbnail, setLoadingThumbnail] = useState(false);

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

  // Fetch video thumbnail when video URL changes
  useEffect(() => {
    const fetchThumbnail = async () => {
      if (!videoUrl || videoUrl.trim() === "") {
        setVideoThumbnail(null);
        return;
      }

      if (!isValidVideoUrl(videoUrl)) {
        setVideoThumbnail(null);
        return;
      }

      setLoadingThumbnail(true);
      try {
        const thumbnail = await getVideoThumbnail(videoUrl);
        setVideoThumbnail(thumbnail);
      } catch (err) {
        console.error("Error fetching video thumbnail:", err);
        setVideoThumbnail(null);
      } finally {
        setLoadingThumbnail(false);
      }
    };

    // Debounce the fetch
    const timeoutId = setTimeout(fetchThumbnail, 500);
    return () => clearTimeout(timeoutId);
  }, [videoUrl]);

  const onSubmit = async (data: LessonFormData) => {
    try {
      setLoading(true);
      setError(null);

      const url = isEditMode ? `/api/admin/lessons/${lesson.id}` : "/api/admin/lessons";
      const method = isEditMode ? "PATCH" : "POST";

      const payload = {
        ...data,
        course_id: courseId,
        module_id: moduleId,
        order_index: insertAtIndex !== undefined ? insertAtIndex : lesson?.order_index || 0,
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

      // Pass the saved lesson data back to parent
      onSave(result.data);
    } catch (err) {
      console.error("Error saving lesson:", err);
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas zapisywania");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-slate-800/50 border-white/10 backdrop-blur-sm rounded-lg p-4 space-y-3 border-2 animate-in slide-in-from-top-2 duration-200"
    >
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title" className="text-white text-sm">
          Tytuł lekcji <span className="text-red-400">*</span>
        </Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="Wprowadź tytuł lekcji"
          className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400 h-9"
          autoFocus
        />
        {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
      </div>

      {/* Lesson Type */}
      <div className="space-y-1.5">
        <Label className="text-white text-sm">
          Typ lekcji <span className="text-red-400">*</span>
        </Label>
        <RadioGroup
          value={selectedType}
          onValueChange={(value: LessonType) => setValue("type", value)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="content" id={`${isEditMode ? lesson.id : "new"}-content`} />
            <Label htmlFor={`${isEditMode ? lesson.id : "new"}-content`} className="text-white cursor-pointer text-sm">
              🎬 Treść
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="quiz" id={`${isEditMode ? lesson.id : "new"}-quiz`} />
            <Label htmlFor={`${isEditMode ? lesson.id : "new"}-quiz`} className="text-white cursor-pointer text-sm">
              ❓ Quiz
            </Label>
          </div>
        </RadioGroup>
        {errors.type && <p className="text-xs text-red-400">{errors.type.message}</p>}
      </div>

      {/* Content fields for content type */}
      {selectedType === "content" && (
        <>
          {/* Video URL */}
          <div className="space-y-1.5">
            <Label htmlFor="video_url" className="text-white text-sm">
              URL Video (opcjonalnie)
            </Label>
            <Input
              id="video_url"
              {...register("video_url")}
              placeholder="https://vimeo.com/... lub https://youtube.com/..."
              className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400 h-9"
            />
            <p className="text-xs text-gray-500">Obsługiwane: Vimeo, YouTube</p>

            {/* Video Thumbnail Preview */}
            {loadingThumbnail && (
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ładowanie miniatury...</span>
              </div>
            )}

            {!loadingThumbnail && videoThumbnail && (
              <div className="mt-2 rounded-lg overflow-hidden border border-white/10 bg-slate-900/50">
                <img
                  src={videoThumbnail}
                  alt="Miniatura video"
                  className="w-full max-w-sm object-cover"
                  onError={() => setVideoThumbnail(null)}
                />
                <div className="px-3 py-2 bg-slate-800/50">
                  <p className="text-xs text-green-400">✓ Miniatura załadowana</p>
                </div>
              </div>
            )}

            {!loadingThumbnail &&
              videoUrl &&
              videoUrl.trim() !== "" &&
              !videoThumbnail &&
              isValidVideoUrl(videoUrl) && (
                <div className="mt-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs text-yellow-300">⚠️ Nie udało się załadować miniatury</p>
                </div>
              )}

            {!loadingThumbnail && videoUrl && videoUrl.trim() !== "" && !isValidVideoUrl(videoUrl) && (
              <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-300">✕ Nieprawidłowy URL video (obsługiwane: YouTube, Vimeo)</p>
              </div>
            )}
          </div>

          {/* Content - RICH TEXT EDITOR */}
          <div className="space-y-1.5">
            <Label className="text-white text-sm font-medium">📝 Treść lekcji (opcjonalnie)</Label>
            <RichTextEditor
              content={content || ""}
              onChange={(html) => setValue("content", html)}
              placeholder="Wprowadź treść lekcji..."
            />
            {errors.content && <p className="text-xs text-red-400 mt-1">{errors.content.message}</p>}
          </div>

          {/* Files Upload */}
          <div className="space-y-1.5">
            <Label className="text-white text-sm font-medium">📎 Pliki dodatkowe (opcjonalnie)</Label>
            <FileUpload value={files as LessonFile[]} onChange={(newFiles) => setValue("files", newFiles)} />
            <p className="text-xs text-gray-500">PDF, obrazy, dokumenty (max 100MB per plik)</p>
          </div>

          {!videoUrl && !content && files.length === 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
              <p className="text-xs text-yellow-300">
                💡 Uzupełnij przynajmniej jedno pole: video URL, treść lekcji lub dodaj pliki.
              </p>
            </div>
          )}
        </>
      )}

      {selectedType === "quiz" && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-sm text-blue-300">
            💡 Lekcja typu "quiz" wymaga utworzenia quizu. Po zapisaniu lekcji, będziesz mógł dodać pytania quizu.
          </p>
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={loading}
          className="hover:bg-white/5 transition-all duration-200"
        >
          <X className="w-3 h-3 mr-1.5" />
          Anuluj
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 transition-all duration-200"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5" />
              Zapisywanie...
            </>
          ) : (
            <>
              <Save className="w-3 h-3 mr-1.5" />
              {isEditMode ? "Zapisz" : "Dodaj"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
