interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
}

export function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  const getEmbedUrl = (url: string): string | null => {
    // Vimeo - match vimeo.com/123456789
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // YouTube - match youtube.com/watch?v=abc123 or youtu.be/abc123
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    return null;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  if (!embedUrl) {
    return (
      <div className="w-full p-6 rounded-lg bg-red-500/10 border border-red-500/50">
        <p className="text-red-400 text-center">
          Nieprawidłowy URL wideo. Obsługiwane platformy: Vimeo, YouTube
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden bg-black/50"
      style={{ paddingBottom: "56.25%" }}
    >
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={embedUrl}
        title={title || "Video"}
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
