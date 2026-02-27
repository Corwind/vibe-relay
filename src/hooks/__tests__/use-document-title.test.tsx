import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentTitle } from '../use-document-title';
import { useBufferStore } from '@/store/buffer-store';
import type { WeechatBuffer } from '@/store/types';

function makeBuffer(
  id: string,
  number: number,
  overrides: Partial<WeechatBuffer> = {},
): WeechatBuffer {
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
    ...overrides,
  };
}

describe('useDocumentTitle', () => {
  beforeEach(() => {
    document.title = 'vibe-relay';
    useBufferStore.setState({ buffers: {}, activeBufferId: null });
  });

  it('shows default title when no buffers', () => {
    renderHook(() => useDocumentTitle());
    expect(document.title).toBe('vibe-relay');
  });

  it('shows unread highlight count in title', () => {
    useBufferStore.setState({
      buffers: {
        a: makeBuffer('a', 1, { highlightCount: 3 }),
        b: makeBuffer('b', 2, { highlightCount: 1 }),
      },
    });
    renderHook(() => useDocumentTitle());
    expect(document.title).toBe('(4) vibe-relay');
  });

  it('clears count prefix when highlights go to zero', () => {
    useBufferStore.setState({
      buffers: {
        a: makeBuffer('a', 1, { highlightCount: 2 }),
      },
    });
    const { rerender } = renderHook(() => useDocumentTitle());
    expect(document.title).toBe('(2) vibe-relay');

    act(() => {
      useBufferStore.setState({
        buffers: {
          a: makeBuffer('a', 1, { highlightCount: 0 }),
        },
      });
    });
    rerender();
    expect(document.title).toBe('vibe-relay');
  });

  it('shows active buffer name in title', () => {
    useBufferStore.setState({
      buffers: {
        a: makeBuffer('a', 1),
      },
      activeBufferId: 'a',
    });
    renderHook(() => useDocumentTitle());
    expect(document.title).toBe('#a - vibe-relay');
  });

  it('shows both unread count and active buffer name', () => {
    useBufferStore.setState({
      buffers: {
        a: makeBuffer('a', 1, { highlightCount: 5 }),
        b: makeBuffer('b', 2),
      },
      activeBufferId: 'b',
    });
    renderHook(() => useDocumentTitle());
    expect(document.title).toBe('(5) #b - vibe-relay');
  });
});
