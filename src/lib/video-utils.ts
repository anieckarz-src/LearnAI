/**
 * Video utility functions for extracting thumbnails and metadata from video URLs
 * Supports YouTube and Vimeo
 */

export interface VideoInfo {
  thumbnail: string | null;
  provider: "youtube" | "vimeo" | "unknown";
  videoId: string | null;
  embedUrl: string | null;
}

/**
 * Extract YouTube video ID from various URL formats
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract Vimeo video ID from various URL formats
 * Supports: vimeo.com/ID, player.vimeo.com/video/ID
 */
function extractVimeoId(url: string): string | null {
  const patterns = [/vimeo\.com\/(\d+)/, /player\.vimeo\.com\/video\/(\d+)/];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Get YouTube thumbnail URL
 * Uses maxresdefault for best quality, falls back to hqdefault
 */
function getYouTubeThumbnail(videoId: string): string {
  // Try maxresdefault first (1920x1080), but not all videos have it
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/**
 * Get Vimeo thumbnail URL using oEmbed API
 */
async function getVimeoThumbnail(videoId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.thumbnail_url || null;
  } catch (error) {
    console.error("Error fetching Vimeo thumbnail:", error);
    return null;
  }
}

/**
 * Get video embed URL for iframe
 */
export function getVideoEmbedUrl(url: string): string | null {
  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}`;
  }

  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}`;
  }

  return null;
}

/**
 * Main function to get video thumbnail from URL
 */
export async function getVideoThumbnail(url: string): Promise<string | null> {
  if (!url || typeof url !== "string") {
    return null;
  }

  // Check for YouTube
  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    return getYouTubeThumbnail(youtubeId);
  }

  // Check for Vimeo
  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return await getVimeoThumbnail(vimeoId);
  }

  return null;
}

/**
 * Get comprehensive video information
 */
export async function getVideoInfo(url: string): Promise<VideoInfo> {
  if (!url || typeof url !== "string") {
    return {
      thumbnail: null,
      provider: "unknown",
      videoId: null,
      embedUrl: null,
    };
  }

  // Check for YouTube
  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    return {
      thumbnail: getYouTubeThumbnail(youtubeId),
      provider: "youtube",
      videoId: youtubeId,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    };
  }

  // Check for Vimeo
  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    const thumbnail = await getVimeoThumbnail(vimeoId);
    return {
      thumbnail,
      provider: "vimeo",
      videoId: vimeoId,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
    };
  }

  return {
    thumbnail: null,
    provider: "unknown",
    videoId: null,
    embedUrl: null,
  };
}

/**
 * Validate if URL is a supported video platform
 */
export function isValidVideoUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  return extractYouTubeId(url) !== null || extractVimeoId(url) !== null;
}
