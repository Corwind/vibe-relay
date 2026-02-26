import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useInput } from '../use-input';
import { useNicklistStore } from '@/store/nicklist-store';
import { useBufferStore } from '@/store/buffer-store';

function makeKeyEvent(
  key: string,
  opts: Partial<React.KeyboardEvent<HTMLTextAreaElement>> = {},
): React.KeyboardEvent<HTMLTextAreaElement> {
  return {
    key,
    shiftKey: false,
    preventDefault: vi.fn(),
    ...opts,
  } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;
}

describe('useInput', () => {
  const onSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNicklistStore.setState({ nicklists: {} });
    useBufferStore.setState({ buffers: {}, activeBufferId: null });
  });

  it('sends trimmed text and clears value', () => {
    const { result } = renderHook(() => useInput({ onSend }));
    act(() => result.current.setValue('hello '));
    act(() => result.current.send());
    expect(onSend).toHaveBeenCalledWith('hello');
    expect(result.current.value).toBe('');
  });

  it('does not send empty or whitespace-only input', () => {
    const { result } = renderHook(() => useInput({ onSend }));
    act(() => result.current.setValue('   '));
    act(() => result.current.send());
    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends on Enter key (not shift)', () => {
    const { result } = renderHook(() => useInput({ onSend }));
    act(() => result.current.setValue('test'));
    const e = makeKeyEvent('Enter');
    act(() => result.current.handleKeyDown(e));
    expect(e.preventDefault).toHaveBeenCalled();
    expect(onSend).toHaveBeenCalledWith('test');
  });

  it('does not send on Shift+Enter', () => {
    const { result } = renderHook(() => useInput({ onSend }));
    act(() => result.current.setValue('test'));
    const e = makeKeyEvent('Enter', { shiftKey: true });
    act(() => result.current.handleKeyDown(e));
    expect(onSend).not.toHaveBeenCalled();
  });

  describe('history', () => {
    it('navigates up through history', () => {
      const { result } = renderHook(() => useInput({ onSend }));
      // Send a few messages to build history
      act(() => result.current.setValue('first'));
      act(() => result.current.send());
      act(() => result.current.setValue('second'));
      act(() => result.current.send());

      // ArrowUp should show most recent
      act(() => result.current.handleKeyDown(makeKeyEvent('ArrowUp')));
      expect(result.current.value).toBe('second');

      // Another ArrowUp
      act(() => result.current.handleKeyDown(makeKeyEvent('ArrowUp')));
      expect(result.current.value).toBe('first');
    });

    it('navigates back down and restores saved input', () => {
      const { result } = renderHook(() => useInput({ onSend }));
      act(() => result.current.setValue('msg1'));
      act(() => result.current.send());

      act(() => result.current.setValue('typing'));
      act(() => result.current.handleKeyDown(makeKeyEvent('ArrowUp')));
      expect(result.current.value).toBe('msg1');

      act(() => result.current.handleKeyDown(makeKeyEvent('ArrowDown')));
      expect(result.current.value).toBe('typing');
    });
  });

  describe('tab completion', () => {
    beforeEach(() => {
      useBufferStore.setState({ activeBufferId: 'buf1' });
      useNicklistStore.setState({
        nicklists: {
          buf1: [
            { name: 'alice', prefix: '@', color: '', visible: true, group: '', level: 0 },
            { name: 'bob', prefix: '+', color: '', visible: true, group: '', level: 0 },
            { name: 'bobby', prefix: '', color: '', visible: true, group: '', level: 0 },
            { name: 'charlie', prefix: '', color: '', visible: true, group: '', level: 0 },
          ],
        },
      });
    });

    it('completes a nick from partial input at start of line', () => {
      const { result } = renderHook(() => useInput({ onSend }));
      act(() => result.current.setValue('al'));
      act(() => result.current.handleKeyDown(makeKeyEvent('Tab')));
      expect(result.current.value).toBe('alice: ');
    });

    it('completes a nick in the middle of text', () => {
      const { result } = renderHook(() => useInput({ onSend }));
      act(() => result.current.setValue('hey bo'));
      act(() => result.current.handleKeyDown(makeKeyEvent('Tab')));
      // When not at start of line, no colon suffix
      expect(result.current.value).toBe('hey bob ');
    });

    it('cycles through multiple matches on repeated Tab', () => {
      const { result } = renderHook(() => useInput({ onSend }));
      act(() => result.current.setValue('bo'));

      act(() => result.current.handleKeyDown(makeKeyEvent('Tab')));
      expect(result.current.value).toBe('bob: ');

      act(() => result.current.handleKeyDown(makeKeyEvent('Tab')));
      expect(result.current.value).toBe('bobby: ');

      // Cycles back to first match
      act(() => result.current.handleKeyDown(makeKeyEvent('Tab')));
      expect(result.current.value).toBe('bob: ');
    });

    it('does nothing when no matches found', () => {
      const { result } = renderHook(() => useInput({ onSend }));
      act(() => result.current.setValue('zz'));
      act(() => result.current.handleKeyDown(makeKeyEvent('Tab')));
      expect(result.current.value).toBe('zz');
    });

    it('is case-insensitive', () => {
      const { result } = renderHook(() => useInput({ onSend }));
      act(() => result.current.setValue('AL'));
      act(() => result.current.handleKeyDown(makeKeyEvent('Tab')));
      expect(result.current.value).toBe('alice: ');
    });

    it('resets completion state when input changes between tabs', () => {
      const { result } = renderHook(() => useInput({ onSend }));
      act(() => result.current.setValue('bo'));
      act(() => result.current.handleKeyDown(makeKeyEvent('Tab')));
      expect(result.current.value).toBe('bob: ');

      // User types more, breaking the completion cycle
      act(() => result.current.setValue('bob: hey ch'));
      act(() => result.current.handleKeyDown(makeKeyEvent('Tab')));
      expect(result.current.value).toBe('bob: hey charlie ');
    });

    it('does nothing when no buffer is active', () => {
      useBufferStore.setState({ activeBufferId: null });
      const { result } = renderHook(() => useInput({ onSend }));
      act(() => result.current.setValue('al'));
      act(() => result.current.handleKeyDown(makeKeyEvent('Tab')));
      expect(result.current.value).toBe('al');
    });

    it('does nothing when nicklist is empty', () => {
      useNicklistStore.setState({ nicklists: {} });
      const { result } = renderHook(() => useInput({ onSend }));
      act(() => result.current.setValue('al'));
      act(() => result.current.handleKeyDown(makeKeyEvent('Tab')));
      expect(result.current.value).toBe('al');
    });

    it('does not complete when input is empty', () => {
      const { result } = renderHook(() => useInput({ onSend }));
      act(() => result.current.handleKeyDown(makeKeyEvent('Tab')));
      expect(result.current.value).toBe('');
    });
  });
});
