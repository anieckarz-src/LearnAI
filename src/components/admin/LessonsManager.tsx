import { useEffect, useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LessonForm } from "./LessonForm";
import { LessonPreview } from "./LessonPreview";
import type { Lesson, Module } from "@/types";
import { Plus, Edit, Trash2, Eye, GripVertical, Loader2, ChevronDown, ChevronRight } from "lucide-react";

interface LessonsManagerProps {
  courseId: string;
}

interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

interface SortableLessonItemProps {
  lesson: Lesson;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
}

function SortableLessonItem({ lesson, onEdit, onDelete, onPreview }: SortableLessonItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getLessonTypeIcon = (type: string) => {
    return type === "quiz" ? "❓" : "🎬";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 rounded-lg bg-slate-700/50 border border-white/10 hover:border-blue-500/50 transition-colors"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-white">
        <GripVertical className="w-5 h-5" />
      </div>

      <span className="text-2xl">{getLessonTypeIcon(lesson.type)}</span>

      <div className="flex-1 min-w-0">
        <h4 className="text-white font-medium truncate">{lesson.title}</h4>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="capitalize">{lesson.type === "quiz" ? "Quiz" : "Treść"}</span>
          <span>•</span>
          <span>Utworzono: {new Date(lesson.created_at).toLocaleDateString("pl-PL")}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onPreview}>
          <Eye className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function LessonsManager({ courseId }: LessonsManagerProps) {
  const [modulesWithLessons, setModulesWithLessons] = useState<ModuleWithLessons[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchLessons();
  }, [courseId]);

  const fetchLessons = async () => {
    try {
      setLoading(true);

      // Fetch modules
      const modulesResponse = await fetch(`/api/admin/modules?course_id=${courseId}`);
      const modulesResult = await modulesResponse.json();

      if (!modulesResult.success) {
        throw new Error(modulesResult.error);
      }

      // Fetch lessons
      const lessonsResponse = await fetch(`/api/admin/lessons?course_id=${courseId}`);
      const lessonsResult = await lessonsResponse.json();

      if (!lessonsResult.success) {
        throw new Error(lessonsResult.error);
      }

      // Group lessons by module
      const modulesData = modulesResult.data.map((module: Module) => ({
        ...module,
        lessons: lessonsResult.data.filter((lesson: Lesson) => lesson.module_id === module.id),
      }));

      setModulesWithLessons(modulesData);

      // Expand all modules by default
      setExpandedModules(new Set(modulesData.map((m: Module) => m.id)));
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Find which module contains these lessons
      let moduleIndex = -1;
      let lessons: Lesson[] = [];

      modulesWithLessons.forEach((module, idx) => {
        const hasActive = module.lessons.some((l) => l.id === active.id);
        const hasOver = module.lessons.some((l) => l.id === over.id);
        if (hasActive && hasOver) {
          moduleIndex = idx;
          lessons = module.lessons;
        }
      });

      if (moduleIndex === -1) return;

      const oldIndex = lessons.findIndex((l) => l.id === active.id);
      const newIndex = lessons.findIndex((l) => l.id === over.id);

      const newLessons = arrayMove(lessons, oldIndex, newIndex);

      // Update state optimistically
      const newModulesWithLessons = [...modulesWithLessons];
      newModulesWithLessons[moduleIndex].lessons = newLessons;
      setModulesWithLessons(newModulesWithLessons);

      // Update order_index for all affected lessons
      try {
        await Promise.all(
          newLessons.map((lesson, index) =>
            fetch(`/api/admin/lessons/${lesson.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ order_index: index }),
            })
          )
        );
      } catch (error) {
        console.error("Error updating lesson order:", error);
        // Revert on error
        fetchLessons();
      }
    }
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę lekcję?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        fetchLessons();
      } else {
        alert(result.error || "Nie udało się usunąć lekcji");
      }
    } catch (error) {
      console.error("Error deleting lesson:", error);
      alert("Wystąpił błąd");
    }
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingLesson(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingLesson(null);
    fetchLessons();
  };

  const toggleModuleExpansion = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  if (showForm) {
    return (
      <LessonForm
        courseId={courseId}
        lesson={editingLesson || undefined}
        onSave={handleFormClose}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Lekcje pogrupowane po modułach</CardTitle>
          <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Dodaj lekcję
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : modulesWithLessons.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>Brak modułów w tym kursie.</p>
              <p className="text-sm mt-2">Najpierw utwórz moduł w zakładce &quot;Moduły&quot;.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {modulesWithLessons.map((module) => {
                const isExpanded = expandedModules.has(module.id);
                return (
                  <div key={module.id} className="border border-white/10 rounded-lg overflow-hidden">
                    {/* Module Header */}
                    <div
                      className="bg-slate-700/30 p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
                      onClick={() => toggleModuleExpansion(module.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-white">{module.title}</h3>
                            {module.description && <p className="text-sm text-gray-400 mt-1">{module.description}</p>}
                          </div>
                        </div>
                        <div className="text-sm text-gray-400">
                          {module.lessons.length} {module.lessons.length === 1 ? "lekcja" : "lekcji"}
                        </div>
                      </div>
                    </div>

                    {/* Module Lessons */}
                    {isExpanded && (
                      <div className="p-4">
                        {module.lessons.length === 0 ? (
                          <div className="text-center py-8 text-gray-400">
                            <p className="text-sm">Brak lekcji w tym module.</p>
                          </div>
                        ) : (
                          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext
                              items={module.lessons.map((l) => l.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-2">
                                {module.lessons.map((lesson) => (
                                  <SortableLessonItem
                                    key={lesson.id}
                                    lesson={lesson}
                                    onEdit={() => handleEdit(lesson)}
                                    onDelete={() => handleDelete(lesson.id)}
                                    onPreview={() => setPreviewLesson(lesson)}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {previewLesson && <LessonPreview lesson={previewLesson} onClose={() => setPreviewLesson(null)} />}
    </div>
  );
}
