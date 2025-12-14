import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { ModuleForm } from "./ModuleForm";
import type { Module, Lesson } from "@/types";

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
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchModules();
  }, [courseId]);

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
    setEditingModule(null);
    setShowModuleForm(true);
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setShowModuleForm(true);
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

      fetchModules();
    } catch (err) {
      console.error("Error deleting module:", err);
      alert(err instanceof Error ? err.message : "Wystąpił błąd podczas usuwania modułu");
    }
  };

  const handleFormSave = () => {
    setShowModuleForm(false);
    setEditingModule(null);
    fetchModules();
  };

  const handleFormCancel = () => {
    setShowModuleForm(false);
    setEditingModule(null);
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

  const getLessonTypeIcon = (type: string) => {
    return type === "quiz" ? "❓" : "🎬";
  };

  if (showModuleForm) {
    return (
      <ModuleForm
        courseId={courseId}
        module={editingModule || undefined}
        onSave={handleFormSave}
        onCancel={handleFormCancel}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Moduły kursu</h2>
        <Button onClick={handleAddModule} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Dodaj moduł
        </Button>
      </div>

      {modules.length === 0 ? (
        <Card className="bg-slate-800/50 border-white/10">
          <CardContent className="p-8 text-center text-gray-400">
            <p>Brak modułów. Kliknij "Dodaj moduł" aby utworzyć pierwszy moduł.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {modules.map((module) => {
            const isExpanded = expandedModules.has(module.id);
            return (
              <Card key={module.id} className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleModuleExpansion(module.id)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                      <GripVertical className="w-5 h-5 text-gray-500 cursor-move" />
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg">{module.title}</CardTitle>
                        {module.description && (
                          <p className="text-sm text-gray-400 mt-1">{module.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {module.lessons.length} {module.lessons.length === 1 ? "lekcja" : "lekcji"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditModule(module)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteModule(module.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && module.lessons.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="border-t border-white/10 pt-3">
                      <div className="space-y-2">
                        {module.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                          >
                            <span className="text-xl">{getLessonTypeIcon(lesson.type)}</span>
                            <span className="text-white text-sm flex-1">{lesson.title}</span>
                            <span className="text-xs text-gray-500 capitalize">{lesson.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
