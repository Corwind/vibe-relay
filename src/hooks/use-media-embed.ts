import { useMemo } from 'react';
import { detectMedia, type DetectedMedia } from '@/lib/url-detector';
import { useSettingsStore } from '@/store/settings-store';

export function useMediaEmbed(text: string): DetectedMedia[] {
  const mediaPreview = useSettingsStore((s) => s.mediaPreview);

  return useMemo(() => {
    if (!mediaPreview) return [];
    return detectMedia(text);
  }, [text, mediaPreview]);
}
