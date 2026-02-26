import { useEffect } from 'react';
import { useBufferStore } from '@/store/buffer-store';

interface KeyboardShortcutsOptions {
  onToggleSearch: () => void;
  onEscape: () => void;
}

export function useKeyboardShortcuts({ onToggleSearch, onEscape }: KeyboardShortcutsOptions) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Ctrl+K or Cmd+K: toggle buffer search
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onToggleSearch();
        return;
      }

      // Escape: close dialogs/overlays
      if (e.key === 'Escape') {
        onEscape();
        return;
      }

      // Skip Alt shortcuts when typing in inputs (except Ctrl+K above which is global)
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' && e.altKey) {
        // Allow Alt shortcuts even in textarea
      } else if (
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT') &&
        !e.altKey
      ) {
        return;
      }

      // Alt+ArrowUp / Alt+ArrowDown: switch buffers
      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const state = useBufferStore.getState();
        const sorted = Object.values(state.buffers).sort((a, b) => a.number - b.number);
        if (sorted.length === 0) return;

        const currentIdx = sorted.findIndex((b) => b.id === state.activeBufferId);
        let nextIdx: number;

        if (e.key === 'ArrowUp') {
          nextIdx = currentIdx <= 0 ? sorted.length - 1 : currentIdx - 1;
        } else {
          nextIdx = currentIdx >= sorted.length - 1 ? 0 : currentIdx + 1;
        }

        useBufferStore.getState().setActiveBuffer(sorted[nextIdx].id);
        return;
      }

      // Alt+1-9: jump to buffer by number
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const num = parseInt(e.key, 10);
        const state = useBufferStore.getState();
        const match = Object.values(state.buffers).find((b) => b.number === num);
        if (match) {
          state.setActiveBuffer(match.id);
        }
        return;
      }
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onToggleSearch, onEscape]);
}
