import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Lesson } from "@/types";
import { X, FileText, Video, Image as ImageIcon } from "lucide-react";

interface LessonPreviewProps {
  lesson: Lesson;
  onClose: () => void;
}

export function LessonPreview({ lesson, onClose }: LessonPreviewProps) {
  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return FileText;
      case "video":
        return Video;
      case "image":
        return ImageIcon;
      default:
        return FileText;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="bg-slate-800 border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-white/10 sticky top-0 bg-slate-800 z-10 flex flex-row items-center justify-between">
          <CardTitle className="text-white">{lesson.title}</CardTitle>
          <Button size="sm" variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Content */}
          {lesson.content && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Treść lekcji</h3>
              <div
                className="prose prose-invert max-w-none text-gray-300"
                dangerouslySetInnerHTML={{ __html: lesson.content }}
              />
            </div>
          )}

          {/* Materials */}
          {lesson.materials && lesson.materials.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Materiały</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {lesson.materials.map((material) => {
                  const Icon = getFileIcon(material.type);
                  return (
                    <a
                      key={material.id}
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 border border-white/10 hover:border-blue-500/50 transition-colors group"
                    >
                      <div className="flex-shrink-0">
                        <Icon className="w-6 h-6 text-blue-400 group-hover:text-blue-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate group-hover:text-blue-300">
                          {material.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {material.type.toUpperCase()} • {formatFileSize(material.size)}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Video previews */}
          {lesson.materials && lesson.materials.filter((m) => m.type === "video").length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Podgląd wideo</h3>
              <div className="space-y-3">
                {lesson.materials
                  .filter((m) => m.type === "video")
                  .map((material) => (
                    <div key={material.id} className="rounded-lg overflow-hidden bg-black">
                      <video controls className="w-full" src={material.url}>
                        Twoja przeglądarka nie obsługuje odtwarzania wideo.
                      </video>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
