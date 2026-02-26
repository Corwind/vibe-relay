import { useMemo } from 'react';
import { useMessageStore } from '@/store/message-store';
import { useBufferStore } from '@/store/buffer-store';
import type { WeechatMessage } from '@/store/types';

export function useMessages(): WeechatMessage[] {
  const activeBufferId = useBufferStore((s) => s.activeBufferId);
  const allMessages = useMessageStore((s) => s.messages);

  return useMemo(() => {
    if (!activeBufferId) return [];
    return allMessages[activeBufferId] ?? [];
  }, [activeBufferId, allMessages]);
}
