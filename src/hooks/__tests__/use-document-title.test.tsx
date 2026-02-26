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
    document.title = 'relay-client';
    useBufferStore.setState({ buffers: {}, activeBufferId: null });
  });

  it('shows default title when no buffers', () => {
    renderHook(() => useDocumentTitle());
    expect(document.title).toBe('relay-client');
  });

  it('shows unread highlight count in title', () => {
    useBufferStore.setState({
      buffers: {
        a: makeBuffer('a', 1, { highlightCount: 3 }),
        b: makeBuffer('b', 2, { highlightCount: 1 }),
      },
    });
    renderHook(() => useDocumentTitle());
    expect(document.title).toBe('(4) relay-client');
  });

  it('clears count prefix when highlights go to zero', () => {
    useBufferStore.setState({
      buffers: {
        a: makeBuffer('a', 1, { highlightCount: 2 }),
      },
    });
    const { rerender } = renderHook(() => useDocumentTitle());
    expect(document.title).toBe('(2) relay-client');

    act(() => {
      useBufferStore.setState({
        buffers: {
          a: makeBuffer('a', 1, { highlightCount: 0 }),
        },
      });
    });
    rerender();
    expect(document.title).toBe('relay-client');
  });

  it('shows active buffer name in title', () => {
    useBufferStore.setState({
      buffers: {
        a: makeBuffer('a', 1),
      },
      activeBufferId: 'a',
    });
    renderHook(() => useDocumentTitle());
    expect(document.title).toBe('#a - relay-client');
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
    expect(document.title).toBe('(5) #b - relay-client');
  });
});
