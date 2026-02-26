import { useMemo } from 'react';
import { useBufferStore } from '@/store/buffer-store';
import type { WeechatBuffer } from '@/store/types';

export function useBuffers(filter?: string): WeechatBuffer[] {
  const buffers = useBufferStore((s) => s.buffers);

  return useMemo(() => {
    let list = Object.values(buffers);

    if (filter) {
      const lower = filter.toLowerCase();
      list = list.filter(
        (b) =>
          b.shortName.toLowerCase().includes(lower) || b.fullName.toLowerCase().includes(lower),
      );
    }

    return list.sort((a, b) => a.number - b.number);
  }, [buffers, filter]);
}
