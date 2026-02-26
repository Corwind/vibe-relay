import { useEffect } from 'react';
import { useBufferStore } from '@/store/buffer-store';

const BASE_TITLE = 'relay-client';

export function useDocumentTitle() {
  const buffers = useBufferStore((s) => s.buffers);
  const activeBufferId = useBufferStore((s) => s.activeBufferId);

  useEffect(() => {
    const totalHighlights = Object.values(buffers).reduce(
      (sum, b) => sum + b.highlightCount,
      0,
    );

    const activeBuffer = activeBufferId ? buffers[activeBufferId] : null;
    const parts: string[] = [];

    if (totalHighlights > 0) {
      parts.push(`(${totalHighlights})`);
    }
    if (activeBuffer) {
      parts.push(`${activeBuffer.shortName} -`);
    }
    parts.push(BASE_TITLE);

    document.title = parts.join(' ');
  }, [buffers, activeBufferId]);
}
