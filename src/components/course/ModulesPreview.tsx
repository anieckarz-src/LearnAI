import { useState } from "react";
import { ChevronDown, ChevronRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CoursePreviewData } from "@/types";

interface ModulesPreviewProps {
  preview: CoursePreviewData;
}

export function ModulesPreview({ preview }: ModulesPreviewProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(preview.modules.map((m) => m.id))
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

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {preview.stats.total_modules}
          </div>
          <div className="text-xs text-gray-400">
            {preview.stats.total_modules === 1 ? "Moduł" : "Moduły"}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {preview.stats.total_lessons}
          </div>
          <div className="text-xs text-gray-400">
            {preview.stats.total_lessons === 1 ? "Lekcja" : "Lekcje"}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {preview.stats.total_quizzes}
          </div>
          <div className="text-xs text-gray-400">
            {preview.stats.total_quizzes === 1 ? "Quiz" : "Quizy"}
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-2">
        {preview.modules.map((module) => {
          const isExpanded = expandedModules.has(module.id);

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
                  <h3 className="text-white font-semibold text-sm truncate">
                    {module.title}
                  </h3>
                  {module.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {module.description}
                    </p>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {module.lessons.length}{" "}
                  {module.lessons.length === 1 ? "lekcja" : "lekcji"}
                </div>
              </button>

              {/* Module Lessons */}
              {isExpanded && (
                <div className="border-t border-white/10">
                  {module.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="p-3 flex items-center gap-3 border-l-2 border-transparent opacity-75"
                    >
                      <span className="text-xl">{getLessonTypeIcon(lesson.type)}</span>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{lesson.title}</div>
                        <div className="text-xs text-gray-400 capitalize mt-0.5">
                          {lesson.type === "quiz" ? "Quiz" : "Treść"}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <Lock className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA Message */}
      <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-6 text-center">
        <p className="text-blue-400 font-medium mb-4">
          💡 Zapisz się na kurs, aby rozpocząć naukę i uzyskać dostęp do wszystkich lekcji
        </p>
      </div>
    </div>
  );
}
