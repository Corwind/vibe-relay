import { useHistoryStore, DEFAULT_STATE } from '@/store/history-store';
import { useBufferStore } from '@/store/buffer-store';
import type { BufferHistoryState } from '@/store/history-store';

export function useHistoryState(): BufferHistoryState {
  const activeBufferId = useBufferStore((s) => s.activeBufferId);
  return useHistoryStore((s) => {
    if (!activeBufferId) return DEFAULT_STATE;
    return s.buffers[activeBufferId] ?? DEFAULT_STATE;
  });
}
