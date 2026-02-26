import { create } from 'zustand';
import type { NickEntry } from './types';

interface NicklistStore {
  nicklists: Record<string, NickEntry[]>;
  setNicklist: (bufferId: string, nicks: NickEntry[]) => void;
  clearNicklist: (bufferId: string) => void;
  clearAll: () => void;
}

export const useNicklistStore = create<NicklistStore>((set) => ({
  nicklists: {},
  setNicklist: (bufferId, nicks) =>
    set((s) => ({
      nicklists: { ...s.nicklists, [bufferId]: nicks },
    })),
  clearNicklist: (bufferId) =>
    set((s) => ({
      nicklists: { ...s.nicklists, [bufferId]: [] },
    })),
  clearAll: () => set({ nicklists: {} }),
}));
