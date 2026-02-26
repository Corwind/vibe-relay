import { create } from 'zustand';
import type { WeechatBuffer } from './types';

interface BufferStore {
  buffers: Record<string, WeechatBuffer>;
  activeBufferId: string | null;
  setBuffers: (buffers: Record<string, WeechatBuffer>) => void;
  addBuffer: (buffer: WeechatBuffer) => void;
  removeBuffer: (id: string) => void;
  updateBuffer: (id: string, partial: Partial<WeechatBuffer>) => void;
  setActiveBuffer: (id: string) => void;
  clearUnread: (id: string) => void;
}

export const useBufferStore = create<BufferStore>((set) => ({
  buffers: {},
  activeBufferId: null,
  setBuffers: (buffers) => set({ buffers }),
  addBuffer: (buffer) =>
    set((s) => ({
      buffers: { ...s.buffers, [buffer.id]: buffer },
    })),
  removeBuffer: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.buffers;
      return {
        buffers: rest,
        activeBufferId: s.activeBufferId === id ? null : s.activeBufferId,
      };
    }),
  updateBuffer: (id, partial) =>
    set((s) => {
      const existing = s.buffers[id];
      if (!existing) return s;
      return {
        buffers: { ...s.buffers, [id]: { ...existing, ...partial } },
      };
    }),
  setActiveBuffer: (id) => set({ activeBufferId: id }),
  clearUnread: (id) =>
    set((s) => {
      const existing = s.buffers[id];
      if (!existing) return s;
      return {
        buffers: {
          ...s.buffers,
          [id]: { ...existing, unreadCount: 0, highlightCount: 0 },
        },
      };
    }),
}));
