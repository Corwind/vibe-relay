import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKeyboardShortcuts } from '../use-keyboard-shortcuts';
import { useBufferStore } from '@/store/buffer-store';
import type { WeechatBuffer } from '@/store/types';

function makeBuffer(id: string, number: number): WeechatBuffer {
  return {
    id,
    fullName: `irc.libera.#${id}`,
    shortName: `#${id}`,
    title: '',
    type: 'channel',
    number,
    unreadCount: 0,
    highlightCount: 0,
    isActive: false,
    nicklistVisible: true,
    localVariables: {},
  };
}

describe('useKeyboardShortcuts', () => {
  const onToggleSearch = vi.fn();
  const onEscape = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useBufferStore.setState({
      buffers: {
        a: makeBuffer('a', 1),
        b: makeBuffer('b', 2),
        c: makeBuffer('c', 3),
      },
      activeBufferId: 'b',
    });
  });

  function fireKey(key: string, opts: Partial<KeyboardEventInit> = {}) {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      ...opts,
    });
    act(() => {
      document.dispatchEvent(event);
    });
  }

  it('calls onToggleSearch on Ctrl+K', () => {
    renderHook(() => useKeyboardShortcuts({ onToggleSearch, onEscape }));
    fireKey('k', { ctrlKey: true });
    expect(onToggleSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleSearch on Meta+K (macOS)', () => {
    renderHook(() => useKeyboardShortcuts({ onToggleSearch, onEscape }));
    fireKey('k', { metaKey: true });
    expect(onToggleSearch).toHaveBeenCalledTimes(1);
  });

  it('switches to previous buffer on Alt+ArrowUp', () => {
    renderHook(() => useKeyboardShortcuts({ onToggleSearch, onEscape }));
    fireKey('ArrowUp', { altKey: true });
    expect(useBufferStore.getState().activeBufferId).toBe('a');
  });

  it('switches to next buffer on Alt+ArrowDown', () => {
    renderHook(() => useKeyboardShortcuts({ onToggleSearch, onEscape }));
    fireKey('ArrowDown', { altKey: true });
    expect(useBufferStore.getState().activeBufferId).toBe('c');
  });

  it('wraps around when going past last buffer', () => {
    useBufferStore.setState({ activeBufferId: 'c' });
    renderHook(() => useKeyboardShortcuts({ onToggleSearch, onEscape }));
    fireKey('ArrowDown', { altKey: true });
    expect(useBufferStore.getState().activeBufferId).toBe('a');
  });

  it('switches to buffer by number on Alt+1-9', () => {
    renderHook(() => useKeyboardShortcuts({ onToggleSearch, onEscape }));
    fireKey('3', { altKey: true });
    expect(useBufferStore.getState().activeBufferId).toBe('c');
  });

  it('calls onEscape on Escape key', () => {
    renderHook(() => useKeyboardShortcuts({ onToggleSearch, onEscape }));
    fireKey('Escape');
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('does not fire when typing in an input', () => {
    renderHook(() => useKeyboardShortcuts({ onToggleSearch, onEscape }));

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: input });
    act(() => {
      document.dispatchEvent(event);
    });

    // Ctrl+K should still fire even in inputs (it's a global shortcut)
    expect(onToggleSearch).toHaveBeenCalledTimes(1);

    document.body.removeChild(input);
  });
});
