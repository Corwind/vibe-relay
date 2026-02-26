import { memo } from 'react';
import type { DetectedMedia } from '@/lib/url-detector';

interface MediaEmbedProps {
  media: DetectedMedia;
}

export const MediaEmbed = memo(function MediaEmbed({ media }: MediaEmbedProps) {
  switch (media.type) {
    case 'image':
      return (
        <a href={media.url} target="_blank" rel="noopener noreferrer" className="block mt-1">
          <img
            src={media.url}
            alt="Embedded image"
            loading="lazy"
            className="max-w-md max-h-80 rounded border border-border object-contain"
          />
        </a>
      );

    case 'video':
      return (
        <video
          src={media.url}
          controls
          preload="metadata"
          className="mt-1 max-w-md max-h-80 rounded border border-border"
        />
      );

    case 'youtube':
      if (!media.youtubeId) return null;
      return (
        <div className="mt-1 max-w-md">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${media.youtubeId}`}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="w-full aspect-video rounded border border-border"
          />
        </div>
      );

    default:
      return null;
  }
});
