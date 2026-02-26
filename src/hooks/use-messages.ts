import { useMessageStore } from '@/store/message-store';
import { useBufferStore } from '@/store/buffer-store';
import type { WeechatMessage } from '@/store/types';

const EMPTY: WeechatMessage[] = [];

export function useMessages(): WeechatMessage[] {
  const activeBufferId = useBufferStore((s) => s.activeBufferId);
  return useMessageStore((s) => {
    if (!activeBufferId) return EMPTY;
    return s.messages[activeBufferId] ?? EMPTY;
  });
}
