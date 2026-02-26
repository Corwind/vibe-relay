const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|svg|bmp|ico)(\?[^\s]*)?$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov)(\?[^\s]*)?$/i;
const YOUTUBE_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?][^\s]*)?/;

export type MediaType = 'image' | 'video' | 'youtube';

export interface DetectedMedia {
  url: string;
  type: MediaType;
  youtubeId?: string;
}

export function detectMedia(text: string): DetectedMedia[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  const results: DetectedMedia[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0];
    if (seen.has(url)) continue;
    seen.add(url);

    const ytMatch = url.match(YOUTUBE_REGEX);
    if (ytMatch) {
      results.push({ url, type: 'youtube', youtubeId: ytMatch[1] });
    } else if (IMAGE_EXTENSIONS.test(url)) {
      results.push({ url, type: 'image' });
    } else if (VIDEO_EXTENSIONS.test(url)) {
      results.push({ url, type: 'video' });
    }
  }

  return results;
}
