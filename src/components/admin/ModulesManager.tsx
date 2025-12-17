import { useState, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineModuleForm } from "./InlineModuleForm";
import { SortableModuleItem } from "./SortableModuleItem";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";
import type { Lesson, Module } from "@/types";
import { Plus, Loader2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";

interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

interface ModulesManagerProps {
  courseId: string;
}

export function ModulesManager({ courseId }: ModulesManagerProps) {
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // State for inline module management
  const [addingNewModule, setAddingNewModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  // State for inline lesson management
  const [addingLessonToModule, setAddingLessonToModule] = useState<string | null>(null);
  const [insertLessonPosition, setInsertLessonPosition] = useState<number>(0);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [expandedLessonDetails, setExpandedLessonDetails] = useState<Set<string>>(new Set());

  // State for drag and drop
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"module" | "lesson" | null>(null);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchModules();
  }, [courseId]);

  // Keyboard shortcuts
  useHotkeys(
    "ctrl+m,cmd+m",
    (e) => {
      e.preventDefault();
      if (!addingNewModule && !editingModuleId && !editingLessonId && !addingLessonToModule) {
        handleAddModule();
      }
    },
    { enableOnFormTags: false }
  );

  useHotkeys(
    "escape",
    (e) => {
      e.preventDefault();
      if (addingNewModule) {
        setAddingNewModule(false);
      } else if (editingModuleId) {
        setEditingModuleId(null);
      } else if (editingLessonId) {
        handleCancelEditLesson();
      } else if (addingLessonToModule) {
        handleCancelNewLesson();
      }
    },
    { enableOnFormTags: true }
  );

  // Bulk actions: Expand/Collapse all modules
  const handleExpandAll = () => {
    setExpandedModules(new Set(modules.map((m) => m.id)));
    toast.success("Wszystkie moduły zostały rozwinięte");
  };

  const handleCollapseAll = () => {
    setExpandedModules(new Set());
    toast.success("Wszystkie moduły zostały zwinięte");
  };

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError(null);

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
      const modulesWithLessons = modulesResult.data.map((module: Module) => ({
        ...module,
        lessons: lessonsResult.data.filter((lesson: Lesson) => lesson.module_id === module.id),
      }));

      setModules(modulesWithLessons);
    } catch (err) {
      console.error("Error fetching modules:", err);
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas ładowania modułów");
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = () => {
    setAddingNewModule(true);
  };

  const handleEditModule = (moduleId: string) => {
    setEditingModuleId(moduleId);
  };

  const handleSaveModule = async (moduleData: Module) => {
    // Optimistically update state without full refresh
    if (editingModuleId) {
      // Update existing module
      setModules(modules.map((m) => (m.id === moduleData.id ? { ...m, ...moduleData } : m)));
    } else {
      // Add new module
      setModules([...modules, { ...moduleData, lessons: [] }]);
    }
    setAddingNewModule(false);
    setEditingModuleId(null);
  };

  const handleCancelModule = () => {
    setAddingNewModule(false);
    setEditingModuleId(null);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten moduł? Ta operacja jest nieodwracalna.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      // Remove module from state without full refresh
      setModules(modules.filter((m) => m.id !== moduleId));

      toast.success("Moduł został usunięty", {
        description: "Moduł i wszystkie jego lekcje zostały usunięte.",
      });
    } catch (err) {
      console.error("Error deleting module:", err);
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd podczas usuwania modułu";
      toast.error("Błąd usuwania modułu", {
        description: errorMessage,
      });
    }
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

  const handleAddLesson = (moduleId: string) => {
    // Expand module if collapsed
    if (!expandedModules.has(moduleId)) {
      setExpandedModules(new Set([...expandedModules, moduleId]));
    }
    setAddingLessonToModule(moduleId);
    setInsertLessonPosition(0); // Default to beginning
  };

  const handleAddLessonAt = (moduleId: string, position: number) => {
    // Expand module if collapsed
    if (!expandedModules.has(moduleId)) {
      setExpandedModules(new Set([...expandedModules, moduleId]));
    }
    setAddingLessonToModule(moduleId);
    setInsertLessonPosition(position);
  };

  const handleSaveNewLesson = async (lessonData: Lesson) => {
    // Optimistically add the lesson to the module at the correct position
    setModules(
      modules.map((module) => {
        if (module.id === lessonData.module_id) {
          const updatedLessons = [...module.lessons];
          // Insert at the specified position
          updatedLessons.splice(insertLessonPosition, 0, lessonData);
          // Renumber order_index for all lessons
          updatedLessons.forEach((lesson, index) => {
            lesson.order_index = index;
          });
          return { ...module, lessons: updatedLessons };
        }
        return module;
      })
    );
    setAddingLessonToModule(null);
    setInsertLessonPosition(0);
  };

  const handleCancelNewLesson = () => {
    setAddingLessonToModule(null);
    setInsertLessonPosition(0);
  };

  const handleToggleLessonExpand = (lessonId: string) => {
    const newExpanded = new Set(expandedLessonDetails);
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId);
    } else {
      newExpanded.add(lessonId);
    }
    setExpandedLessonDetails(newExpanded);
  };

  const handleEditLesson = (lessonId: string) => {
    setEditingLessonId(lessonId);
    // Collapse details when editing
    const newExpanded = new Set(expandedLessonDetails);
    newExpanded.delete(lessonId);
    setExpandedLessonDetails(newExpanded);
  };

  const handleSaveEditLesson = async (lessonData: Lesson) => {
    // Optimistically update the lesson
    setModules(
      modules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) => (lesson.id === lessonData.id ? lessonData : lesson)),
      }))
    );
    setEditingLessonId(null);
  };

  const handleCancelEditLesson = () => {
    setEditingLessonId(null);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę lekcję?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        // Remove lesson from state without full refresh
        setModules(
          modules.map((module) => ({
            ...module,
            lessons: module.lessons.filter((l) => l.id !== lessonId),
          }))
        );

        toast.success("Lekcja została usunięta", {
          description: "Lekcja została pomyślnie usunięta.",
        });
      } else {
        throw new Error(result.error || "Nie udało się usunąć lekcji");
      }
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast.error("Błąd usuwania lekcji", {
        description: error instanceof Error ? error.message : "Wystąpił błąd",
      });
    }
  };

  const handleDuplicateModule = async (moduleId: string) => {
    try {
      const response = await fetch("/api/admin/modules/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_id: moduleId, include_lessons: true }),
      });

      const result = await response.json();
      if (result.success) {
        // Add the new module to state optimistically
        const newModule = result.data.module;
        const newLessons = result.data.lessons || [];
        setModules([...modules, { ...newModule, lessons: newLessons }]);

        toast.success("Moduł został zduplikowany", {
          description: `Utworzono kopię modułu z ${newLessons.length} lekcjami.`,
        });
      } else {
        throw new Error(result.error || "Nie udało się zduplikować modułu");
      }
    } catch (error) {
      console.error("Error duplicating module:", error);
      toast.error("Błąd duplikowania modułu", {
        description: error instanceof Error ? error.message : "Wystąpił błąd",
      });
    }
  };

  const handleDuplicateLesson = async (lessonId: string) => {
    try {
      const response = await fetch("/api/admin/lessons/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson_id: lessonId }),
      });

      const result = await response.json();
      if (result.success) {
        // Add the new lesson to the appropriate module in state
        const newLesson = result.data;
        setModules(
          modules.map((module) =>
            module.id === newLesson.module_id ? { ...module, lessons: [...module.lessons, newLesson] } : module
          )
        );

        toast.success("Lekcja została zduplikowana", {
          description: "Utworzono kopię lekcji.",
        });
      } else {
        throw new Error(result.error || "Nie udało się zduplikować lekcji");
      }
    } catch (error) {
      console.error("Error duplicating lesson:", error);
      toast.error("Błąd duplikowania lekcji", {
        description: error instanceof Error ? error.message : "Wystąpił błąd",
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Determine if dragging a module or lesson
    const isModule = modules.some((m) => m.id === active.id);
    setActiveType(isModule ? "module" : "lesson");
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Simplified: Let DndContext handle collision detection
    // All movement logic is handled in handleDragEnd
  };

  const findLessonById = (lessonId: string): Lesson | null => {
    for (const module of modules) {
      const lesson = module.lessons.find((l) => l.id === lessonId);
      if (lesson) return lesson;
    }
    return null;
  };

  const findModuleByLessonId = (lessonId: string): string | null => {
    for (const module of modules) {
      if (module.lessons.some((l) => l.id === lessonId)) {
        return module.id;
      }
    }
    return null;
  };

  const moveLessonBetweenModules = (lessonId: string, targetModuleId: string) => {
    const sourceModuleId = findModuleByLessonId(lessonId);
    if (!sourceModuleId || sourceModuleId === targetModuleId) return;

    const sourceModule = modules.find((m) => m.id === sourceModuleId);
    const targetModule = modules.find((m) => m.id === targetModuleId);
    if (!sourceModule || !targetModule) return;

    const lesson = sourceModule.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    // Remove from source
    const newSourceLessons = sourceModule.lessons.filter((l) => l.id !== lessonId);

    // Add to target
    const newTargetLessons = [...targetModule.lessons, lesson];

    // Update state
    setModules(
      modules.map((m) => {
        if (m.id === sourceModuleId) {
          return { ...m, lessons: newSourceLessons };
        }
        if (m.id === targetModuleId) {
          return { ...m, lessons: newTargetLessons };
        }
        return m;
      })
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over || active.id === over.id) return;

    if (activeType === "module") {
      // Handle module reordering
      const oldIndex = modules.findIndex((m) => m.id === active.id);
      const newIndex = modules.findIndex((m) => m.id === over.id);

      const reorderedModules = arrayMove(modules, oldIndex, newIndex);
      setModules(reorderedModules);

      try {
        const response = await fetch("/api/admin/modules/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            module_orders: reorderedModules.map((m, i) => ({ id: m.id, order_index: i })),
          }),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error("Error reordering modules:", error);
        fetchModules();
      }
    } else if (activeType === "lesson") {
      const sourceModuleId = findModuleByLessonId(active.id as string);
      const targetModuleId = modules.find((m) => m.id === over.id)?.id || findModuleByLessonId(over.id as string);

      if (!sourceModuleId || !targetModuleId) return;

      if (sourceModuleId === targetModuleId) {
        // Same module reordering
        const module = modules.find((m) => m.id === sourceModuleId);
        if (!module) return;

        const oldIndex = module.lessons.findIndex((l) => l.id === active.id);
        const newIndex = module.lessons.findIndex((l) => l.id === over.id);

        const newLessons = arrayMove(module.lessons, oldIndex, newIndex);

        setModules(modules.map((m) => (m.id === sourceModuleId ? { ...m, lessons: newLessons } : m)));

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
          fetchModules();
        }
      } else {
        // Cross-module move
        const targetModule = modules.find((m) => m.id === targetModuleId);
        if (!targetModule) return;

        const newOrderIndex = targetModule.lessons.length;

        try {
          const response = await fetch(`/api/admin/lessons/${active.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              module_id: targetModuleId,
              order_index: newOrderIndex,
            }),
          });

          const result = await response.json();
          if (!result.success) {
            throw new Error(result.error);
          }

          // Refresh to get accurate state
          fetchModules();
        } catch (error) {
          console.error("Error moving lesson:", error);
          fetchModules();
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-slate-800/50 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-4 h-4" />
                  <Skeleton className="w-4 h-4" />
                  <Skeleton className="h-6 flex-1" />
                  <Skeleton className="w-16 h-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-white">Moduły kursu</h2>
          <p className="text-sm text-gray-400 mt-0.5">Zarządzaj modułami i lekcjami w tym kursie</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Keyboard shortcuts button */}
          <KeyboardShortcutsDialog />

          {/* Bulk actions */}
          {modules.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExpandAll}
                className="text-gray-400 hover:text-white border-white/10"
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                Rozwiń wszystkie
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCollapseAll}
                className="text-gray-400 hover:text-white border-white/10"
              >
                <ChevronUp className="w-4 h-4 mr-2" />
                Zwiń wszystkie
              </Button>
            </>
          )}

          <Button onClick={handleAddModule} className="bg-blue-600 hover:bg-blue-700 transition-all duration-200">
            <Plus className="w-4 h-4 mr-2" />
            Dodaj moduł
          </Button>
        </div>
      </div>

      {/* Inline form for adding new module */}
      {addingNewModule && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <InlineModuleForm courseId={courseId} onSave={handleSaveModule} onCancel={handleCancelModule} />
        </div>
      )}

      {modules.length === 0 && !addingNewModule ? (
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-300 font-medium mb-2">Brak modułów w tym kursie</p>
              <p className="text-gray-500 text-sm mb-6">
                Zacznij od utworzenia pierwszego modułu. Moduły pomagają zorganizować lekcje w logiczne grupy.
              </p>
              <Button onClick={handleAddModule} className="bg-blue-600 hover:bg-blue-700 transition-all duration-200">
                <Plus className="w-4 h-4 mr-2" />
                Utwórz pierwszy moduł
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <div>
              {modules.map((module) => {
                const isEditingThisModule = editingModuleId === module.id;

                // If editing this module, show inline form
                if (isEditingThisModule) {
                  return (
                    <div key={module.id} className="animate-in slide-in-from-top-2 duration-200">
                      <InlineModuleForm
                        courseId={courseId}
                        module={module}
                        onSave={handleSaveModule}
                        onCancel={handleCancelModule}
                      />
                    </div>
                  );
                }

                return (
                  <SortableModuleItem
                    key={module.id}
                    module={module}
                    courseId={courseId}
                    isExpanded={expandedModules.has(module.id)}
                    isAddingLesson={addingLessonToModule === module.id}
                    insertPosition={addingLessonToModule === module.id ? insertLessonPosition : null}
                    editingLessonId={editingLessonId}
                    expandedLessonDetails={expandedLessonDetails}
                    onToggleExpansion={() => toggleModuleExpansion(module.id)}
                    onAddLesson={() => handleAddLesson(module.id)}
                    onAddLessonAt={(position: number) => handleAddLessonAt(module.id, position)}
                    onEditModule={() => handleEditModule(module.id)}
                    onDeleteModule={() => handleDeleteModule(module.id)}
                    onSaveNewLesson={handleSaveNewLesson}
                    onCancelNewLesson={handleCancelNewLesson}
                    onToggleLessonExpand={handleToggleLessonExpand}
                    onEditLesson={handleEditLesson}
                    onDeleteLesson={handleDeleteLesson}
                    onSaveEditLesson={handleSaveEditLesson}
                    onCancelEditLesson={handleCancelEditLesson}
                    onLessonDragEnd={() => {}}
                    onDuplicateModule={() => handleDuplicateModule(module.id)}
                    onDuplicateLesson={handleDuplicateLesson}
                  />
                );
              })}
            </div>
          </SortableContext>

          <DragOverlay
            dropAnimation={{
              duration: 200,
              easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
            }}
          >
            {activeId && activeType === "module" ? (
              <div className="opacity-90 rotate-2 scale-105 transition-all duration-200 shadow-2xl">
                <Card className="border-blue-500/50 shadow-xl bg-slate-800/50 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <div className="font-medium text-white">
                        {modules.find((m) => m.id === activeId)?.title || "Module"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : activeId && activeType === "lesson" ? (
              <div className="opacity-90 rotate-2 scale-105 transition-all duration-200 shadow-2xl">
                <div className="bg-slate-800/50 border border-blue-500/50 rounded-lg p-3 shadow-xl backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <div className="text-sm font-medium text-white">{findLessonById(activeId)?.title || "Lesson"}</div>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
