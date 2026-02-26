import { create } from 'zustand';
import type { NickEntry } from './types';

interface NicklistStore {
  nicklists: Record<string, NickEntry[]>;
  setNicklist: (bufferId: string, nicks: NickEntry[]) => void;
  applyDiff: (bufferId: string, diffs: Array<{ op: '+' | '-' | '*'; nick: NickEntry }>) => void;
  clearNicklist: (bufferId: string) => void;
  clearAll: () => void;
}

export const useNicklistStore = create<NicklistStore>((set) => ({
  nicklists: {},
  setNicklist: (bufferId, nicks) =>
    set((s) => ({
      nicklists: { ...s.nicklists, [bufferId]: nicks },
    })),
  applyDiff: (bufferId, diffs) =>
    set((s) => {
      const current = [...(s.nicklists[bufferId] ?? [])];
      for (const diff of diffs) {
        if (diff.op === '+') {
          current.push(diff.nick);
        } else if (diff.op === '-') {
          const idx = current.findIndex((n) => n.name === diff.nick.name);
          if (idx !== -1) current.splice(idx, 1);
        } else if (diff.op === '*') {
          const idx = current.findIndex((n) => n.name === diff.nick.name);
          if (idx !== -1) {
            current[idx] = diff.nick;
          }
        }
      }
      return { nicklists: { ...s.nicklists, [bufferId]: current } };
    }),
  clearNicklist: (bufferId) =>
    set((s) => ({
      nicklists: { ...s.nicklists, [bufferId]: [] },
    })),
  clearAll: () => set({ nicklists: {} }),
}));
