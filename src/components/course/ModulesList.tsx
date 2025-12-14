import { useState } from "react";
import { ChevronDown, ChevronRight, Check, Lock } from "lucide-react";
import type { ModuleWithLessons, LessonWithProgress } from "@/types";

interface ModulesListProps {
  modules: ModuleWithLessons[];
  currentLessonId?: string;
  onLessonClick: (lessonId: string) => void;
}

export function ModulesList({ modules, currentLessonId, onLessonClick }: ModulesListProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.map((m) => m.id))
  );

  const toggleModule = (moduleId: string) => {
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

  const calculateModuleProgress = (lessons: LessonWithProgress[]) => {
    if (lessons.length === 0) return 0;
    const completed = lessons.filter((l) => l.completed).length;
    return Math.round((completed / lessons.length) * 100);
  };

  return (
    <div className="space-y-2">
      {modules.map((module) => {
        const isExpanded = expandedModules.has(module.id);
        const progress = calculateModuleProgress(module.lessons);

        return (
          <div
            key={module.id}
            className="bg-slate-800/50 border border-white/10 rounded-lg overflow-hidden"
          >
            {/* Module Header */}
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full p-4 flex items-center gap-3 hover:bg-slate-700/30 transition-colors text-left"
            >
              <div className="text-gray-400">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm truncate">{module.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{progress}%</span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {module.lessons.length} {module.lessons.length === 1 ? "lekcja" : "lekcji"}
              </div>
            </button>

            {/* Module Lessons */}
            {isExpanded && (
              <div className="border-t border-white/10">
                {module.lessons.map((lesson) => {
                  const isCurrent = lesson.id === currentLessonId;
                  const isAccessible = lesson.is_accessible;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => isAccessible && onLessonClick(lesson.id)}
                      disabled={!isAccessible}
                      className={`
                        w-full p-3 flex items-center gap-3 transition-colors text-left
                        ${isCurrent ? "bg-blue-600/20 border-l-2 border-blue-500" : "border-l-2 border-transparent"}
                        ${isAccessible ? "hover:bg-slate-700/30 cursor-pointer" : "opacity-50 cursor-not-allowed"}
                      `}
                    >
                      <span className="text-xl">{getLessonTypeIcon(lesson.type)}</span>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{lesson.title}</div>
                        <div className="text-xs text-gray-400 capitalize mt-0.5">
                          {lesson.type === "quiz" ? "Quiz" : "Treść"}
                        </div>
                      </div>

                      {lesson.completed && (
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-400" />
                        </div>
                      )}

                      {!isAccessible && (
                        <div className="flex-shrink-0">
                          <Lock className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
