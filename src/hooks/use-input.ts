import { useState, useCallback, useRef } from 'react';
import { useNicklistStore } from '@/store/nicklist-store';
import { useBufferStore } from '@/store/buffer-store';

interface UseInputOptions {
  onSend: (text: string) => void;
  maxHistory?: number;
}

interface TabCompletionState {
  /** The original text before the word being completed */
  prefix: string;
  /** The partial word the user typed */
  partial: string;
  /** Matching nicks sorted alphabetically */
  matches: string[];
  /** Current index in the matches array */
  index: number;
  /** Whether we're at the start of the line (for `: ` suffix) */
  atStart: boolean;
}

export function useInput({ onSend, maxHistory = 50 }: UseInputOptions) {
  const [value, setValue] = useState('');
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const savedInputRef = useRef('');
  const tabStateRef = useRef<TabCompletionState | null>(null);

  const send = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;

    historyRef.current = [trimmed, ...historyRef.current.slice(0, maxHistory - 1)];
    historyIndexRef.current = -1;
    savedInputRef.current = '';
    tabStateRef.current = null;
    onSend(trimmed);
    setValue('');
  }, [value, onSend, maxHistory]);

  const historyUp = useCallback(() => {
    if (historyRef.current.length === 0) return;
    if (historyIndexRef.current === -1) {
      savedInputRef.current = value;
    }
    const nextIndex = Math.min(historyIndexRef.current + 1, historyRef.current.length - 1);
    historyIndexRef.current = nextIndex;
    setValue(historyRef.current[nextIndex]);
  }, [value]);

  const historyDown = useCallback(() => {
    if (historyIndexRef.current <= -1) return;
    const nextIndex = historyIndexRef.current - 1;
    historyIndexRef.current = nextIndex;
    if (nextIndex < 0) {
      setValue(savedInputRef.current);
    } else {
      setValue(historyRef.current[nextIndex]);
    }
  }, []);

  const tabComplete = useCallback(() => {
    if (!value) return;

    const activeBufferId = useBufferStore.getState().activeBufferId;
    if (!activeBufferId) return;

    const nicks = useNicklistStore.getState().nicklists[activeBufferId];
    if (!nicks || nicks.length === 0) return;

    const tabState = tabStateRef.current;

    // Check if we're continuing a previous completion cycle
    if (tabState && tabState.matches.length > 1) {
      const suffix = tabState.atStart ? ': ' : ' ';
      const expectedValue = tabState.prefix + tabState.matches[tabState.index] + suffix;
      if (value === expectedValue) {
        // Cycle to next match
        const nextIndex = (tabState.index + 1) % tabState.matches.length;
        tabState.index = nextIndex;
        setValue(tabState.prefix + tabState.matches[nextIndex] + suffix);
        return;
      }
    }

    // Start new completion: find the word being typed
    const lastSpace = value.lastIndexOf(' ');
    const prefix = lastSpace === -1 ? '' : value.slice(0, lastSpace + 1);
    const partial = lastSpace === -1 ? value : value.slice(lastSpace + 1);

    if (!partial) return;

    const lowerPartial = partial.toLowerCase();
    const matches = nicks
      .filter((n) => n.name.toLowerCase().startsWith(lowerPartial))
      .map((n) => n.name)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    if (matches.length === 0) return;

    const atStart = prefix === '';
    const suffix = atStart ? ': ' : ' ';

    tabStateRef.current = {
      prefix,
      partial,
      matches,
      index: 0,
      atStart,
    };

    setValue(prefix + matches[0] + suffix);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      } else if (e.key === 'ArrowUp' && !value.includes('\n')) {
        e.preventDefault();
        historyUp();
      } else if (e.key === 'ArrowDown' && !value.includes('\n')) {
        e.preventDefault();
        historyDown();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        tabComplete();
      }
    },
    [send, historyUp, historyDown, tabComplete, value],
  );

  return {
    value,
    setValue,
    send,
    handleKeyDown,
  };
}
