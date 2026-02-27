import { create } from 'zustand';

const BATCH_SIZE = 100;

interface BufferHistoryState {
  loadingOlder: boolean;
  hasMoreMessages: boolean;
  fetchedCount: number;
}

interface HistoryStore {
  buffers: Record<string, BufferHistoryState>;

  getBufferState: (bufferId: string) => BufferHistoryState;
  startLoading: (bufferId: string) => void;
  finishLoading: (bufferId: string, receivedNewMessages: boolean) => void;
  resetBuffer: (bufferId: string) => void;
  resetAll: () => void;
}

const DEFAULT_STATE: BufferHistoryState = {
  loadingOlder: false,
  hasMoreMessages: true,
  fetchedCount: BATCH_SIZE,
};

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  buffers: {},

  getBufferState: (bufferId) => {
    return get().buffers[bufferId] ?? DEFAULT_STATE;
  },

  startLoading: (bufferId) =>
    set((s) => {
      const current = s.buffers[bufferId] ?? { ...DEFAULT_STATE };
      return {
        buffers: {
          ...s.buffers,
          [bufferId]: {
            ...current,
            loadingOlder: true,
            fetchedCount: current.fetchedCount + BATCH_SIZE,
          },
        },
      };
    }),

  finishLoading: (bufferId, receivedNewMessages) =>
    set((s) => {
      const current = s.buffers[bufferId] ?? { ...DEFAULT_STATE };
      return {
        buffers: {
          ...s.buffers,
          [bufferId]: {
            ...current,
            loadingOlder: false,
            hasMoreMessages: receivedNewMessages,
          },
        },
      };
    }),

  resetBuffer: (bufferId) =>
    set((s) => {
      const rest = Object.fromEntries(
        Object.entries(s.buffers).filter(([key]) => key !== bufferId),
      );
      return { buffers: rest };
    }),

  resetAll: () => set({ buffers: {} }),
}));

export { BATCH_SIZE, DEFAULT_STATE };
export type { BufferHistoryState };
