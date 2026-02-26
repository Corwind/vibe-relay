import { useState, useCallback, useRef } from 'react';

interface UseInputOptions {
  onSend: (text: string) => void;
  maxHistory?: number;
}

export function useInput({ onSend, maxHistory = 50 }: UseInputOptions) {
  const [value, setValue] = useState('');
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const savedInputRef = useRef('');

  const send = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;

    historyRef.current = [trimmed, ...historyRef.current.slice(0, maxHistory - 1)];
    historyIndexRef.current = -1;
    savedInputRef.current = '';
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
      }
    },
    [send, historyUp, historyDown, value],
  );

  return {
    value,
    setValue,
    send,
    handleKeyDown,
  };
}
