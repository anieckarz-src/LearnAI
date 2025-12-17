import type { LessonWithProgress, LessonFile } from "@/types";
import { FileText, Download } from "lucide-react";

interface LessonContentProps {
  lesson: LessonWithProgress;
}

export function LessonContent({ lesson }: LessonContentProps) {
  const renderVideoPlayer = (videoUrl: string) => {
    // Check if it's a Vimeo URL
    if (videoUrl.includes("vimeo.com")) {
      const vimeoId = videoUrl.split("/").pop()?.split("?")[0];
      return (
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Check if it's a YouTube URL
    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      let youtubeId = "";
      if (videoUrl.includes("youtu.be/")) {
        youtubeId = videoUrl.split("youtu.be/")[1].split("?")[0];
      } else if (videoUrl.includes("youtube.com/watch?v=")) {
        youtubeId = videoUrl.split("v=")[1].split("&")[0];
      }

      return (
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Fallback for other video URLs
    return (
      <video controls className="w-full rounded-lg">
        <source src={videoUrl} />
        Twoja przeglądarka nie obsługuje odtwarzania wideo.
      </video>
    );
  };

  const renderFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="w-5 h-5 text-red-400" />;
      case "image":
        return <FileText className="w-5 h-5 text-blue-400" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Render based on lesson type
  if (lesson.type === "quiz") {
    // Quiz type - show quiz interface
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-white/10 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">❓</span>
            <div>
              <h2 className="text-2xl font-bold text-white">{lesson.title}</h2>
              <p className="text-gray-400">Lekcja typu Quiz</p>
            </div>
          </div>

          {lesson.quiz ? (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-blue-300">
                  Ta lekcja zawiera quiz sprawdzający Twoją wiedzę. Aby ukończyć tę lekcję, musisz zdać quiz.
                </p>
              </div>

              <div className="flex items-center justify-between bg-slate-700/30 rounded-lg p-4">
                <div>
                  <h3 className="text-white font-semibold">{lesson.quiz.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">Liczba pytań: {lesson.quiz.questions?.length || 0}</p>
                  {lesson.quiz.passing_score && (
                    <p className="text-sm text-gray-400">Wymagany wynik: {lesson.quiz.passing_score}%</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    window.location.href = `/quizzes/${lesson.quiz?.id}/take`;
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Rozpocznij Quiz
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-yellow-300">
                Quiz dla tej lekcji nie został jeszcze utworzony. Skontaktuj się z administratorem.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Content type - show video, text, and files
  return (
    <div className="space-y-6">
      {/* Video */}
      {lesson.video_url && (
        <div className="bg-slate-800/50 border border-white/10 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎬</span>
            <h3 className="text-lg font-semibold text-white">Wideo</h3>
          </div>
          {renderVideoPlayer(lesson.video_url)}
        </div>
      )}

      {/* Text Content */}
      {lesson.content && lesson.content.trim().length > 0 && (
        <div className="bg-slate-800/50 border border-white/10 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📝</span>
            <h3 className="text-lg font-semibold text-white">Treść lekcji</h3>
          </div>
          <div
            className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-a:text-blue-400 prose-strong:text-white prose-ul:text-gray-300 prose-ol:text-gray-300"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        </div>
      )}

      {/* Files */}
      {lesson.files && lesson.files.length > 0 && (
        <div className="bg-slate-800/50 border border-white/10 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📎</span>
            <h3 className="text-lg font-semibold text-white">Materiały do pobrania</h3>
          </div>
          <div className="space-y-2">
            {lesson.files.map((file: LessonFile) => (
              <a
                key={file.id}
                href={file.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors group"
              >
                {renderFileIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                </div>
                <Download className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!lesson.video_url &&
        (!lesson.content || lesson.content.trim().length === 0) &&
        (!lesson.files || lesson.files.length === 0) && (
          <div className="bg-slate-800/50 border border-white/10 rounded-lg p-12 text-center">
            <p className="text-gray-400">Brak treści dla tej lekcji.</p>
          </div>
        )}
    </div>
  );
}
