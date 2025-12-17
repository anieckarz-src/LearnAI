import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RichTextEditor } from "./RichTextEditor";
import { ImageUpload } from "./ImageUpload";
import type { CourseStatus, LessonType } from "@/types";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  FileText,
  Folder,
  BookOpen,
} from "lucide-react";

const courseSchema = z.object({
  title: z.string().min(3, "Tytuł musi mieć co najmniej 3 znaki"),
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

interface ModuleData {
  id: string;
  title: string;
  description: string;
  lessons: LessonData[];
  expanded: boolean;
}

interface LessonData {
  id: string;
  title: string;
  type: LessonType;
  content?: string;
  video_url?: string;
}

export function CourseCreator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [nextModuleId, setNextModuleId] = useState(1);
  const [nextLessonId, setNextLessonId] = useState(1);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "draft",
      thumbnail_url: "",
      lesson_access_mode: "all_access",
      price: "",
    },
  });

  const description = watch("description");
  const thumbnail_url = watch("thumbnail_url");
  const status = watch("status");
  const lesson_access_mode = watch("lesson_access_mode");

  // Module functions
  const addModule = () => {
    setModules([
      ...modules,
      {
        id: `temp-module-${nextModuleId}`,
        title: `Moduł ${modules.length + 1}`,
        description: "",
        lessons: [],
        expanded: true,
      },
    ]);
    setNextModuleId(nextModuleId + 1);
  };

  const updateModule = (moduleId: string, field: keyof ModuleData, value: any) => {
    setModules(modules.map((m) => (m.id === moduleId ? { ...m, [field]: value } : m)));
  };

  const deleteModule = (moduleId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten moduł wraz ze wszystkimi lekcjami?")) return;
    setModules(modules.filter((m) => m.id !== moduleId));
  };

  const toggleModuleExpansion = (moduleId: string) => {
    setModules(modules.map((m) => (m.id === moduleId ? { ...m, expanded: !m.expanded } : m)));
  };

  // Lesson functions
  const addLesson = (moduleId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: [
              ...m.lessons,
              {
                id: `temp-lesson-${nextLessonId}`,
                title: `Lekcja ${m.lessons.length + 1}`,
                type: "content",
              },
            ],
          };
        }
        return m;
      })
    );
    setNextLessonId(nextLessonId + 1);
  };

  const updateLesson = (moduleId: string, lessonId: string, field: keyof LessonData, value: any) => {
    setModules(
      modules.map((m) => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, [field]: value } : l)),
          };
        }
        return m;
      })
    );
  };

  const deleteLesson = (moduleId: string, lessonId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę lekcję?")) return;
    setModules(
      modules.map((m) => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: m.lessons.filter((l) => l.id !== lessonId),
          };
        }
        return m;
      })
    );
  };

  const onSubmit = async (data: CourseFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Create course
      const courseResponse = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const courseResult = await courseResponse.json();
      if (!courseResult.success) {
        throw new Error(courseResult.error || "Nie udało się utworzyć kursu");
      }

      const courseId = courseResult.data.id;

      // Create modules and lessons
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];

        // Create module
        const moduleResponse = await fetch("/api/admin/modules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            title: module.title,
            description: module.description,
            order_index: i,
          }),
        });

        const moduleResult = await moduleResponse.json();
        if (!moduleResult.success) {
          throw new Error(`Nie udało się utworzyć modułu: ${module.title}`);
        }

        const moduleId = moduleResult.data.id;

        // Create lessons for this module
        for (let j = 0; j < module.lessons.length; j++) {
          const lesson = module.lessons[j];

          const lessonResponse = await fetch("/api/admin/lessons", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              course_id: courseId,
              module_id: moduleId,
              title: lesson.title,
              type: lesson.type,
              content: lesson.content || null,
              video_url: lesson.video_url || null,
              files: [],
              order_index: j,
            }),
          });

          const lessonResult = await lessonResponse.json();
          if (!lessonResult.success) {
            throw new Error(`Nie udało się utworzyć lekcji: ${lesson.title}`);
          }
        }
      }

      // Redirect to course edit page
      window.location.href = `/admin/courses/${courseId}/edit`;
    } catch (err) {
      console.error("Error creating course:", err);
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas tworzenia kursu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Szczegóły kursu
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <Folder className="w-4 h-4" />
            Moduły
          </TabsTrigger>
          <TabsTrigger value="lessons" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Lekcje
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Course Details */}
        <TabsContent value="details" className="mt-0">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Podstawowe informacje</CardTitle>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-white">
                      Status <span className="text-red-400">*</span>
                    </Label>
                    <Select
                      value={status || "draft"}
                      onValueChange={(value) => setValue("status", value as CourseStatus)}
                    >
                      <SelectTrigger className="bg-slate-700/50 border-white/10 text-white">
                        <SelectValue placeholder="Wybierz status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Szkic</SelectItem>
                        <SelectItem value="published">Opublikowany</SelectItem>
                        <SelectItem value="archived">Zarchiwizowany</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-white">
                      Cena (PLN)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      {...register("price")}
                      placeholder="0.00"
                      className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400"
                    />
                    <p className="text-xs text-gray-400">Pozostaw puste dla darmowego kursu</p>
                  </div>
                </div>

                {/* Lesson Access Mode */}
                <div className="space-y-2">
                  <Label className="text-white">Tryb dostępu do lekcji</Label>
                  <Select
                    value={lesson_access_mode || "all_access"}
                    onValueChange={(value) => setValue("lesson_access_mode", value as "sequential" | "all_access")}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_access">Pełny dostęp</SelectItem>
                      <SelectItem value="sequential">Sekwencyjny</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Thumbnail */}
                <div className="space-y-2">
                  <Label className="text-white">Miniatura kursu</Label>
                  <ImageUpload value={thumbnail_url} onChange={(url) => setValue("thumbnail_url", url)} />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-white">Opis kursu</Label>
                  <RichTextEditor
                    content={description}
                    onChange={(html) => setValue("description", html)}
                    placeholder="Wprowadź opis kursu..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Navigation hint */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                💡 Po wypełnieniu szczegółów kursu, przejdź do zakładki "Moduły" aby dodać strukturę kursu, lub "Lekcje"
                aby szybko dodać lekcje.
              </p>
            </div>
          </form>
        </TabsContent>

        {/* Tab 2: Modules */}
        <TabsContent value="modules" className="mt-0">
          <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Moduły kursu</CardTitle>
                <Button type="button" onClick={addModule} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj moduł
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {modules.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Brak modułów. Kliknij "Dodaj moduł" aby rozpocząć.</p>
                  <p className="text-sm mt-2">Moduły grupują lekcje w logiczne sekcje kursu.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.map((module, moduleIndex) => (
                    <div key={module.id} className="border border-white/10 rounded-lg overflow-hidden">
                      {/* Module Header */}
                      <div className="bg-slate-700/30 p-4">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-5 h-5 text-gray-500" />
                          <Input
                            value={module.title}
                            onChange={(e) => updateModule(module.id, "title", e.target.value)}
                            placeholder="Tytuł modułu"
                            className="flex-1 bg-slate-700/50 border-white/10 text-white"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleModuleExpansion(module.id)}
                          >
                            {module.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteModule(module.id)}
                            className="text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {module.expanded && (
                          <div className="mt-3">
                            <Textarea
                              value={module.description}
                              onChange={(e) => updateModule(module.id, "description", e.target.value)}
                              placeholder="Opis modułu (opcjonalnie)"
                              className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400"
                            />
                          </div>
                        )}
                      </div>

                      {/* Module Lessons */}
                      {module.expanded && (
                        <div className="p-4 space-y-3">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div key={lesson.id} className="bg-slate-700/20 rounded-lg p-4 space-y-3">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{lesson.type === "quiz" ? "❓" : "🎬"}</span>
                                <Input
                                  value={lesson.title}
                                  onChange={(e) => updateLesson(module.id, lesson.id, "title", e.target.value)}
                                  placeholder="Tytuł lekcji"
                                  className="flex-1 bg-slate-700/50 border-white/10 text-white"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteLesson(module.id, lesson.id)}
                                  className="text-red-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Lesson Type */}
                              <RadioGroup
                                value={lesson.type}
                                onValueChange={(value: LessonType) => updateLesson(module.id, lesson.id, "type", value)}
                                className="flex gap-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="content" id={`${lesson.id}-content`} />
                                  <Label htmlFor={`${lesson.id}-content`} className="text-white cursor-pointer">
                                    Treść
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="quiz" id={`${lesson.id}-quiz`} />
                                  <Label htmlFor={`${lesson.id}-quiz`} className="text-white cursor-pointer">
                                    Quiz
                                  </Label>
                                </div>
                              </RadioGroup>

                              {/* Content fields */}
                              {lesson.type === "content" && (
                                <div className="space-y-2">
                                  <Input
                                    value={lesson.video_url || ""}
                                    onChange={(e) => updateLesson(module.id, lesson.id, "video_url", e.target.value)}
                                    placeholder="URL wideo (opcjonalnie)"
                                    className="bg-slate-700/50 border-white/10 text-white"
                                  />
                                  <Textarea
                                    value={lesson.content || ""}
                                    onChange={(e) => updateLesson(module.id, lesson.id, "content", e.target.value)}
                                    placeholder="Treść lekcji (opcjonalnie)"
                                    className="bg-slate-700/50 border-white/10 text-white"
                                    rows={3}
                                  />
                                </div>
                              )}
                            </div>
                          ))}

                          <Button
                            type="button"
                            onClick={() => addLesson(module.id)}
                            variant="outline"
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Dodaj lekcję do modułu
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Quick Lessons View */}
        <TabsContent value="lessons" className="mt-0">
          <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Szybki przegląd lekcji</CardTitle>
            </CardHeader>
            <CardContent>
              {modules.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Brak modułów.</p>
                  <p className="text-sm mt-2">Najpierw dodaj moduły w zakładce "Moduły".</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.map((module) => (
                    <div key={module.id} className="border border-white/10 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-2">{module.title}</h3>
                      {module.lessons.length === 0 ? (
                        <p className="text-gray-400 text-sm">Brak lekcji w tym module</p>
                      ) : (
                        <div className="space-y-2">
                          {module.lessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center gap-2 text-sm">
                              <span className="text-xl">{lesson.type === "quiz" ? "❓" : "🎬"}</span>
                              <span className="text-white">{lesson.title}</span>
                              <span className="text-gray-500">({lesson.type === "quiz" ? "Quiz" : "Treść"})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fixed bottom bar with save button */}
      <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-white/10 p-4 -mx-6 -mb-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="text-gray-400 text-sm">
            {modules.length} {modules.length === 1 ? "moduł" : "modułów"} •{" "}
            {modules.reduce((acc, m) => acc + m.lessons.length, 0)}{" "}
            {modules.reduce((acc, m) => acc + m.lessons.length, 0) === 1 ? "lekcja" : "lekcji"}
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => (window.location.href = "/admin/courses")}
              disabled={loading}
            >
              Anuluj
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Tworzenie kursu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Utwórz kurs z modułami
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
