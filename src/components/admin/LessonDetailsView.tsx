import { Button } from "@/components/ui/button";
import type { Lesson } from "@/types";
import { Edit, ChevronUp, Video, FileText, Files } from "lucide-react";

interface LessonDetailsViewProps {
  lesson: Lesson;
  onEdit: () => void;
  onClose: () => void;
}

export function LessonDetailsView({ lesson, onEdit, onClose }: LessonDetailsViewProps) {
  const getVideoEmbedUrl = (url: string): string | null => {
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    return null;
  };

  const embedUrl = lesson.video_url ? getVideoEmbedUrl(lesson.video_url) : null;

  return (
    <div className="bg-slate-800/50 border-white/10 backdrop-blur-sm rounded-lg p-4 space-y-4 border animate-in slide-in-from-top-2 duration-200">
      {/* Header with actions */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{lesson.type === "quiz" ? "❓" : "🎬"}</span>
            <h4 className="text-white font-semibold">{lesson.title}</h4>
          </div>
          <p className="text-sm text-gray-400 capitalize">Typ: {lesson.type === "quiz" ? "Quiz" : "Treść"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-all duration-200"
            title="Edytuj lekcję"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            title="Zwiń szczegóły"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content based on type */}
      {lesson.type === "content" && (
        <div className="space-y-3">
          {/* Video URL */}
          {lesson.video_url && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Video className="w-4 h-4" />
                <span>Video</span>
              </div>
              {embedUrl ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black animate-in fade-in duration-300">
                  <iframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="bg-slate-700/50 rounded-lg p-3 hover:bg-slate-700/70 transition-all duration-200">
                  <a
                    href={lesson.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm break-all transition-colors duration-200"
                  >
                    {lesson.video_url}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          {lesson.content && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <FileText className="w-4 h-4" />
                <span>Treść lekcji</span>
              </div>
              <div
                className="bg-slate-700/50 rounded-lg p-3 text-sm text-gray-300 prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: lesson.content }}
              />
            </div>
          )}

          {/* Files */}
          {lesson.files && lesson.files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Files className="w-4 h-4" />
                <span>Pliki ({lesson.files.length})</span>
              </div>
              <div className="space-y-2">
                {lesson.files.map((file, index) => (
                  <div
                    key={index}
                    className="bg-slate-700/50 rounded-lg p-2 flex items-center justify-between hover:bg-slate-700/70 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📎</span>
                      <div>
                        <p className="text-sm text-white">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB • {file.type}
                        </p>
                      </div>
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs transition-colors duration-200 opacity-0 group-hover:opacity-100"
                    >
                      Pobierz
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!lesson.video_url && !lesson.content && (!lesson.files || lesson.files.length === 0) && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-sm text-yellow-300">⚠️ Ta lekcja nie ma jeszcze żadnej treści.</p>
            </div>
          )}
        </div>
      )}

      {lesson.type === "quiz" && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-sm text-blue-300">💡 Lekcja typu Quiz. Zarządzanie quizem dostępne w osobnej sekcji.</p>
        </div>
      )}

      {/* Metadata */}
      <div className="pt-3 border-t border-white/10">
        <p className="text-xs text-gray-500">
          Utworzono:{" "}
          {new Date(lesson.created_at).toLocaleDateString("pl-PL", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
